/* Wrenhollow — fly-through engine, page rendering and UI behaviour. */
(() => {
  "use strict";
  const C = window.WRENHOLLOW;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (html) n.innerHTML = html;
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const phoneMQ = matchMedia("(max-width: 760px)");

  /* ---------------- Page content ---------------- */
  function renderContent() {
    const glyphs = ["◐", "●", "◒", "✦", "◆", "✺"];
    const range = $("#range-grid");
    C.range.forEach((p, i) => {
      range.append(el("article", { class: "card" },
        `<span class="card-glyph" aria-hidden="true">${glyphs[i % glyphs.length]}</span>
         <p class="kind">${p.kind}</p><h3>${p.name}</h3><p>${p.note}</p>
         <p class="price">${p.price}</p>`));
    });

    const tours = $("#tour-grid");
    const tourSelect = $("#b-tour");
    C.tours.forEach((t) => {
      tours.append(el("article", { class: "tour" + (t.featured ? " is-featured" : "") },
        `${t.featured ? '<span class="badge">Most booked</span>' : ""}
         <h3>${t.name}</h3>
         <div class="meta"><span>${t.time}</span><strong>${t.price}</strong></div>
         <p>${t.body}</p>
         <a class="btn ${t.featured ? "btn-primary" : "btn-ghost"}" href="#visit" data-tour="${t.name}">Book this</a>`));
      tourSelect.append(el("option", {}, `${t.name} (${t.price})`));
    });
    tours.addEventListener("click", (e) => {
      const a = e.target.closest("[data-tour]");
      if (!a) return;
      const i = C.tours.findIndex((t) => t.name === a.dataset.tour);
      if (i >= 0) tourSelect.selectedIndex = i;
    });

    const proc = $("#process-list");
    C.process.forEach((s) => proc.append(el("li", {},
      `<span class="n">${s.n}</span><h3>${s.title}</h3><p>${s.body}</p>`)));

    $("#visit-address").innerHTML = C.visit.address.join("<br>");
    const hours = $("#visit-hours");
    const tb = el("tbody");
    C.visit.hours.forEach(([d, h]) => tb.append(el("tr", {}, `<th scope="row">${d}</th><td>${h}</td>`)));
    hours.append(tb);
    $("#visit-note").textContent = C.visit.note;
  }

  /* ---------------- Chapters ---------------- */
  const chapterEls = {};
  function renderChapters() {
    const host = $("#chapters");
    let first = true;
    for (const [id, ch] of Object.entries(C.chapters)) {
      const heading = first ? "h1" : "h2";
      const art = el("article", { class: "chapter", "data-id": id, "data-side": ch.side },
        `<p class="eyebrow">${ch.eyebrow}</p>
         <${heading}><span class="full">${ch.title}</span><span class="short">${ch.short}</span></${heading}>
         <p class="body">${ch.body}</p>
         ${ch.actions.length ? `<div class="actions">${ch.actions.map((a) =>
            `<a class="btn ${a.primary ? "btn-primary" : "btn-ghost"}" href="${a.href}">${a.label}</a>`).join("")}</div>` : ""}`);
      art.style.setProperty("--still", `url("${ch.still}"), url("${C.flight.poster}")`);
      host.append(art);
      chapterEls[id] = art;
      first = false;
    }
  }

  /* ---------------- Timeline ---------------- */
  const flight = $("#flight");
  const stage = $(".stage", flight);
  const canvas = $(".stage-canvas", stage);
  const ctx = canvas.getContext("2d", { alpha: false });
  const progressBar = $(".progress-bar", stage);

  let timeline = null;   // { beats:[{a,b,...}], total, chapters:[{id,a,b}] }
  let vhPx = innerHeight;

  function buildTimeline() {
    const phone = phoneMQ.matches;
    let acc = 0;
    const beats = C.flight.beats.map((b) => {
      const len = phone && b.mvh != null ? b.mvh : b.vh;
      const beat = { ...b, a: acc, b: acc + len };
      acc += len;
      return beat;
    });
    const chapters = [];
    for (const b of beats) {
      if (!b.chapter) continue;
      const last = chapters[chapters.length - 1];
      if (last && last.id === b.chapter && Math.abs(last.b - b.a) < 1e-6) last.b = b.b;
      else chapters.push({ id: b.chapter, a: b.a, b: b.b });
    }
    timeline = { beats, total: acc, chapters };
  }

  function layout() {
    vhPx = innerHeight;
    if (!flight.classList.contains("is-static")) {
      flight.style.height = `${(timeline.total + 1) * vhPx}px`;
    }
    sizeCanvas();
  }

  /** scroll position within the flight, in viewport heights */
  function scrollPos() {
    const top = flight.getBoundingClientRect().top;
    return clamp(-top / vhPx, 0, timeline.total);
  }

  function beatAt(pos) {
    const bs = timeline.beats;
    for (const b of bs) if (pos <= b.b) return b;
    return bs[bs.length - 1];
  }

  function timeAt(pos) {
    const b = beatAt(pos);
    const t = b.b > b.a ? clamp((pos - b.a) / (b.b - b.a), 0, 1) : 0;
    return b.from + (b.to - b.from) * t;
  }

  /** eased horizontal focus for tall screens, interpolated between beats */
  function focusAt(pos) {
    const bs = timeline.beats;
    const f = (b) => (b.focus == null ? 0.5 : b.focus);
    const b = beatAt(pos);
    const i = bs.indexOf(b);
    const t = b.b > b.a ? clamp((pos - b.a) / (b.b - b.a), 0, 1) : 0;
    const next = bs[i + 1];
    if (!next || t < 0.6) return f(b);
    return f(b) + (f(next) - f(b)) * smooth((t - 0.6) / 0.4);
  }

  function chapterOpacity(ch, pos) {
    const len = ch.b - ch.a;
    const fade = Math.min(0.4, len * 0.25);
    const isFirst = ch.a === 0;
    const isLast = Math.abs(ch.b - timeline.total) < 1e-6;
    let o = 1;
    if (!isFirst) o = Math.min(o, clamp((pos - ch.a) / fade, 0, 1));
    if (!isLast) o = Math.min(o, clamp((ch.b - pos) / fade, 0, 1));
    if (pos < ch.a || pos > ch.b) o = 0;
    if (isFirst && pos <= 0) o = 1;
    return smooth(o);
  }

  /* ---------------- Frames ---------------- */
  const frames = {
    manifest: null, count: 0, fps: 20, base: "", version: "1",
    cache: new Map(),           // idx -> ImageBitmap | HTMLImageElement
    inflight: new Map(),        // idx -> AbortController
    failures: new Map(),
    maxCache: 90, maxInflight: 6,
    current: -1, drawn: -1, dir: 1, lastIdx: 0,
  };

  function frameUrl(i) {
    const num = String(i + (frames.manifest.start || 0)).padStart(frames.manifest.pad || 4, "0");
    return `${frames.base}${frames.manifest.pattern.replace("%04d", num)}?v=${encodeURIComponent(frames.version)}`;
  }

  async function decode(blob) {
    if ("createImageBitmap" in window) return createImageBitmap(blob);
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    return img;
  }

  function release(img) { if (img && typeof img.close === "function") img.close(); }

  function evict(center) {
    if (frames.cache.size <= frames.maxCache) return;
    const keys = [...frames.cache.keys()].sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
    while (frames.cache.size > frames.maxCache && keys.length) {
      const k = keys.shift();
      if (k === frames.drawn) continue;
      release(frames.cache.get(k));
      frames.cache.delete(k);
    }
  }

  function load(i) {
    const ctl = new AbortController();
    frames.inflight.set(i, ctl);
    fetch(frameUrl(i), { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(decode)
      .then((img) => {
        if (!frames.manifest) { release(img); return; }
        frames.cache.set(i, img);
        frames.failures.delete(i);
        evict(frames.current);
        if (Math.abs(i - frames.current) <= 12) requestDraw();
      })
      .catch((err) => {
        if (err.name !== "AbortError") frames.failures.set(i, (frames.failures.get(i) || 0) + 1);
      })
      .finally(() => { frames.inflight.delete(i); pump(); });
  }

  /** request the frame needed now, then prefetch in the scroll direction */
  function pump() {
    if (!frames.manifest) return;
    const c = frames.current, n = frames.count, d = frames.dir;
    const want = [c];
    for (let k = 1; k <= 30; k++) {
      want.push(c + d * k);
      if (k <= 8) want.push(c - d * k);
    }
    const wanted = new Set(want.filter((i) => i >= 0 && i < n));
    for (const [i, ctl] of frames.inflight) if (!wanted.has(i)) { ctl.abort(); frames.inflight.delete(i); }
    for (const i of wanted) {
      if (frames.inflight.size >= frames.maxInflight) break;
      if (frames.cache.has(i) || frames.inflight.has(i)) continue;
      if ((frames.failures.get(i) || 0) >= 3) continue;
      load(i);
    }
  }

  function nearestCached(i) {
    if (frames.cache.has(i)) return i;
    for (let k = 1; k < 24; k++) {
      if (frames.cache.has(i - k * frames.dir)) return i - k * frames.dir;
      if (frames.cache.has(i + k * frames.dir)) return i + k * frames.dir;
    }
    return -1;
  }

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; frames.drawn = -1; }
  }

  function draw(idx, focus) {
    const k = nearestCached(idx);
    if (k < 0) return;
    const img = frames.cache.get(k);
    const cw = canvas.width, ch = canvas.height;
    const fw = img.width, fh = img.height;
    const s = Math.max(cw / fw, ch / fh);
    const dw = fw * s, dh = fh * s;
    const x = (cw - dw) * clamp(focus, 0, 1);
    const y = (ch - dh) / 2;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, dw, dh);
    frames.drawn = k;
    if (!stage.classList.contains("is-live")) stage.classList.add("is-live");
  }

  /* ---------------- Render loop ---------------- */
  let raf = 0;
  function requestDraw() { if (!raf) raf = requestAnimationFrame(render); }

  function render() {
    raf = 0;
    if (!timeline || flight.classList.contains("is-static")) return;
    const pos = scrollPos();

    if (frames.manifest) {
      const idx = clamp(Math.round(timeAt(pos) * frames.fps), 0, frames.count - 1);
      if (idx !== frames.current) {
        frames.dir = idx >= frames.current ? 1 : -1;
        frames.current = idx;
        pump();
      }
      draw(idx, phoneMQ.matches && !frames.manifest.preCropped ? focusAt(pos) : 0.5);
      stage.dataset.frame = idx;
    }

    let activeSide = "none";
    for (const ch of timeline.chapters) {
      const o = chapterOpacity(ch, pos);
      const art = chapterEls[ch.id];
      art.style.opacity = o.toFixed(3);
      art.style.setProperty("--shift", `${((1 - o) * 18).toFixed(1)}px`);
      const visible = o > 0.01, active = o > 0.5;
      art.classList.toggle("is-visible", visible);
      art.classList.toggle("is-active", active);
      if (active) { art.removeAttribute("inert"); art.removeAttribute("aria-hidden"); activeSide = C.chapters[ch.id].side; }
      else { art.setAttribute("inert", ""); art.setAttribute("aria-hidden", "true"); }
    }
    stage.dataset.side = activeSide;
    stage.classList.toggle("is-moving", pos > 0.15);
    progressBar.style.transform = `scaleX(${(pos / timeline.total).toFixed(4)})`;
  }

  /* ---------------- Static fallback ---------------- */
  function goStatic() {
    flight.classList.add("is-static");
    flight.style.height = "";
    for (const art of Object.values(chapterEls)) {
      art.removeAttribute("inert"); art.removeAttribute("aria-hidden"); art.style.opacity = "";
    }
    for (const img of frames.cache.values()) release(img);
    frames.cache.clear();
    for (const ctl of frames.inflight.values()) ctl.abort();
    frames.inflight.clear();
    frames.manifest = null;
  }

  async function initFlight() {
    buildTimeline();
    if (reduceMotion.matches) { goStatic(); return; }
    layout();
    render();
    try {
      const url = C.flight.manifest;
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error("manifest " + r.status);
      const m = await r.json();
      // phones take the pre-cropped portrait sequence unless a beat needs an off-centre focus
      const needsFocus = C.flight.beats.some((b) => b.focus != null && b.focus !== 0.5);
      const usePortrait = phoneMQ.matches && m.portrait && !needsFocus;
      const seq = usePortrait ? m.portrait : m;
      frames.manifest = { ...seq, preCropped: usePortrait, pattern: seq.pattern || m.pattern, pad: seq.pad || m.pad, start: seq.start ?? m.start };
      frames.count = seq.count;
      frames.fps = m.fps;
      frames.version = String(m.version || "1");
      frames.base = new URL(seq.dir || m.dir || "./", new URL(url, location.href)).href;
      frames.maxCache = phoneMQ.matches ? 60 : 90;
      frames.current = -1;
      requestDraw();
    } catch (e) {
      console.warn("[wrenhollow] fly-through frames unavailable, using stills", e);
      goStatic();
    }
  }

  /* ---------------- Header & menu ---------------- */
  const header = $(".site-header");
  function updateHeader() {
    const hb = header.getBoundingClientRect().bottom;
    const fb = flight.getBoundingClientRect().bottom;
    const solid = flight.classList.contains("is-static") ? window.scrollY > 40 : fb <= hb + 1;
    header.dataset.state = solid ? "solid" : "glass";
  }

  function initMenu() {
    const toggle = $(".menu-toggle"), menu = $("#mobile-menu"), close = $(".menu-close", menu);
    let lastFocus = null;
    const focusables = () => [...menu.querySelectorAll("a, button")];
    function open() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      requestAnimationFrame(() => menu.classList.add("is-open"));
      close.focus();
    }
    function shut(restore = true) {
      menu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.hidden = true;
      if (restore && lastFocus) lastFocus.focus();
    }
    toggle.addEventListener("click", () => (menu.hidden ? open() : shut()));
    close.addEventListener("click", () => shut());
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) shut(false); });
    document.addEventListener("keydown", (e) => {
      if (menu.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); shut(); }
      if (e.key === "Tab") {
        const f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    phoneMQ.addEventListener("change", (e) => { if (!e.matches && !menu.hidden) shut(false); });
  }

  /* ---------------- Booking form (demo) ---------------- */
  function initForm() {
    const form = $("#booking"), status = $("#booking-status");
    const date = $("#b-date");
    date.min = new Date().toISOString().slice(0, 10);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let firstBad = null;
      for (const f of form.querySelectorAll("[required]")) {
        const bad = !f.checkValidity();
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = f;
      }
      if (firstBad) { status.textContent = "Please fill in your name, a valid email and a date."; firstBad.focus(); return; }
      status.textContent = "Demo only: this request was not sent. Connect a booking service to take real bookings.";
    });
  }

  /* ---------------- Boot ---------------- */
  renderContent();
  renderChapters();
  initMenu();
  initForm();
  initFlight().then(() => { updateHeader(); requestDraw(); });

  addEventListener("scroll", () => { requestDraw(); updateHeader(); }, { passive: true });
  let lastW = innerWidth, lastH = innerHeight;
  function onResize() {
    // ignore small height-only changes from mobile browser chrome showing/hiding
    const hOnly = innerWidth === lastW && Math.abs(innerHeight - lastH) < 140;
    lastW = innerWidth; lastH = innerHeight;
    if (!timeline) return;
    buildTimeline();
    if (!hOnly) layout(); else sizeCanvas();
    frames.drawn = -1;
    requestDraw(); updateHeader();
  }
  addEventListener("resize", onResize);
  addEventListener("orientationchange", onResize);
  // switching between phone and desktop: drop the old sequence before loading the right one
  phoneMQ.addEventListener("change", () => {
    if (flight.classList.contains("is-static")) return;
    for (const ctl of frames.inflight.values()) ctl.abort();
    frames.inflight.clear();
    for (const img of frames.cache.values()) release(img);
    frames.cache.clear();
    frames.manifest = null;
    initFlight();
  });
  reduceMotion.addEventListener("change", (e) => { if (e.matches) goStatic(); });
})();
