// Wrenhollow — static site server + Claude chat assistant.
//   ANTHROPIC_API_KEY=sk-ant-... npm start      → http://localhost:8000
// The API key stays on this server; the browser only talks to /api/chat.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "127.0.0.1";
const MODEL = process.env.CHAT_MODEL || "claude-opus-5";

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
    "- Latency-sensitive; begin your visible answer immediately.",
  ];
  return lines.join("\n");
}

const content = loadContent();
const SYSTEM_PROMPT = buildSystemPrompt(content);
const client = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? new Anthropic() : null;

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
  if (!client) return json(res, 503, { error: "The chat assistant isn't configured on this server." });
  const ip = req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) return json(res, 429, { error: "That's a lot of questions! Please try again in a few minutes." });

  let body;
  try { body = await readJson(req); } catch { return json(res, 400, { error: "Bad request." }); }
  const messages = cleanMessages(body?.messages);
  if (!messages) return json(res, 400, { error: "Bad request." });

  // Stream newline-delimited JSON events: {t:"text",v} … then {t:"done"} or {t:"error",v}.
  res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" });
  const send = (obj) => res.write(JSON.stringify(obj) + "\n");

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4096, // short chat replies; also caps spend per question
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    // Server-side refusal fallback: a declined request is re-run on Anthropic's recommended model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
  });

  let clientGone = false;
  res.on("close", () => { if (!res.writableEnded) { clientGone = true; stream.abort(); } });

  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ t: "text", v: event.delta.text });
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      send({ t: "error", v: "Sorry, I can't help with that one. Ask me about our beers, spirits, tours or visiting." });
    } else {
      send({ t: "done" });
    }
  } catch (err) {
    if (clientGone) return;
    let msg = "Sorry, the assistant is unavailable right now. Please try again shortly.";
    if (err instanceof Anthropic.AuthenticationError) console.error("[chat] invalid API key");
    else if (err instanceof Anthropic.RateLimitError) { console.error("[chat] rate limited by API"); msg = "We're busy right now. Please try again in a minute."; }
    else if (err instanceof Anthropic.BadRequestError) console.error("[chat] bad request:", err.message);
    else if (err instanceof Anthropic.APIError) console.error(`[chat] API error ${err.status}:`, err.message);
    else console.error("[chat] error:", err);
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
  if (pathname === "/api/chat/status" && req.method === "GET") return json(res, 200, { enabled: !!client });
  if (pathname === "/api/chat" && req.method === "POST") return void handleChat(req, res);
  if (pathname.startsWith("/api/")) return json(res, 404, { error: "Not found" });
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
  serveStatic(req, res);
}).listen(PORT, HOST, () => {
  console.log(`Wrenhollow running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(client ? `Chat assistant on (${MODEL}).` : "Chat assistant off: set ANTHROPIC_API_KEY to turn it on.");
});
