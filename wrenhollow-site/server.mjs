// Wrenhollow — static site server + AI chat assistant.
//   GEMINI_API_KEY=...             node server.mjs   → http://localhost:8000   (free tier, no npm install)
//   GROQ_API_KEY=gsk_...           node server.mjs   (free tier)
//   DEEPSEEK_API_KEY=sk-...        node server.mjs
//   ANTHROPIC_API_KEY=sk-ant-...   npm start          (Claude; run `npm install` first)
// The API key stays on this server; the browser only talks to /api/chat.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// Load API keys and settings from a private .env file next to this script (never served or committed).
// Lines look like GEMINI_API_KEY=... ; anything already set in the terminal wins.
try {
  for (const raw of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const line = raw.trim().replace(/^export\s+/, "");
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || line.startsWith("#")) continue;
    const value = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
} catch (err) {
  if (err.code !== "ENOENT") console.error("[config] couldn't read .env:", err.message);
}
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "127.0.0.1";
// OpenAI-compatible chat services: key variable, default endpoint and model (override with
// <NAME>_BASE_URL and CHAT_MODEL if a service renames things).
const COMPAT = {
  gemini:   { name: "Gemini",   keyEnv: "GEMINI_API_KEY",   base: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash", keys: "aistudio.google.com/apikey" },
  groq:     { name: "Groq",     keyEnv: "GROQ_API_KEY",     base: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", keys: "console.groq.com/keys" },
  deepseek: { name: "DeepSeek", keyEnv: "DEEPSEEK_API_KEY", base: "https://api.deepseek.com", model: "deepseek-chat", keys: "platform.deepseek.com" },
};

// Which AI answers the chat: CHAT_PROVIDER=gemini|groq|deepseek|claude, or the first one whose key is set.
const PROVIDER = (process.env.CHAT_PROVIDER ||
  Object.keys(COMPAT).find((id) => process.env[COMPAT[id].keyEnv]) ||
  (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "claude" : "")).toLowerCase();

// Abuse limits for a public chat box.
const MAX_TURNS = 20;            // messages kept from the conversation
const MAX_CHARS = 1500;          // per visitor message
const RATE_LIMIT = 20;           // requests per IP…
const RATE_WINDOW_MS = 10 * 60 * 1000; // …per 10 minutes

/* ---------------- System prompt from content.js ---------------- */
function loadContent() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "content.js"), "utf8"), sandbox);
  return sandbox.window.WRENHOLLOW;
}

function buildSystemPrompt(C) {
  const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const lines = [
    `You are the friendly host at ${C.brand.name} ${C.brand.tagline}, answering visitors in the chat box on the website.`,
    "",
    "Wrenhollow is a FICTIONAL business used as a website demo. Everything you know about it is below; do not invent other facts (awards, history, staff names, events, dog policy, parking prices and so on). If something isn't covered, say you're not sure and suggest they ask the team when they visit.",
    "",
    "## About",
    ...Object.values(C.chapters).map((ch) => `- ${strip(ch.title).replace(/[.:]$/, "")} — ${ch.body}`),
    "",
    "## What's pouring (sample prices)",
    ...C.range.map((p) => `- ${p.name} (${p.kind}), ${p.price}. ${p.note}`),
    "",
    "## Tours & tastings",
    ...C.tours.map((t) => `- ${t.name}: ${t.time}, ${t.price}. ${t.body}`),
    "",
    "## How it's made",
    ...C.process.map((s) => `- ${s.title}: ${s.body}`),
    "",
    "## Visit",
    `- Address: ${C.visit.address.join(", ")}`,
    ...C.visit.hours.map(([d, h]) => `- ${d}: ${h}`),
    `- ${C.visit.note}`,
    "",
    "## How to answer",
    "- Keep replies short: two to four sentences, warm and plain-spoken. Plain text only, no markdown, headings or bullet symbols.",
    "- You can't take or confirm bookings. Point people to the \"Book a tasting\" form in the Visit section of this page (it is a demo form and doesn't send yet).",
    "- Stick to Wrenhollow, its drinks, tours and visiting. Politely steer other topics back.",
    "- Encourage responsible drinking. Tastings are for over-18s; don't give drinking advice to anyone who says they're under 18.",
  ];
  return lines.join("\n");
}

const content = loadContent();
const SYSTEM_PROMPT = buildSystemPrompt(content);

/* ---------------- Chat providers ----------------
 * Each provider streams a reply: reply(messages, signal, onText) → { refused }.
 * explain(err) turns a failure into a log line for you and a polite message for the visitor. */
const SORRY = "Sorry, the assistant is unavailable right now. Please try again shortly.";

class HttpError extends Error {
  constructor(status, body) { super(`HTTP ${status}: ${body.slice(0, 300)}`); this.status = status; }
}

// Gemini / Groq / DeepSeek: OpenAI-compatible Chat Completions over plain fetch (Node 18+), streamed as server-sent events.
function compatProvider(id) {
  const svc = COMPAT[id];
  const key = process.env[svc.keyEnv];
  if (!key) { console.error(`[chat] CHAT_PROVIDER=${id} but ${svc.keyEnv} is not set`); return null; }
  const base = (process.env[`${id.toUpperCase()}_BASE_URL`] || svc.base).replace(/\/+$/, "");
  const model = process.env.CHAT_MODEL || svc.model;
  return {
    label: `${svc.name} (${model})`,
    async reply(messages, signal, onText) {
      const r = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          stream: true,
          max_tokens: 2048, // short chat replies; also caps spend per question
        }),
      });
      if (!r.ok) throw new HttpError(r.status, await r.text().catch(() => ""));
      const dec = new TextDecoder();
      let buf = "", finish = null;
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue; // skip blank lines and ": keep-alive" comments
          const data = line.slice(5).trim();
          if (data === "[DONE]") return { refused: finish === "content_filter" };
          const choice = JSON.parse(data).choices?.[0];
          if (choice?.delta?.content) onText(choice.delta.content); // reasoning_content (reasoner models) is not shown
          if (choice?.finish_reason) finish = choice.finish_reason;
        }
      }
      return { refused: finish === "content_filter" };
    },
    explain(err) {
      switch (err.status) {
        case 401: case 403: return { log: `${svc.name} rejected the API key (${err.status}): check ${svc.keyEnv} (keys: ${svc.keys})`, msg: SORRY };
        case 402: return { log: `${svc.name} account has insufficient balance (402): top up at ${svc.keys}`, msg: SORRY };
        case 404: return { log: `${svc.name} doesn't know model "${model}" or the URL (404): set CHAT_MODEL to a current model. ${err.message}`, msg: SORRY };
        case 429: return { log: `${svc.name} rate or free-tier limit reached (429). ${err.message}`, msg: "We're busy right now. Please try again in a minute." };
        default: return { log: err.status ? `${svc.name} error: ${err.message}` : err, msg: SORRY };
      }
    },
  };
}

// Claude: official Anthropic SDK (loaded only when used, so DeepSeek needs no npm install).
async function claudeProvider() {
  let Anthropic;
  try { ({ default: Anthropic } = await import("@anthropic-ai/sdk")); }
  catch { console.error("[chat] Claude needs the Anthropic SDK: run `npm install` in wrenhollow-site"); return null; }
  const client = new Anthropic();
  const model = process.env.CHAT_MODEL || "claude-opus-5";
  return {
    label: `Claude (${model})`,
    async reply(messages, signal, onText) {
      const stream = client.beta.messages.stream({
        model,
        max_tokens: 4096, // short chat replies; also caps spend per question
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        // Server-side refusal fallback: a declined request is re-run on Anthropic's recommended model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: SYSTEM_PROMPT + "\n- Latency-sensitive; begin your visible answer immediately.", cache_control: { type: "ephemeral" } }],
        messages,
      });
      signal.addEventListener("abort", () => stream.abort());
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
      }
      const final = await stream.finalMessage();
      return { refused: final.stop_reason === "refusal" };
    },
    explain(err) {
      if (err instanceof Anthropic.AuthenticationError) return { log: "invalid Anthropic API key", msg: SORRY };
      if (err instanceof Anthropic.RateLimitError) return { log: "rate limited by the Claude API", msg: "We're busy right now. Please try again in a minute." };
      if (err instanceof Anthropic.BadRequestError) return { log: `bad request: ${err.message}`, msg: SORRY };
      if (err instanceof Anthropic.APIError) return { log: `Claude API error ${err.status}: ${err.message}`, msg: SORRY };
      return { log: err, msg: SORRY };
    },
  };
}

const chat = COMPAT[PROVIDER] ? compatProvider(PROVIDER)
  : PROVIDER === "claude" ? await claudeProvider()
  : null;
if (PROVIDER && !COMPAT[PROVIDER] && PROVIDER !== "claude") console.error(`[chat] unknown CHAT_PROVIDER "${PROVIDER}" (use gemini, groq, deepseek or claude)`);

/* ---------------- Helpers ---------------- */
const hits = new Map(); // ip -> timestamps
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("bad json")); }
    });
    req.on("error", reject);
  });
}

/** Accept only a clean, alternating user/assistant history of plain strings, ending on the user. */
function cleanMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const msgs = input.slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  const out = [];
  for (const m of msgs) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const text = m.content.trim().slice(0, m.role === "user" ? MAX_CHARS : 4000);
    if (!text) return null;
    if (out.length && out[out.length - 1].role === m.role) return null;
    out.push({ role: m.role, content: text });
  }
  return out.length && out[out.length - 1].role === "user" ? out : null;
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

/* ---------------- /api/chat ---------------- */
async function handleChat(req, res) {
  if (!chat) return json(res, 503, { error: "The chat assistant isn't configured on this server." });
  const ip = req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) return json(res, 429, { error: "That's a lot of questions! Please try again in a few minutes." });

  let body;
  try { body = await readJson(req); } catch { return json(res, 400, { error: "Bad request." }); }
  const messages = cleanMessages(body?.messages);
  if (!messages) return json(res, 400, { error: "Bad request." });

  // Stream newline-delimited JSON events: {t:"text",v} … then {t:"done"} or {t:"error",v}.
  res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" });
  const send = (obj) => res.write(JSON.stringify(obj) + "\n");

  // Stop the upstream request if the visitor closes the chat mid-reply.
  const ac = new AbortController();
  res.on("close", () => { if (!res.writableEnded) ac.abort(); });

  try {
    const { refused } = await chat.reply(messages, ac.signal, (text) => send({ t: "text", v: text }));
    if (refused) send({ t: "error", v: "Sorry, I can't help with that one. Ask me about our beers, spirits, tours or visiting." });
    else send({ t: "done" });
  } catch (err) {
    if (ac.signal.aborted) return;
    const { log, msg } = chat.explain(err);
    console.error("[chat]", log);
    send({ t: "error", v: msg });
  }
  res.end();
}

/* ---------------- Static files ---------------- */
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".md": "text/plain; charset=utf-8",
};
const PRIVATE = new Set(["server.mjs", "package.json", "package-lock.json", "node_modules", ".env"]);

function serveStatic(req, res) {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  const top = path.relative(ROOT, file).split(path.sep)[0];
  if (!file.startsWith(ROOT + path.sep) || PRIVATE.has(top) || top.startsWith(".")) { res.writeHead(404).end("Not found"); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": st.size,
      "cache-control": rel.startsWith("/frames/") ? "public, max-age=31536000, immutable" : "no-cache",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------- Server ---------------- */
http.createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  if (pathname === "/api/chat/status" && req.method === "GET") return json(res, 200, { enabled: !!chat });
  if (pathname === "/api/chat" && req.method === "POST") return void handleChat(req, res);
  if (pathname.startsWith("/api/")) return json(res, 404, { error: "Not found" });
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
  serveStatic(req, res);
}).listen(PORT, HOST, () => {
  console.log(`Wrenhollow running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(chat ? `Chat assistant on: ${chat.label}.` : "Chat assistant off: set GEMINI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY or ANTHROPIC_API_KEY to turn it on.");
});
