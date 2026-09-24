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
  const phoneMQ = matchMedia("(max-width: 760px), (max-height: 500px) and (orientation: landscape)");
  const portraitMQ = matchMedia("(orientation: portrait)");
  const menuMQ = matchMedia("(max-width: 1023px), (max-height: 500px) and (orientation: landscape)"); // header collapses into the menu

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
  const header = $(".site-header");

  let timeline = null;   // { beats:[{a,b,...}], total, chapters:[{id,a,b}] }
  let vhPx = innerHeight;

  function buildTimeline() {
    const phone = phoneMQ.matches || portraitMQ.matches; // phones and upright tablets use the shorter touch pacing
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

  // Page geometry is measured once per layout, not on every scroll step (reading layout while scrolling is costly on phones).
  const geo = { top: 0, height: 0, headerH: 0 };
  function measure() {
    geo.top = flight.getBoundingClientRect().top + window.scrollY;
    geo.height = flight.offsetHeight;
    geo.headerH = header.getBoundingClientRect().height;
  }

  function layout() {
    vhPx = innerHeight;
    if (!flight.classList.contains("is-static")) {
      flight.style.height = `${(timeline.total + 1) * vhPx}px`;
    }
    sizeCanvas();
    measure();
  }

  /** scroll position within the flight, in viewport heights */
  function scrollPos() {
    return clamp((window.scrollY - geo.top) / vhPx, 0, timeline.total);
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

  /* ---------------- Frames ----------------
   * Frames come in "packs" (24 frames per file) because phones on mobile data pay ~150–300 ms per request:
   * a few large requests are far faster than hundreds of small ones. Two tiers:
   *   hd  – the sharp frames, fetched pack by pack outward from the current position in the scroll direction;
   *   pv  – a tiny low-res preview of the whole flight (one pack), so the picture keeps moving with the finger
   *         while sharp packs are still arriving.
   * Downloaded frames are kept compressed; only frames near the current position are decoded into bitmaps. */
  const frames = {
    manifest: null, count: 0, fps: 20, version: "1", seq: 0,
    hd: null, pv: null, blobs: new Map(),
    maxBitmaps: 72, maxFetch: 3, maxDecode: 4, background: true, decodes: 0,
    current: 0, dir: 1, drawn: -1, drawnKey: "", drawnFocus: -1, dirty: true,
  };
  // The decode window must stay smaller than the bitmap budget, or frames get evicted and decoded again (thrashing).
  const NEAR_AHEAD = 16, NEAR_BEHIND = 6;
  // On a fast flick the scroll can pass ~150+ frames a second, more than a phone can decode. Then we decode
  // every 2nd/3rd… frame in the direction of travel so the picture keeps up, and fill in the exact frame
  // as soon as the scroll settles.
  const motion = { vel: 0, lastIdx: 0, lastT: 0, settle: 0 };
  function stride() { return motion.vel > 70 ? Math.min(6, Math.ceil(motion.vel / 40)) : 1; }

  function makeTier(t, rootUrl, every = 1) {
    return {
      every, count: t.count, type: t.type, perPack: t.perPack, packs: t.packs,
      base: new URL(t.dir, rootUrl).href,
      blobs: new Map(), bitmaps: new Map(), decoding: new Set(),
      fetching: new Map(), failed: new Map(), done: new Set(), drawn: -1,
    };
  }

  async function decode(blob) {
    if ("createImageBitmap" in window) return createImageBitmap(blob);
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    return img;
  }

  function release(img) {
    if (!img) return;
    if (typeof img.close === "function") img.close();
    else if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  }

  /** Frames to have decoded right now. At rest: the current frame, the next ones in the scroll direction and a few behind.
   *  During a fast flick: frames on a fixed grid (every 2nd/3rd… frame) starting where the scroll will be by the time
   *  a decode finishes, so the picture keeps up with the finger instead of trailing behind it. */
  function nearWindow() {
    const c = frames.current, d = frames.dir, n = frames.count, st = stride();
    const out = [c];
    if (st === 1) {
      for (let k = 1; k <= NEAR_AHEAD; k++) { out.push(c + d * k); if (k <= NEAR_BEHIND) out.push(c - d * k); }
    } else {
      const lead = Math.min(40, Math.round(motion.vel * 0.08));            // ~80 ms of decode latency
      let g = Math.ceil((c + d * lead) / st) * st;                          // align to the stride grid
      if (d < 0) g = Math.floor((c + d * lead) / st) * st;
      for (let k = 0; k < NEAR_AHEAD; k++) out.push(g + d * k * st);
    }
    return out.filter((i, j, a) => i >= 0 && i < n && a.indexOf(i) === j);
  }

  function fetchPack(tier, p) {
    const seq = frames.seq, ctl = new AbortController(), pack = tier.packs[p];
    tier.fetching.set(p, ctl);
    fetch(`${tier.base}${pack.file}?v=${encodeURIComponent(frames.version)}`, { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((buf) => {
        if (seq !== frames.seq) return;
        pack.frames.forEach(([off, len], k) => {
          tier.blobs.set(p * tier.perPack + k, new Blob([new Uint8Array(buf, off, len)], { type: tier.type }));
        });
        tier.done.add(p); tier.failed.delete(p);
      })
      .catch((err) => { if (err.name !== "AbortError" && seq === frames.seq) tier.failed.set(p, (tier.failed.get(p) || 0) + 1); })
      .finally(() => { if (seq === frames.seq) { tier.fetching.delete(p); pump(); } });
  }

  function decodeInto(tier, i, keepNear) {
    const seq = frames.seq;
    tier.decoding.add(i);
    if (tier === frames.hd) frames.decodes++;
    decode(tier.blobs.get(i))
      .then((img) => {
        if (seq !== frames.seq) { release(img); return; }
        tier.bitmaps.set(i, img);
        keepNear(tier);
        frames.dirty = true; requestDraw();
      })
      .catch(() => { if (seq === frames.seq) tier.blobs.delete(i); })
      .finally(() => { if (seq === frames.seq) { tier.decoding.delete(i); pump(); } });
  }

  function evictHd(tier) {
    if (tier.bitmaps.size <= frames.maxBitmaps) return;
    const keep = new Set(nearWindow()); keep.add(frames.drawn);
    const c = frames.current;
    // Evict frames outside the working window first (farthest first); never the window itself.
    const victims = [...tier.bitmaps.keys()].filter((k) => !keep.has(k)).sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
    while (tier.bitmaps.size > frames.maxBitmaps && victims.length) {
      const k = victims.shift(); release(tier.bitmaps.get(k)); tier.bitmaps.delete(k);
    }
  }
  function evictPv(tier) {
    if (tier.bitmaps.size <= 48) return;
    const c = frames.current / tier.every;
    const far = [...tier.bitmaps.keys()].filter((k) => k !== tier.drawn).sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
    while (tier.bitmaps.size > 48 && far.length) { const k = far.shift(); release(tier.bitmaps.get(k)); tier.bitmaps.delete(k); }
  }

  /** Nearest downloaded-but-not-decoded sharp frame to i (within ±8), used when the exact frame hasn't arrived yet. */
  function nearestBlob(i) {
    const hd = frames.hd;
    if (hd.blobs.has(i)) return i;
    for (let k = 1; k <= 8; k++) {
      if (hd.blobs.has(i + frames.dir * k)) return i + frames.dir * k;
      if (hd.blobs.has(i - frames.dir * k)) return i - frames.dir * k;
    }
    return -1;
  }

  function nearestDecoded(i) {
    const bm = frames.hd.bitmaps;
    if (bm.has(i)) return i;
    for (let k = 1; k < 30; k++) {
      if (bm.has(i - k * frames.dir)) return i - k * frames.dir;
      if (bm.has(i + k * frames.dir)) return i + k * frames.dir;
    }
    return -1;
  }

  function pump() {
    if (!frames.manifest) return;
    const hd = frames.hd, pv = frames.pv, near = nearWindow();
    // 1. decode what's close; if a frame hasn't downloaded yet, decode the nearest one that has
    for (const i of near) {
      if (hd.decoding.size >= frames.maxDecode) break;
      const j = hd.bitmaps.has(i) ? -1 : nearestBlob(i);
      if (j >= 0 && !hd.bitmaps.has(j) && !hd.decoding.has(j)) decodeInto(hd, j, evictHd);
    }
    // 1b. where no sharp frame is ready nearby, decode the preview frame instead (tiny, cheap)
    if (pv) {
      for (const i of near.slice(0, 10)) {
        if (pv.decoding.size >= 2) break;
        const k = nearestDecoded(i);
        if (k >= 0 && Math.abs(k - i) <= 2) continue;
        const j = Math.round(i / pv.every);
        if (pv.blobs.has(j) && !pv.bitmaps.has(j) && !pv.decoding.has(j)) decodeInto(pv, j, evictPv);
      }
    }
    // 2. downloads: the sharp pack we're in and the whole preview first (side by side), then sharp packs
    //    outward from here, heading in the scroll direction first
    const cp = Math.floor(frames.current / hd.perPack), nPacks = hd.packs.length;
    const queue = [[hd, cp]];
    if (pv) for (let p = 0; p < pv.packs.length; p++) queue.push([pv, p]);
    const nearPacks = new Set(near.map((i) => Math.floor(i / hd.perPack)));
    for (const p of nearPacks) queue.push([hd, p]);
    const reach = frames.background ? nPacks : 2;
    for (let k = 1; k < reach; k++) { queue.push([hd, cp + frames.dir * k]); queue.push([hd, cp - frames.dir * k]); }
    let inFlight = hd.fetching.size + (pv ? pv.fetching.size : 0);
    for (const [tier, p] of queue) {
      if (inFlight >= frames.maxFetch) break;
      if (p < 0 || p >= tier.packs.length || tier.done.has(p) || tier.fetching.has(p)) continue;
      if ((tier.failed.get(p) || 0) >= 3) continue;
      fetchPack(tier, p); inFlight++;
    }
  }

  function resetFrames() {
    frames.seq++;
    for (const tier of [frames.hd, frames.pv]) {
      if (!tier) continue;
      for (const ctl of tier.fetching.values()) ctl.abort();
      for (const img of tier.bitmaps.values()) release(img);
    }
    frames.hd = frames.pv = null; frames.blobs = new Map();
    frames.manifest = null; frames.drawn = -1; frames.drawnKey = ""; frames.dirty = true;
  }

  function sizeCanvas() {
    // 1.5× is plenty for video frames and far cheaper to redraw than 2–3× (text is HTML, so it stays sharp).
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; frames.dirty = true; }
  }

  function draw(idx, focus) {
    // Prefer a sharp frame at (or right next to) the target; otherwise the preview frame for this moment;
    // otherwise the nearest sharp frame we have.
    let img = null, key = "", shown = -1;
    const k = nearestDecoded(idx), tol = Math.max(2, stride() * 2);
    if (k >= 0 && Math.abs(k - idx) <= tol) { img = frames.hd.bitmaps.get(k); key = "hd" + k; shown = k; }
    else if (frames.pv) {
      const pv = frames.pv, j0 = Math.round(idx / pv.every);
      for (let d = 0; d <= 3 && !img; d++) {
        for (const j of d ? [j0 - d, j0 + d] : [j0]) {
          if (pv.bitmaps.has(j)) { img = pv.bitmaps.get(j); key = "pv" + j; shown = j * pv.every; pv.drawn = j; break; }
        }
      }
      // keep the sharp poster on screen at the very start rather than swapping it for a blurry preview frame
      if (img && !stage.classList.contains("is-live") && idx === 0) img = null;
    }
    if (!img && k >= 0) { img = frames.hd.bitmaps.get(k); key = "hd" + k; shown = k; }
    if (!img) return;
    if (!frames.dirty && key === frames.drawnKey && Math.abs(focus - frames.drawnFocus) < 0.001) return; // nothing changed
    const cw = canvas.width, ch = canvas.height;
    const fw = img.width, fh = img.height;
    const s = Math.max(cw / fw, ch / fh);
    const dw = fw * s, dh = fh * s;
    const x = (cw - dw) * clamp(focus, 0, 1);
    const y = (ch - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    // previews are soft anyway; "low" keeps stretching them cheap
    ctx.imageSmoothingQuality = key.startsWith("pv") ? "low" : s > 1.6 ? "medium" : "low";
    ctx.drawImage(img, x, y, dw, dh);
    if (key.startsWith("hd")) frames.drawn = shown;
    frames.drawnKey = key; frames.drawnFocus = focus; frames.dirty = false;
    if (stage.dataset.shown !== String(shown)) stage.dataset.shown = shown;
    if (!stage.classList.contains("is-live")) stage.classList.add("is-live");
  }

  /* ---------------- Render loop ---------------- */
  let raf = 0;
  function requestDraw() { if (!raf) raf = requestAnimationFrame(render); }

  const chapterState = {}; // id -> { o, active } last written, so the DOM is only touched on change
  let lastSide = "", lastMoving = null, lastProgress = -1;

  function render() {
    raf = 0;
    if (!timeline || flight.classList.contains("is-static")) return;
    const pos = scrollPos();

    if (frames.manifest) {
      const idx = clamp(Math.round(timeAt(pos) * frames.fps), 0, frames.count - 1);
      if (idx !== frames.current) {
        const now = performance.now();
        const dt = Math.max(8, now - motion.lastT) / 1000;
        motion.vel = motion.vel * 0.6 + (Math.abs(idx - frames.current) / dt) * 0.4; // frames per second
        motion.lastT = now;
        frames.dir = idx >= frames.current ? 1 : -1;
        frames.current = idx;
        pump();
        clearTimeout(motion.settle);
        motion.settle = setTimeout(() => { motion.vel = 0; pump(); requestDraw(); }, 120);
      }
      if (stage.dataset.frame !== String(idx)) stage.dataset.frame = idx;
      // Tall screens (phones, upright tablets) crop the sides, so follow each beat's focus point.
      const tall = canvas.width < canvas.height * 1.1;
      draw(idx, tall && !frames.manifest.preCropped ? focusAt(pos) : 0.5);
    }

    let activeSide = "none";
    for (const ch of timeline.chapters) {
      const o = Math.round(chapterOpacity(ch, pos) * 100) / 100;
      const art = chapterEls[ch.id];
      const prev = chapterState[ch.id] || (chapterState[ch.id] = { o: -1, active: null });
      const active = o > 0.5;
      if (o !== prev.o) {
        art.style.opacity = o;
        art.style.setProperty("--shift", `${((1 - o) * 18).toFixed(1)}px`);
        art.classList.toggle("is-visible", o > 0.01);
        prev.o = o;
      }
      if (active !== prev.active) {
        art.classList.toggle("is-active", active);
        if (active) { art.removeAttribute("inert"); art.removeAttribute("aria-hidden"); }
        else { art.setAttribute("inert", ""); art.setAttribute("aria-hidden", "true"); }
        prev.active = active;
      }
      if (active) activeSide = C.chapters[ch.id].side;
    }
    if (activeSide !== lastSide) { stage.dataset.side = activeSide; lastSide = activeSide; }
    const moving = pos > 0.15;
    if (moving !== lastMoving) { stage.classList.toggle("is-moving", moving); lastMoving = moving; }
    const prog = Math.round((pos / timeline.total) * 1000) / 1000;
    if (prog !== lastProgress) { progressBar.style.transform = `scaleX(${prog})`; lastProgress = prog; }
    updateHeader();
  }

  /* ---------------- Static fallback ---------------- */
  function goStatic() {
    flight.classList.add("is-static");
    flight.style.height = "";
    for (const art of Object.values(chapterEls)) {
      art.removeAttribute("inert"); art.removeAttribute("aria-hidden"); art.style.opacity = "";
    }
    resetFrames();
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
      if (m.format !== "packs") throw new Error("unsupported frames manifest");
      // Upright phones take the pre-cropped portrait sequence (its crop already follows each beat's focus).
      const usePortrait = phoneMQ.matches && portraitMQ.matches && m.portrait;
      const seq = usePortrait ? m.portrait : m;
      const root = new URL(url, location.href);
      frames.manifest = { preCropped: !!usePortrait };
      frames.hd = makeTier(seq, root);
      frames.pv = seq.preview ? makeTier(seq.preview, root, seq.preview.every || 2) : null;
      frames.blobs = frames.hd.blobs; // diagnostics
      frames.count = seq.count;
      frames.fps = m.fps;
      frames.version = String(m.version || "1");
      const compact = phoneMQ.matches || portraitMQ.matches;
      frames.maxBitmaps = compact ? 40 : 72; // ~2 MB each on phones
      // Decoding runs on background threads but still competes with scrolling for the phone's CPU cores.
      frames.maxDecode = compact ? 2 : 4;
      window.__wrenFrames = frames; // for diagnostics
      // Respect Data Saver: only fetch frames near the current position, not the whole sequence.
      frames.background = !(navigator.connection && navigator.connection.saveData);
      frames.current = clamp(Math.round(timeAt(scrollPos()) * frames.fps), 0, frames.count - 1);
      frames.dirty = true;
      pump();
      requestDraw();
    } catch (e) {
      console.warn("[wrenhollow] fly-through frames unavailable, using stills", e);
      goStatic();
    }
  }

  /* ---------------- Header & menu ---------------- */
  function updateHeader() {
    const flightBottom = geo.top + geo.height - window.scrollY;
    const solid = flight.classList.contains("is-static") ? window.scrollY > 40 : flightBottom <= geo.headerH + 1;
    const state = solid ? "solid" : "glass";
    if (header.dataset.state !== state) header.dataset.state = state;
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
    menuMQ.addEventListener("change", (e) => { if (!e.matches && !menu.hidden) shut(false); });
  }

  /* ---------------- Booking form (demo) ---------------- */
  function initForm() {
    const form = $("#booking"), status = $("#booking-status");
    const date = $("#b-date");
    date.min = new Date().toISOString().slice(0, 10);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let firstBad = null;
      for (const f of form.querySelectorAll("[required]")) {
        const bad = !f.checkValidity();
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = f;
      }
      if (firstBad) { status.textContent = "Please fill in your name, a valid email and a date."; firstBad.focus(); return; }

      // Member accounts on (account.js): logged-in members save a real booking request.
      const acct = window.wrenAccount;
      if (acct && acct.isSignedIn()) {
        const submit = form.querySelector("[type=submit]");
        submit.disabled = true;
        status.textContent = "Sending your request…";
        const res = await acct.submitBooking({
          experience: C.tours[$("#b-tour").selectedIndex]?.name || $("#b-tour").value,
          date: date.value,
          guests: Number($("#b-guests").value),
        });
        submit.disabled = false;
        status.textContent = res.ok
          ? "Request saved! You'll see it in My account, where its status changes once the team confirms it."
          : res.error;
        return;
      }
      if (acct) {
        status.textContent = "Please log in or create an account to send a booking request.";
        acct.openSignIn(form.querySelector("[type=submit]"));
        return;
      }
      status.textContent = "Demo only: this request was not sent. Connect a booking service to take real bookings.";
    });
  }

  /* ---------------- Boot ---------------- */
  renderContent();
  renderChapters();
  initMenu();
  initForm();
  initFlight().then(() => { updateHeader(); requestDraw(); });

  addEventListener("scroll", () => {
    if (flight.classList.contains("is-static")) updateHeader(); else requestDraw();
  }, { passive: true });
  // Fonts and late images can shift the page slightly; re-measure once everything has loaded.
  addEventListener("load", () => { if (timeline) { measure(); requestDraw(); } });
  let lastW = innerWidth, lastH = innerHeight;
  function onResize() {
    // ignore small height-only changes from mobile browser chrome showing/hiding
    const hOnly = innerWidth === lastW && Math.abs(innerHeight - lastH) < 140;
    lastW = innerWidth; lastH = innerHeight;
    if (!timeline) return;
    buildTimeline();
    if (!hOnly) layout(); else sizeCanvas();
    frames.dirty = true;
    requestDraw(); updateHeader();
  }
  addEventListener("resize", onResize);
  addEventListener("orientationchange", onResize);
  // switching between phone/desktop or portrait/landscape: drop the old sequence before loading the right one
  function reloadSequence() {
    if (flight.classList.contains("is-static")) return;
    resetFrames();
    initFlight();
  }
  phoneMQ.addEventListener("change", reloadSequence);
  portraitMQ.addEventListener("change", () => { if (phoneMQ.matches) reloadSequence(); });
  reduceMotion.addEventListener("change", (e) => { if (e.matches) goStatic(); });
})();
