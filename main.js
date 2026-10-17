/* Salon 963 — interactions */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Language ---------- */
  function storedLang() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q === "ar" || q === "en") return q;
      return localStorage.getItem("963-lang");
    } catch (e) { return null; }
  }

  function applyLang(lang) {
    var dict = window.I18N[lang];
    if (!dict) return;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] == null) return;
      el.textContent = dict[key];
      if (dict[key].indexOf("963") !== -1) {
        // single wrapper so flex parents (e.g. .eyebrow) keep it as one text run
        el.innerHTML = "<span>" + el.innerHTML.replace(/963/g, '<span class="n963">963</span>') + "</span>";
      }
    });
    document.querySelectorAll(".media__sound").forEach(function (btn) {
      btn.setAttribute("aria-label", dict[btn.getAttribute("aria-pressed") === "true" ? "soundOff" : "soundOn"]);
    });
    document.title = dict._title;
    var label = document.querySelector("[data-lang-label]");
    if (label) label.textContent = dict._switch;
    var toggle = document.getElementById("langToggle");
    if (toggle) toggle.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    try { localStorage.setItem("963-lang", lang); } catch (e) {}
  }

  applyLang(storedLang() || "ar");

  document.getElementById("langToggle").addEventListener("click", function () {
    var next = root.lang === "ar" ? "en" : "ar";
    if (reduceMotion) return applyLang(next);
    body.classList.add("is-switching");
    setTimeout(function () {
      applyLang(next);
      requestAnimationFrame(function () { body.classList.remove("is-switching"); });
    }, 350);
  });

  /* ---------- Loader ---------- */
  function finishLoading() { body.classList.add("is-loaded"); }
  if (reduceMotion) finishLoading();
  else {
    // open right after the scissors finish their cut (0.55s delay + 0.95s travel);
    // the DOM is ready here, images keep loading behind the reveal
    setTimeout(finishLoading, 1600);
  }

  /* ---------- Year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled / hide on scroll down ---------- */
  var nav = document.querySelector(".nav");
  var wa = document.querySelector(".wa-float");
  var lastY = window.scrollY;
  var ticking = false;
  var bgmark = document.querySelector(".hero__media");

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    var menuOpen = burger.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY);
    wa.classList.toggle("is-visible", y > window.innerHeight * 0.6);
    if (bgmark && !reduceMotion && y < window.innerHeight * 1.2) {
      bgmark.style.transform = "translate3d(0," + (y * 0.3).toFixed(1) + "px,0)";
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobileMenu");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add("is-open"); });
      body.style.overflow = "hidden";
    } else {
      menu.classList.remove("is-open");
      body.style.overflow = "";
      setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 800);
    }
  }
  burger.addEventListener("click", function () {
    setMenu(burger.getAttribute("aria-expanded") !== "true");
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll(".reveal, .reveal-frame");

  // Stagger siblings that reveal together
  document.querySelectorAll(".svc, .ritual__grid, .contact, .stats").forEach(function (group) {
    group.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.setProperty("--d", (i * 0.05).toFixed(2) + "s");
    });
  });
  document.querySelectorAll(".hero .reveal").forEach(function (el, i) {
    el.style.setProperty("--d", (0.2 + i * 0.07).toFixed(2) + "s");
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var inHero = el.closest(".hero");
        if (inHero && !body.classList.contains("is-loaded")) {
          var wait = setInterval(function () {
            if (body.classList.contains("is-loaded")) { clearInterval(wait); el.classList.add("is-in"); }
          }, 100);
        } else {
          el.classList.add("is-in");
        }
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Films: load near view, play muted while visible ---------- */
  var videos = document.querySelectorAll(".media__video");
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.hasAttribute("data-src")) {
            v.src = v.getAttribute("data-src");
            v.removeAttribute("data-src");
            v.preload = "auto";
          }
          if (!reduceMotion || !v.muted) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { vio.observe(v); });
  } else {
    videos.forEach(function (v) { v.src = v.getAttribute("data-src"); v.controls = true; });
  }

  document.querySelectorAll(".media__sound").forEach(function (btn) {
    var v = btn.parentNode.querySelector("video");
    btn.addEventListener("click", function () {
      var unmute = v.muted;
      // only one film plays with sound at a time
      if (unmute) {
        videos.forEach(function (other) {
          if (other !== v && !other.muted) {
            other.muted = true;
            var b = other.parentNode.querySelector(".media__sound");
            b.setAttribute("aria-pressed", "false");
            b.setAttribute("aria-label", window.I18N[root.lang].soundOn);
          }
        });
      }
      v.muted = !unmute;
      if (unmute) {
        if (v.hasAttribute("data-src")) { v.src = v.getAttribute("data-src"); v.removeAttribute("data-src"); }
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
      btn.setAttribute("aria-pressed", String(unmute));
      btn.setAttribute("aria-label", window.I18N[root.lang][unmute ? "soundOff" : "soundOn"]);
    });
  });

  /* ---------- Lazy iframes (map) ---------- */
  var lazyFrames = document.querySelectorAll("iframe[data-src]");
  function loadFrame(f) {
    if (!f.hasAttribute("data-src")) return;
    f.src = f.getAttribute("data-src");
    f.removeAttribute("data-src");
  }
  if ("IntersectionObserver" in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { loadFrame(entry.target); fio.unobserve(entry.target); }
      });
    }, { rootMargin: "400px 0px" });
    lazyFrames.forEach(function (f) { fio.observe(f); });
  } else {
    lazyFrames.forEach(loadFrame);
  }

  /* ---------- Active nav link ---------- */
  var links = document.querySelectorAll(".nav__links a");
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["about", "services", "films", "visit"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sio.observe(s);
    });
  }
})();
