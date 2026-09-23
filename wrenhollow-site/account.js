/* Wrenhollow — member accounts (Supabase Auth + Postgres with Row Level Security).
 * Only switches on when server.mjs reports a Supabase project (GET /api/config → {accounts:{url, anonKey}}).
 * Exposes window.wrenAccount for the booking form in app.js. */
(() => {
  "use strict";
  const STAMPS_FOR_REWARD = 10;
  const $ = (s, r = document) => r.querySelector(s);
  let sb = null;         // Supabase client
  let session = null;
  let dialog, opener;

  /* ---------- boot ---------- */
  async function config() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      return r.ok ? (await r.json()).accounts : null;
    } catch { return null; }
  }
  function loadLibrary() {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/vendor/supabase.js";
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.append(s);
    });
  }

  config().then(async (cfg) => {
    if (!cfg) return;
    try { await loadLibrary(); } catch { console.warn("[accounts] couldn't load the Supabase library"); return; }
    sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    buildUi();
    window.wrenAccount = api;
    // Don't await other Supabase calls inside this callback (the library warns it can deadlock); defer them.
    sb.auth.onAuthStateChange((event, s) => {
      session = s;
      setTimeout(() => onAuth(event), 0);
    });
  });

  /* ---------- UI shell ---------- */
  const icon = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  function buildUi() {
    document.body.classList.add("has-accounts");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "account-btn";
    btn.innerHTML = `${icon}<span class="account-btn-label">Log in</span>`;
    btn.addEventListener("click", () => open(session ? "account" : "login", btn));
    $(".header-inner").insertBefore(btn, $(".header-cta"));

    const li = document.createElement("li");
    li.innerHTML = `<a href="#account" class="account-menu-link">Log in</a>`;
    $("#mobile-menu nav ul").append(li);
    li.querySelector("a").addEventListener("click", (e) => { e.preventDefault(); setTimeout(() => open(session ? "account" : "login", btn), 0); });

    const flag = $("#booking .demo-flag");
    if (flag) flag.innerHTML = `Log in or create an account to send a booking request. <button type="button" class="linkish" data-open="signup">Create an account</button>`;
    flag?.querySelector("[data-open]").addEventListener("click", (e) => open("signup", e.currentTarget));

    dialog = document.createElement("dialog");
    dialog.className = "account-dialog";
    dialog.setAttribute("aria-labelledby", "account-title");
    dialog.innerHTML = `
      <button class="account-close" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="account-brand"><img src="assets/logo-mark.svg" alt="" width="40" height="40"><span>Wrenhollow members</span></div>

      <section data-view="login">
        <h2 tabindex="-1">Log in</h2>
        <form data-form="login" novalidate>
          <div class="field"><label for="li-email">Email</label><input id="li-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="li-pass">Password</label><input id="li-pass" name="password" type="password" autocomplete="current-password" required></div>
          <button class="btn btn-primary btn-block" type="submit">Log in</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>
        <p class="account-alt"><button type="button" class="linkish" data-go="forgot">Forgot password?</button></p>
        <p class="account-alt">New here? <button type="button" class="linkish" data-go="signup">Create an account</button></p>
      </section>

      <section data-view="signup" hidden>
        <h2 tabindex="-1">Create an account</h2>
        <p class="account-lede">Save booking requests, see their status and collect loyalty stamps on every visit.</p>
        <form data-form="signup" novalidate>
          <div class="field"><label for="su-name">Name</label><input id="su-name" name="name" autocomplete="name" maxlength="100" required></div>
          <div class="field"><label for="su-email">Email</label><input id="su-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="su-pass">Password <span class="hint">(at least 8 characters)</span></label><input id="su-pass" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
          <label class="check"><input type="checkbox" name="adult" required> I'm 18 or over</label>
          <label class="check"><input type="checkbox" name="marketing"> Email me about new releases and events (optional)</label>
          <p class="fine-print">By creating an account you agree to our <a href="privacy.html" target="_blank" rel="noopener">privacy notice</a>.</p>
          <button class="btn btn-primary btn-block" type="submit">Create account</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>
        <p class="account-alt">Already a member? <button type="button" class="linkish" data-go="login">Log in</button></p>
      </section>

      <section data-view="forgot" hidden>
        <h2 tabindex="-1">Reset your password</h2>
        <p class="account-lede">Enter your email and we'll send you a link to choose a new password.</p>
        <form data-form="forgot" novalidate>
          <div class="field"><label for="fp-email">Email</label><input id="fp-email" name="email" type="email" autocomplete="email" required></div>
          <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>
        <p class="account-alt"><button type="button" class="linkish" data-go="login">Back to log in</button></p>
      </section>

      <section data-view="reset" hidden>
        <h2 tabindex="-1">Choose a new password</h2>
        <form data-form="reset" novalidate>
          <div class="field"><label for="rp-pass">New password <span class="hint">(at least 8 characters)</span></label><input id="rp-pass" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
          <button class="btn btn-primary btn-block" type="submit">Save new password</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>
      </section>

      <section data-view="check-email" hidden>
        <h2 tabindex="-1">Check your email</h2>
        <p class="account-lede" data-slot="check-email-text"></p>
        <button type="button" class="btn btn-ghost-dark btn-block" data-go="login">Back to log in</button>
      </section>

      <section data-view="account" hidden>
        <h2 tabindex="-1">Hello, <span data-slot="name">member</span></h2>
        <p class="account-email" data-slot="email"></p>

        <div class="stamp-card">
          <h3>Loyalty card</h3>
          <div class="stamps" data-slot="stamps" aria-hidden="true"></div>
          <p data-slot="stamp-text"></p>
        </div>

        <div class="account-block">
          <h3>My bookings</h3>
          <ul class="booking-list" data-slot="bookings"></ul>
          <a class="btn btn-primary" href="#visit" data-action="book">Request a booking</a>
        </div>

        <form class="account-block" data-form="profile" novalidate>
          <h3>My details</h3>
          <div class="field"><label for="pr-name">Name</label><input id="pr-name" name="name" autocomplete="name" maxlength="100" required></div>
          <label class="check"><input type="checkbox" name="marketing"> Email me about new releases and events</label>
          <button class="btn btn-ghost-dark" type="submit">Save details</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>

        <button type="button" class="linkish account-logout" data-action="logout">Log out</button>
      </section>`;
    document.body.append(dialog);

    dialog.querySelector(".account-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (opener && document.contains(opener)) opener.focus();
    });
    dialog.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) show(go.dataset.go);
      if (e.target.closest("[data-action=logout]")) logout();
      if (e.target.closest("[data-action=book]")) dialog.close();
    });
    for (const f of dialog.querySelectorAll("form")) f.addEventListener("submit", onSubmit);
  }

  function open(view, from) {
    opener = from || document.activeElement;
    show(view);
    if (!dialog.open) { dialog.showModal(); document.body.classList.add("dialog-open"); }
    focusHeading();
  }
  function show(view) {
    for (const sec of dialog.querySelectorAll("[data-view]")) {
      sec.hidden = sec.dataset.view !== view;
      sec.querySelector("h2").id = sec.hidden ? "" : "account-title"; // dialog is labelled by the visible heading
    }
    for (const m of dialog.querySelectorAll(".form-msg")) { m.textContent = ""; m.classList.remove("is-error"); }
    if (view === "account") renderAccount();
    if (dialog.open) focusHeading();
  }
  function focusHeading() {
    const sec = [...dialog.querySelectorAll("[data-view]")].find((s) => !s.hidden);
    // Forms start in their first field; the account page and messages start at the top.
    const first = ["account", "check-email"].includes(sec.dataset.view) ? null : sec.querySelector("input");
    (first || sec.querySelector("h2")).focus();
  }
  function msg(form, text, isError = false) {
    const el = form.querySelector(".form-msg");
    el.textContent = text;
    el.classList.toggle("is-error", isError);
  }
  function friendly(error) {
    const code = error?.code || "";
    if (code === "invalid_credentials") return "That email and password don't match. Please try again.";
    if (code === "email_not_confirmed") return "Please confirm your email first. Check your inbox for the link.";
    if (code === "weak_password") return "Please choose a stronger password (at least 8 characters).";
    if (code === "over_email_send_rate_limit" || error?.status === 429) return "Too many attempts. Please wait a minute and try again.";
    if (error?.name === "AuthRetryableFetchError" || error?.message === "Failed to fetch") return "Can't reach the members service right now. Check your connection and try again.";
    return error?.message || "Something went wrong. Please try again.";
  }

  /* ---------- auth state ---------- */
  function onAuth(event) {
    const label = session ? "My account" : "Log in";
    $(".account-btn-label").textContent = label;
    $(".account-btn").setAttribute("aria-label", label);
    $(".account-menu-link").textContent = label;
    if (event === "PASSWORD_RECOVERY") return open("reset");
    if (session) prefillBooking();
    if (!dialog.open) return;
    const current = [...dialog.querySelectorAll("[data-view]")].find((s) => !s.hidden)?.dataset.view;
    if (event === "SIGNED_IN" && (current === "login" || current === "signup")) show("account");
    if (event === "SIGNED_OUT") show("login");
  }

  function prefillBooking() {
    const name = $("#b-name"), email = $("#b-email");
    if (email && !email.value) email.value = session.user.email || "";
    if (name && !name.value) name.value = session.user.user_metadata?.full_name || "";
  }

  /* ---------- forms ---------- */
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const kind = form.dataset.form;
    const bad = [...form.querySelectorAll("input")].find((i) => !i.checkValidity());
    for (const i of form.querySelectorAll("input")) i.setAttribute("aria-invalid", i.checkValidity() ? "false" : "true");
    if (bad) {
      const text = bad.name === "adult" ? "Please confirm you're 18 or over."
        : bad.name === "password" ? "Please enter a password of at least 8 characters."
        : bad.type === "email" ? "Please enter a valid email address."
        : "Please fill in the highlighted field.";
      msg(form, text, true);
      bad.focus();
      return;
    }
    const data = new FormData(form);
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    msg(form, "Working on it…");
    const redirectTo = location.origin + location.pathname;
    try {
      if (kind === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: data.get("email"), password: data.get("password") });
        if (error) throw error;
        form.reset();
      } else if (kind === "signup") {
        const { data: res, error } = await sb.auth.signUp({
          email: data.get("email"),
          password: data.get("password"),
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: data.get("name").trim(), marketing_opt_in: data.get("marketing") === "on" },
          },
        });
        if (error) throw error;
        form.reset();
        if (!res.session) {
          dialog.querySelector("[data-slot=check-email-text]").textContent =
            `We've sent a confirmation link to ${data.get("email")}. Click it to finish creating your account, then log in.`;
          show("check-email");
        }
      } else if (kind === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(data.get("email"), { redirectTo });
        if (error) throw error;
        dialog.querySelector("[data-slot=check-email-text]").textContent =
          `If there's an account for ${data.get("email")}, we've sent it a link to reset the password.`;
        form.reset();
        show("check-email");
      } else if (kind === "reset") {
        const { error } = await sb.auth.updateUser({ password: data.get("password") });
        if (error) throw error;
        form.reset();
        show("account");
        msg(dialog.querySelector("[data-form=profile]"), "Your password has been updated.");
      } else if (kind === "profile") {
        const { error } = await sb.from("profiles")
          .update({ full_name: data.get("name").trim(), marketing_opt_in: data.get("marketing") === "on" })
          .eq("id", session.user.id);
        if (error) throw error;
        dialog.querySelector("[data-slot=name]").textContent = data.get("name").trim().split(" ")[0] || "member";
        msg(form, "Saved.");
      }
    } catch (error) {
      msg(form, friendly(error), true);
    } finally {
      submit.disabled = false;
    }
  }

  async function logout() {
    await sb.auth.signOut();
    dialog.close();
  }

  /* ---------- account page ---------- */
  async function renderAccount() {
    if (!session) return show("login");
    const user = session.user;
    const slot = (n) => dialog.querySelector(`[data-slot=${n}]`);
    slot("email").textContent = user.email;
    slot("name").textContent = (user.user_metadata?.full_name || "member").split(" ")[0];
    slot("bookings").innerHTML = `<li class="muted">Loading…</li>`;

    const [profile, bookings, stamps] = await Promise.all([
      sb.from("profiles").select("full_name, marketing_opt_in").eq("id", user.id).maybeSingle(),
      sb.from("bookings").select("id, experience, visit_date, guests, status").order("visit_date", { ascending: false }),
      sb.from("stamps").select("id", { count: "exact", head: true }),
    ]);

    const form = dialog.querySelector("[data-form=profile]");
    if (profile.data) {
      form.elements.namedItem("name").value = profile.data.full_name || "";
      form.elements.namedItem("marketing").checked = !!profile.data.marketing_opt_in;
      if (profile.data.full_name) slot("name").textContent = profile.data.full_name.split(" ")[0];
    }

    const list = slot("bookings");
    list.innerHTML = "";
    if (bookings.error) {
      list.innerHTML = `<li class="muted">Couldn't load your bookings. Please try again later.</li>`;
    } else if (!bookings.data.length) {
      list.innerHTML = `<li class="muted">No bookings yet.</li>`;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      for (const b of bookings.data) {
        const li = document.createElement("li");
        const when = new Date(b.visit_date + "T12:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        const info = document.createElement("div");
        const title = document.createElement("strong"); title.textContent = b.experience;
        const meta = document.createElement("span"); meta.textContent = `${when} · ${b.guests} ${b.guests === 1 ? "guest" : "guests"}`;
        info.append(title, meta);
        const status = document.createElement("span");
        status.className = `status status-${b.status}`;
        status.textContent = b.status;
        li.append(info, status);
        if (b.status !== "cancelled" && b.visit_date >= today) {
          const cancel = document.createElement("button");
          cancel.type = "button"; cancel.className = "linkish"; cancel.textContent = "Cancel";
          cancel.setAttribute("aria-label", `Cancel ${b.experience} on ${when}`);
          cancel.addEventListener("click", () => cancelBooking(b.id, cancel));
          li.append(cancel);
        }
        list.append(li);
      }
    }

    const count = stamps.error ? 0 : stamps.count || 0;
    const toward = count % STAMPS_FOR_REWARD;
    const card = slot("stamps");
    card.innerHTML = "";
    for (let i = 0; i < STAMPS_FOR_REWARD; i++) {
      const dot = document.createElement("span");
      dot.className = "stamp" + (i < toward ? " is-stamped" : "");
      card.append(dot);
    }
    const rewards = Math.floor(count / STAMPS_FOR_REWARD);
    slot("stamp-text").textContent =
      `${toward} of ${STAMPS_FOR_REWARD} stamps. Every ${STAMPS_FOR_REWARD}th visit earns a free Tasting Flight.` +
      (rewards ? ` You've earned ${rewards} so far!` : "") + " Ask at the bar to get stamped.";
  }

  async function cancelBooking(id, btn) {
    btn.disabled = true;
    const { error } = await sb.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) { btn.disabled = false; btn.textContent = "Couldn't cancel. Try again"; return; }
    renderAccount();
  }

  /* ---------- booking form hook (used by app.js) ---------- */
  const api = {
    isSignedIn: () => !!session,
    openSignIn: (from) => open("login", from),
    async submitBooking({ experience, date, guests }) {
      const { error } = await sb.from("bookings").insert({ experience, visit_date: date, guests });
      if (error) return { ok: false, error: friendly(error) };
      return { ok: true };
    },
  };
})();
