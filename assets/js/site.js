/* Ayala's Painting - shared site JS
   Nav, reveal animations, UTM capture, lead form handling, click tracking */
(function () {
  "use strict";

  /* ---------- NAV ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 60);
    }, { passive: true });
  }

  var hamburger = document.getElementById("hamburger");
  var navMobile = document.getElementById("navMobile");
  if (hamburger && navMobile) {
    hamburger.addEventListener("click", function () {
      var open = navMobile.classList.toggle("open");
      hamburger.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".mobile-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navMobile.classList.remove("open");
        hamburger.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- REVEAL ---------- */
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { obs.observe(el); });

  /* ---------- SMOOTH ANCHORS (same-page only) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (id === "#") return;
      var t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
        window.scrollTo({ top: t.offsetTop - offset, behavior: "smooth" });
      }
    });
  });

  /* ---------- UTM / ATTRIBUTION CAPTURE ----------
     First-touch attribution stored in sessionStorage so it survives
     browsing between pages before the form is submitted. */
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  var STORE_KEY = "ayl_attribution";

  function captureAttribution() {
    var existing = null;
    try { existing = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { /* noop */ }

    var params = new URLSearchParams(window.location.search);
    var hasNew = ATTR_KEYS.some(function (k) { return params.has(k); });

    if (!existing) {
      var data = { landing_page: window.location.pathname, referrer: document.referrer || "direct" };
      ATTR_KEYS.forEach(function (k) { data[k] = params.get(k) || ""; });
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* noop */ }
      return data;
    }
    /* New campaign params mid-session override first touch */
    if (hasNew) {
      ATTR_KEYS.forEach(function (k) { if (params.has(k)) existing[k] = params.get(k); });
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(existing)); } catch (e) { /* noop */ }
    }
    return existing;
  }

  var attribution = captureAttribution();

  /* Populate hidden inputs: any input with data-attr="<key>" */
  document.querySelectorAll("input[data-attr]").forEach(function (input) {
    var key = input.getAttribute("data-attr");
    if (attribution && attribution[key] !== undefined) input.value = attribution[key];
  });

  /* ---------- LEAD FORMS ----------
     Any form with [data-lead-form] posts to its action via fetch,
     then redirects to data-redirect (the thank-you page fires the
     conversion events). */
  document.querySelectorAll("form[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var err = form.querySelector(".form-error");
      var original = btn ? btn.textContent : "";
      if (btn) { btn.textContent = "Sending..."; btn.disabled = true; }
      if (err) err.style.display = "none";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (response) {
        if (!response.ok) throw new Error("failed");
        window.location.href = form.getAttribute("data-redirect") || "/";
      }).catch(function () {
        if (btn) { btn.textContent = original; btn.disabled = false; }
        if (err) err.style.display = "block";
      });
    });
  });

  /* ---------- CLICK TRACKING ---------- */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (typeof gtag !== "undefined") gtag("event", "phone_click", { page_path: window.location.pathname });
      if (typeof fbq !== "undefined") fbq("trackCustom", "PhoneClick");
    });
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (typeof gtag !== "undefined") gtag("event", "email_click", { page_path: window.location.pathname });
    });
  });
})();
