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
    maxBitmaps: 72, maxFetch: 6, maxDecode: 3, background: true, ahead: 36, behind: 12,
    current: 0, dir: 1, drawn: -1, drawnFocus: -1, dirty: true,
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

  function release(img) {
    if (!img) return;
    if (typeof img.close === "function") img.close();
    else if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  }

  /** Frames to have decoded right now: the current one, then ahead in the scroll direction, then just behind. */
  function nearWindow() {
    const c = frames.current, d = frames.dir, n = frames.count, out = [c];
    for (let k = 1; k <= frames.ahead; k++) {
      out.push(c + d * k);
      if (k <= frames.behind) out.push(c - d * k);
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

  /* "Skip the tour" jumps straight past the flight (a smooth scroll would play all 600 frames) and moves focus there. */
  const skipTour = $(".skip-tour", stage);
  skipTour.addEventListener("click", (e) => {
    const target = $("#main-content");
    e.preventDefault();
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - pad, behavior: "instant" });
    target.focus({ preventScroll: true });
    history.replaceState(null, "", "#main-content");
  });

  /* ---------------- Loading indicator ----------------
   * Shown until the first frame is on screen, and again if scrolling outruns the download
   * (the frame on screen is well behind where the scroll says it should be). */
  const loading = $(".stage-loading", stage), loadingText = $(".stage-loading-text", stage);
  let loadingOn = false;
  function updateLoading() {
    const waiting = !frames.manifest ? !stage.classList.contains("is-live") && !!frames.wanted
      : frames.drawn < 0 || Math.abs(frames.drawn - frames.current) > 8;
    if (waiting === loadingOn) return;
    loadingOn = waiting;
    loading.classList.toggle("is-on", waiting);
    loadingText.textContent = waiting ? "Loading the fly-through…" : "";
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
      else {
        // Keyboard users: if focus sits in a chapter that's fading out, keep it on screen (on "Skip the tour").
        if (art.contains(document.activeElement)) skipTour.focus({ preventScroll: true });
        art.setAttribute("inert", ""); art.setAttribute("aria-hidden", "true");
      }
    }
    stage.dataset.side = activeSide;
    stage.classList.toggle("is-moving", pos > 0.15);
    updateLoading();
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

  /** Frames load after the page has painted and gone idle (or as soon as the visitor starts scrolling),
   * so they never compete with the poster, fonts and copy for the first screen. */
  function afterFirstPaint() {
    return new Promise((resolve) => {
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        for (const t of ["scroll", "touchstart", "keydown", "wheel"]) removeEventListener(t, go);
        resolve();
      };
      for (const t of ["scroll", "touchstart", "keydown", "wheel"]) addEventListener(t, go, { passive: true, once: true });
      const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300));
      if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
    });
  }

  /** AVIF frames are ~55% smaller than WebP at the same size; use them where the browser can decode them. */
  const AVIF_PROBE = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAWAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAebWRhdAoFGAA2wCAyDRgAAABQAAAAALATSyg=";
  let avifOk = null;
  function supportsAvif() {
    if (avifOk) return avifOk;
    avifOk = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0);
      img.onerror = () => resolve(false);
      img.src = AVIF_PROBE;
    });
    return avifOk;
  }

  async function initFlight() {
    buildTimeline();
    if (reduceMotion.matches) { goStatic(); return; }
    layout();
    render();
    await afterFirstPaint();
    if (isStatic()) return;
    frames.wanted = true;
    updateLoading();
    try {
      const url = C.flight.manifest;
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error("manifest " + r.status);
      const m = await r.json();
      // phones take the pre-cropped portrait sequence unless a beat needs an off-centre focus
      const needsFocus = C.flight.beats.some((b) => b.focus != null && b.focus !== 0.5);
      const usePortrait = phoneMQ.matches && portraitMQ.matches && m.portrait && (m.portrait.focusBaked || !needsFocus);
      const seq = usePortrait ? m.portrait : m;
      const avif = seq.avif && (await supportsAvif()) ? seq.avif : null;
      frames.manifest = { ...seq, preCropped: usePortrait, pattern: avif ? avif.pattern : seq.pattern || m.pattern, pad: seq.pad || m.pad, start: seq.start ?? m.start };
      frames.count = seq.count;
      frames.fps = m.fps;
      frames.version = String(m.version || "1");
      frames.base = new URL((avif && avif.dir) || seq.dir || m.dir || "./", new URL(url, location.href)).href;
      // Phones: fewer decoded frames in memory. The decode window stays inside that budget so nothing
      // is evicted and decoded again while it's still needed.
      const compact = phoneMQ.matches || portraitMQ.matches;
      frames.maxBitmaps = compact ? 36 : 72;
      frames.ahead = compact ? 24 : 36;
      frames.behind = compact ? 8 : 12;
      // Respect Data Saver: only fetch frames near the current position, not the whole sequence.
      frames.background = !(navigator.connection && navigator.connection.saveData);
      frames.current = clamp(Math.round(timeAt(scrollPos()) * frames.fps), 0, frames.count - 1);
      frames.dirty = true;
      pump();
      requestDraw();
    } catch (e) {
      console.warn("[wrenhollow] fly-through frames unavailable, using stills", e);
      goStatic();
      frames.wanted = false;
      updateLoading();
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

  /* ---------------- Booking form ----------------
   * Validates name, email, a future opening day and 1–6 guests, with a message under each field.
   * Where it goes: signed-in members → their account (account.js); a Formspree endpoint in the form's
   * action → Formspree; otherwise it's a demo and says so. */
  const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseISO = (v) => { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); };
  const CLOSED_DAYS = [1, 2]; // Monday, Tuesday (see the opening hours)

  function initForm() {
    const form = $("#booking"), status = $("#booking-status"), submit = form.querySelector("[type=submit]");
    const f = { name: $("#b-name"), email: $("#b-email"), date: $("#b-date"), guests: $("#b-guests"), tour: $("#b-tour") };
    form.noValidate = true; // JS shows its own messages; without JS the browser's built-in checks still apply
    f.date.min = localISO(new Date());
    const endpoint = /^https:\/\//.test(form.getAttribute("action") || "") ? form.getAttribute("action") : "";
    let tried = false;

    const rules = {
      name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
      email: (v) => (!v.trim() ? "Please enter your email address."
        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Please enter a valid email address, like name@example.com." : ""),
      date: (v) => {
        if (!v) return "Please choose a date.";
        if (v < localISO(new Date())) return "That date has passed. Please choose today or a later date.";
        if (CLOSED_DAYS.includes(parseISO(v).getDay())) return "We’re closed on Mondays and Tuesdays. Please choose Wednesday to Sunday.";
        return "";
      },
      guests: (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 6 ? "" : "Bookings are for 1 to 6 guests."; },
    };
    function check(key) {
      const msg = rules[key](f[key].value), err = $(`#b-${key}-error`);
      f[key].setAttribute("aria-invalid", msg ? "true" : "false");
      err.textContent = msg; err.hidden = !msg;
      return !msg;
    }
    for (const key of Object.keys(rules)) {
      f[key].addEventListener(key === "date" || key === "guests" ? "change" : "blur", () => { if (tried) check(key); });
      f[key].addEventListener("input", () => { if (tried && f[key].getAttribute("aria-invalid") === "true") check(key); });
    }
    function show(msg, kind) {
      status.className = "form-status" + (kind ? ` is-${kind}` : "");
      status.textContent = msg;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      tried = true;
      const bad = Object.keys(rules).filter((key) => !check(key));
      if (bad.length) {
        show(bad.length === 1 ? "Please check the highlighted field." : `Please check the ${bad.length} highlighted fields.`, "error");
        f[bad[0]].focus();
        return;
      }
      const booking = { name: f.name.value.trim(), email: f.email.value.trim(), date: f.date.value, guests: Number(f.guests.value), experience: f.tour.value };
      const when = parseISO(booking.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
      const summary = `${booking.experience} on ${when} for ${booking.guests} ${booking.guests === 1 ? "guest" : "guests"}`;
      const first = booking.name.split(/\s+/)[0];

      // Member accounts on (account.js): signed-in members save the request to their account.
      const acct = window.wrenAccount;
      if (acct && acct.isSignedIn()) {
        submit.disabled = true; show("Sending your request…");
        const res = await acct.submitBooking({ experience: booking.experience, date: booking.date, guests: booking.guests });
        submit.disabled = false;
        return res.ok ? show(`Thanks, ${first}! Your request for the ${summary} is saved. You’ll see it in My account, and its status changes once the team confirms it.`, "success")
          : show(res.error, "error");
      }
      // Formspree (or any endpoint that accepts a JSON POST and answers with JSON).
      if (endpoint) {
        submit.disabled = true; show("Sending your request…");
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ ...booking, _subject: `Booking request: ${summary}` }) });
          if (!r.ok) throw new Error(r.status);
          form.reset(); tried = false;
          show(`Thanks, ${first}! Your request for the ${summary} has been sent. We’ll email ${booking.email} to confirm.`, "success");
        } catch {
          show("Sorry, your request couldn’t be sent. Please try again in a moment.", "error");
        } finally { submit.disabled = false; }
        return;
      }
      if (acct) {
        show("Please log in or create an account to send a booking request.");
        acct.openSignIn(submit);
        return;
      }
      show(`Thanks, ${first}! Your request for the ${summary} is noted. This is a demo, so nothing was sent and no booking was made.`, "success");
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
