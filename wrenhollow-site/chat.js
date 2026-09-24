/* Wrenhollow — "Ask the brewer" chat widget.
 * Only appears when served by server.mjs with an API key (GET /api/chat/status → {enabled:true}).
 * Replies stream from POST /api/chat as newline-delimited JSON and are rendered as plain text. */
(() => {
  "use strict";
  const GREETING = "Hello! I'm the Wrenhollow host. Ask me about what's pouring, tours, or planning a visit.";
  const SUGGESTIONS = ["What's on tap?", "Which tour should I book?", "When are you open?"];
  const history = []; // {role, content}
  let busy = false;

  async function enabled() {
    try {
      const r = await fetch("/api/chat/status", { cache: "no-store" });
      if (!r.ok) return false;
      return (await r.json()).enabled === true;
    } catch { return false; }
  }

  function build() {
    const wrap = document.createElement("div");
    wrap.className = "chat";
    wrap.innerHTML = `
      <button class="chat-toggle" type="button" aria-expanded="false" aria-controls="chat-panel">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 3 13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
        <span class="chat-toggle-label">Ask the brewer</span>
      </button>
      <section class="chat-panel" id="chat-panel" role="dialog" aria-label="Ask the brewer" hidden>
        <header class="chat-head">
          <img src="assets/logo-mark.svg" alt="" width="32" height="32">
          <div><strong>Ask the brewer</strong><span>AI assistant · answers may be imperfect</span></div>
          <button class="chat-close" type="button" aria-label="Close chat">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>
        <div class="chat-log" role="log" aria-live="polite"></div>
        <div class="chat-suggest"></div>
        <form class="chat-form">
          <label class="sr-only" for="chat-input">Your question</label>
          <textarea id="chat-input" rows="1" maxlength="1500" placeholder="Ask about beers, tours, hours…" required></textarea>
          <button class="chat-send" type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg>
          </button>
        </form>
      </section>`;
    document.body.append(wrap);
    document.body.classList.add("has-chat");

    const toggle = wrap.querySelector(".chat-toggle");
    const panel = wrap.querySelector(".chat-panel");
    const log = wrap.querySelector(".chat-log");
    const form = wrap.querySelector(".chat-form");
    const input = wrap.querySelector("textarea");
    const suggest = wrap.querySelector(".chat-suggest");

    const add = (role, text) => {
      const p = document.createElement("p");
      p.className = `chat-msg chat-${role}`;
      p.textContent = text;
      log.append(p);
      log.scrollTop = log.scrollHeight;
      return p;
    };
    add("assistant", GREETING);
    for (const s of SUGGESTIONS) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = s;
      b.addEventListener("click", () => ask(s));
      suggest.append(b);
    }

    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      wrap.classList.add("is-open");
      input.focus();
    }
    function close() {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      wrap.classList.remove("is-open");
      toggle.focus();
    }
    toggle.addEventListener("click", () => (panel.hidden ? open() : close()));
    wrap.querySelector(".chat-close").addEventListener("click", close);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } });

    const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; };
    input.addEventListener("input", grow);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) ask(q);
    });

    async function ask(question) {
      if (busy) return;
      busy = true;
      suggest.hidden = true;
      input.value = ""; grow();
      form.classList.add("is-busy");
      add("user", question);
      history.push({ role: "user", content: question });
      const bubble = add("assistant", "");
      bubble.classList.add("is-typing");
      let reply = "";
      let failed = null;
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (!r.ok || !r.body) {
          let msg = "Sorry, the assistant is unavailable right now.";
          try { msg = (await r.json()).error || msg; } catch {}
          throw new Error(msg);
        }
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line);
            if (ev.t === "text") {
              reply += ev.v;
              bubble.classList.remove("is-typing");
              bubble.textContent = reply;
              log.scrollTop = log.scrollHeight;
            } else if (ev.t === "error") failed = ev.v;
          }
        }
      } catch (err) {
        failed = err.message || "Sorry, something went wrong.";
      }
      bubble.classList.remove("is-typing");
      if (failed) {
        // Drop the unanswered question so the history stays user/assistant alternating.
        history.pop();
        if (reply) bubble.remove();
        const note = reply ? add("assistant", failed) : bubble;
        note.textContent = failed;
        note.classList.add("chat-error");
      } else {
        history.push({ role: "assistant", content: reply });
      }
      form.classList.remove("is-busy");
      busy = false;
      input.focus();
    }
  }

  enabled().then((on) => { if (on) build(); });
})();
