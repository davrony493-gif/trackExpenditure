/* Wrenhollow — fly-through engine and UI behaviour.
 * All copy lives in index.html so the page reads fine without JavaScript; this file only animates it. */
(() => {
  "use strict";
  const C = window.WRENHOLLOW;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const phoneMQ = matchMedia("(max-width: 760px), (max-height: 500px) and (orientation: landscape)");
  const portraitMQ = matchMedia("(orientation: portrait)");
  const menuMQ = matchMedia("(max-width: 1023px), (max-height: 500px) and (orientation: landscape)"); // header collapses into the menu

  /* "Book this" on a tour card preselects that tour in the booking form. */
  function initTourLinks() {
    const tourSelect = $("#b-tour");
    $("#tour-grid").addEventListener("click", (e) => {
      const a = e.target.closest("[data-tour]");
      if (a) tourSelect.value = a.dataset.tour;
    });
  }

  /* ---------------- Chapters ---------------- */
  const chapterEls = {};
  for (const art of document.querySelectorAll("#chapters .chapter")) chapterEls[art.dataset.id] = art;
  const root = document.documentElement;
  const isStatic = () => !root.classList.contains("fly");

  /* ---------------- Timeline ---------------- */
  const flight = $("#flight");
  const stage = $(".stage", flight);
  const canvas = $(".stage-canvas", stage);
  const ctx = canvas.getContext("2d", { alpha: false });
  const progressBar = $(".progress-bar", stage);

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

  function layout() {
    vhPx = innerHeight;
    if (!isStatic()) {
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

  /* ---------------- Frames ----------------
   * Every frame is downloaded once (compressed blobs are small), nearest to the current position first,
   * then the rest in the background so fast scrolling never outruns the network. Only frames near the
   * current position are decoded into bitmaps, which keeps memory low on phones. */
  const frames = {
    manifest: null, count: 0, fps: 20, base: "", version: "1", seq: 0,
    blobs: new Map(),           // idx -> Blob (compressed, kept)
    bitmaps: new Map(),         // idx -> ImageBitmap | HTMLImageElement (decoded, bounded)
    fetching: new Map(),        // idx -> AbortController
    decoding: new Set(),
    failures: new Map(),
    maxBitmaps: 72, maxFetch: 6, maxDecode: 3, background: true,
    current: 0, dir: 1, drawn: -1, drawnFocus: -1, dirty: true,
  };
  const NEAR_AHEAD = 36, NEAR_BEHIND = 12;

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

  function release(img) {
    if (!img) return;
    if (typeof img.close === "function") img.close();
    else if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  }

  /** Frames to have decoded right now: the current one, then ahead in the scroll direction, then just behind. */
  function nearWindow() {
    const c = frames.current, d = frames.dir, n = frames.count, out = [c];
    for (let k = 1; k <= NEAR_AHEAD; k++) {
      out.push(c + d * k);
      if (k <= NEAR_BEHIND) out.push(c - d * k);
    }
    return out.filter((i) => i >= 0 && i < n);
  }

  function evictBitmaps() {
    if (frames.bitmaps.size <= frames.maxBitmaps) return;
    const c = frames.current;
    const far = [...frames.bitmaps.keys()].sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
    while (frames.bitmaps.size > frames.maxBitmaps && far.length) {
      const k = far.shift();
      if (k === frames.drawn) continue;
      release(frames.bitmaps.get(k));
      frames.bitmaps.delete(k);
    }
  }

  function fetchFrame(i) {
    const seq = frames.seq, ctl = new AbortController();
    frames.fetching.set(i, ctl);
    fetch(frameUrl(i), { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then((blob) => { if (seq === frames.seq) { frames.blobs.set(i, blob); frames.failures.delete(i); } })
      .catch((err) => { if (err.name !== "AbortError" && seq === frames.seq) frames.failures.set(i, (frames.failures.get(i) || 0) + 1); })
      .finally(() => { if (seq === frames.seq) { frames.fetching.delete(i); pump(); } });
  }

  function decodeFrame(i) {
    const seq = frames.seq;
    frames.decoding.add(i);
    decode(frames.blobs.get(i))
      .then((img) => {
        if (seq !== frames.seq) { release(img); return; }
        frames.bitmaps.set(i, img);
        evictBitmaps();
        if (Math.abs(i - frames.current) <= 12) { frames.dirty = true; requestDraw(); }
      })
      .catch(() => { if (seq === frames.seq) frames.blobs.delete(i); }) // corrupt download: fetch it again
      .finally(() => { if (seq === frames.seq) { frames.decoding.delete(i); pump(); } });
  }

  function pump() {
    if (!frames.manifest) return;
    const near = nearWindow();
    // 1. decode what's close and already downloaded
    for (const i of near) {
      if (frames.decoding.size >= frames.maxDecode) break;
      if (frames.blobs.has(i) && !frames.bitmaps.has(i) && !frames.decoding.has(i)) decodeFrame(i);
    }
    // 2. download: near frames first, then (in the background) everything else, outward from here
    const queue = near.slice();
    if (frames.background && frames.blobs.size >= Math.min(24, frames.count)) {
      const c = frames.current;
      for (let k = 1; k < frames.count; k++) { queue.push(c + frames.dir * k, c - frames.dir * k); }
    }
    for (const i of queue) {
      if (frames.fetching.size >= frames.maxFetch) break;
      if (i < 0 || i >= frames.count || frames.blobs.has(i) || frames.fetching.has(i)) continue;
      if ((frames.failures.get(i) || 0) >= 3) continue;
      fetchFrame(i);
    }
  }

  function nearestDecoded(i) {
    if (frames.bitmaps.has(i)) return i;
    for (let k = 1; k < 30; k++) {
      if (frames.bitmaps.has(i - k * frames.dir)) return i - k * frames.dir;
      if (frames.bitmaps.has(i + k * frames.dir)) return i + k * frames.dir;
    }
    return -1;
  }

  function resetFrames() {
    frames.seq++;
    for (const ctl of frames.fetching.values()) ctl.abort();
    frames.fetching.clear(); frames.decoding.clear(); frames.failures.clear();
    for (const img of frames.bitmaps.values()) release(img);
    frames.bitmaps.clear(); frames.blobs.clear();
    frames.manifest = null; frames.drawn = -1; frames.dirty = true;
  }

  function sizeCanvas() {
    // 1.5× is plenty for video frames and far cheaper to redraw than 2–3× (text is HTML, so it stays sharp).
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; frames.dirty = true; }
  }

  function draw(idx, focus) {
    const k = nearestDecoded(idx);
    if (k < 0) return;
    if (!frames.dirty && k === frames.drawn && Math.abs(focus - frames.drawnFocus) < 0.001) return; // nothing changed
    const img = frames.bitmaps.get(k);
    const cw = canvas.width, ch = canvas.height;
    const fw = img.width, fh = img.height;
    const s = Math.max(cw / fw, ch / fh);
    const dw = fw * s, dh = fh * s;
    const x = (cw - dw) * clamp(focus, 0, 1);
    const y = (ch - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = s > 1.6 ? "medium" : "low";
    ctx.drawImage(img, x, y, dw, dh);
    frames.drawn = k; frames.drawnFocus = focus; frames.dirty = false;
    stage.dataset.shown = k;
    if (!stage.classList.contains("is-live")) stage.classList.add("is-live");
  }

  /* ---------------- Render loop ---------------- */
  let raf = 0;
  function requestDraw() { if (!raf) raf = requestAnimationFrame(render); }

  function render() {
    raf = 0;
    if (!timeline || isStatic()) return;
    const pos = scrollPos();

    if (frames.manifest) {
      const idx = clamp(Math.round(timeAt(pos) * frames.fps), 0, frames.count - 1);
      if (idx !== frames.current) {
        frames.dir = idx >= frames.current ? 1 : -1;
        frames.current = idx;
        pump();
      }
      // Tall screens (phones, upright tablets) crop the sides, so follow each beat's focus point.
      const tall = canvas.width < canvas.height * 1.1;
      draw(idx, tall && !frames.manifest.preCropped ? focusAt(pos) : 0.5);
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
      if (active) { art.removeAttribute("inert"); art.removeAttribute("aria-hidden"); activeSide = art.dataset.side; }
      else { art.setAttribute("inert", ""); art.setAttribute("aria-hidden", "true"); }
    }
    stage.dataset.side = activeSide;
    stage.classList.toggle("is-moving", pos > 0.15);
    progressBar.style.transform = `scaleX(${(pos / timeline.total).toFixed(4)})`;
  }

  /* ---------------- Static fallback ---------------- */
  function goStatic() {
    root.classList.remove("fly");
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
      // phones take the pre-cropped portrait sequence unless a beat needs an off-centre focus
      const needsFocus = C.flight.beats.some((b) => b.focus != null && b.focus !== 0.5);
      const usePortrait = phoneMQ.matches && portraitMQ.matches && m.portrait && (m.portrait.focusBaked || !needsFocus);
      const seq = usePortrait ? m.portrait : m;
      frames.manifest = { ...seq, preCropped: usePortrait, pattern: seq.pattern || m.pattern, pad: seq.pad || m.pad, start: seq.start ?? m.start };
      frames.count = seq.count;
      frames.fps = m.fps;
      frames.version = String(m.version || "1");
      frames.base = new URL(seq.dir || m.dir || "./", new URL(url, location.href)).href;
      frames.maxBitmaps = phoneMQ.matches || portraitMQ.matches ? 36 : 72;
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
  const header = $(".site-header");
  function updateHeader() {
    const hb = header.getBoundingClientRect().bottom;
    const fb = flight.getBoundingClientRect().bottom;
    const solid = isStatic() ? window.scrollY > 40 : fb <= hb + 1;
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
          experience: $("#b-tour").value,
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
  initTourLinks();
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
    frames.dirty = true;
    requestDraw(); updateHeader();
  }
  addEventListener("resize", onResize);
  addEventListener("orientationchange", onResize);
  // switching between phone/desktop or portrait/landscape: drop the old sequence before loading the right one
  function reloadSequence() {
    if (isStatic()) return;
    resetFrames();
    initFlight();
  }
  phoneMQ.addEventListener("change", reloadSequence);
  portraitMQ.addEventListener("change", () => { if (phoneMQ.matches) reloadSequence(); });
  reduceMotion.addEventListener("change", (e) => { if (e.matches) goStatic(); });
})();
