(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var lang = params.get("lang") === "en" ? "en" : "sr";   // default: srpski

  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-en]").forEach(function (el) {
      var text = lang === "sr" ? (el.getAttribute("data-sr") || el.getAttribute("data-en")) : el.getAttribute("data-en");
      if (text !== null) el.textContent = text;
    });

    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var text = lang === "sr" ? (el.getAttribute("data-sr-ph") || el.getAttribute("data-en-ph")) : el.getAttribute("data-en-ph");
      if (text !== null) el.setAttribute("placeholder", text);
    });

    document.querySelectorAll("[data-en-src]").forEach(function (el) {
      var src = lang === "sr" ? (el.getAttribute("data-sr-src") || el.getAttribute("data-en-src")) : el.getAttribute("data-en-src");
      if (src !== null) el.setAttribute("src", src);
    });

    // Carry the language choice through every internal link
    document.querySelectorAll("a[data-internal]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var hashIndex = href.indexOf("#");
      var hash = "";
      var path = href;
      if (hashIndex !== -1) {
        hash = href.slice(hashIndex);
        path = href.slice(0, hashIndex);
      }
      var base = path.split("?")[0];
      a.setAttribute("href", (base || "") + "?lang=" + lang + hash);
    });

    var toggle = document.getElementById("lang-toggle");
    if (toggle) {
      var target = lang === "sr" ? "en" : "sr";
      var flagSrc = target === "en" ? "assets/flags/en.jpg" : "assets/flags/sr.jpg";
      var flagAlt = target === "en" ? "English" : "Srpski";
      toggle.innerHTML = '<img src="' + flagSrc + '" alt="' + flagAlt + '">';
      toggle.setAttribute("aria-label", flagAlt);
      toggle.setAttribute("data-target-lang", target);
      var tHref = window.location.pathname.split("/").pop() || "index.html";
      toggle.setAttribute("href", tHref + "?lang=" + target);
    }

    // Desktop language switch: two dots (SR above EN), like the logo's colon.
    if (toggle && !document.querySelector(".lang-dots")) {
      var dots = document.createElement("div");
      dots.className = "lang-dots";
      ["sr", "en"].forEach(function (code) {
        var d = document.createElement("a");
        var t = document.createElement("span");
        t.textContent = code.toUpperCase();
        d.appendChild(t);
        d.setAttribute("href", tHref + "?lang=" + code);
        d.setAttribute("lang", code);
        d.setAttribute("aria-label", code === "sr" ? "Srpski" : "English");
        if (code === lang) { d.className = "is-active"; d.setAttribute("aria-current", "true"); }
        dots.appendChild(d);
      });
      toggle.insertAdjacentElement("afterend", dots);
    }
  }

  applyLang(lang);

  document.addEventListener("DOMContentLoaded", function () {
    var navToggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (navToggle && nav) {
      // Mobile menu: start the panel right under the header, lock page scroll
      // while open, and add a small contact strip at the bottom of the panel.
      var header = document.querySelector(".site-header");
      if (!nav.querySelector(".mnav-contact")) {
        var mc = document.createElement("div");
        mc.className = "mnav-contact";
        mc.innerHTML = '<a href="mailto:proanalytica@proanalytica.com">proanalytica@proanalytica.com</a>' +
                       '<a href="tel:+381113130542">+381 11 313 0542</a>';
        nav.appendChild(mc);
      }
      // Mark the product category the current page belongs to
      // (product-chemicals*.html, product-furniture*.html, product-equipment*.html).
      var page = location.pathname.split("/").pop() || "index.html";
      nav.querySelectorAll(".mega-col").forEach(function (col) {
        var t = col.querySelector(".mega-col-title");
        if (!t) return;
        var base = (t.getAttribute("href") || "").split("?")[0].replace(".html", "");
        if (base && (page === base + ".html" || page.indexOf(base + "-") === 0)) col.classList.add("is-current");

        // Mobile accordion: a chevron button that shows/hides the subcategories.
        // The current category starts expanded. (The button is hidden on desktop.)
        var sub = col.querySelector("ul");
        if (!sub || col.querySelector(".mcol-toggle")) return;
        var tg = document.createElement("button");
        tg.type = "button";
        tg.className = "mcol-toggle";
        tg.setAttribute("aria-label", "Podkategorije");
        tg.innerHTML = '<svg width="14" height="9" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        t.insertAdjacentElement("afterend", tg);
        if (col.classList.contains("is-current")) col.classList.add("is-expanded");
        tg.setAttribute("aria-expanded", String(col.classList.contains("is-expanded")));
        tg.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var ex = col.classList.toggle("is-expanded");
          tg.setAttribute("aria-expanded", String(ex));
        });
        sub.querySelectorAll("a").forEach(function (a) {
          if ((a.getAttribute("href") || "").split("?")[0] === page) a.classList.add("is-current");
        });
      });
      // Auto-fit: shrink spacing (and, a little, text) so the whole open menu
      // fits the screen height on any phone. Finds the largest scale 0.35–1 that fits.
      // If the expanded current category does not fit even at a moderate scale
      // (small phones), it opens collapsed instead (still highlighted).
      function fitScale() {
        var lo = 0.35, hi = 1, i;
        nav.style.setProperty("--mfit", "1");
        if (nav.scrollHeight <= nav.clientHeight + 1) return 1;
        for (i = 0; i < 8; i++) {
          var mid = (lo + hi) / 2;
          nav.style.setProperty("--mfit", mid.toFixed(3));
          if (nav.scrollHeight <= nav.clientHeight + 1) lo = mid; else hi = mid;
        }
        return lo;
      }
      function fitNav(opening) {
        if (window.innerWidth > 780) { nav.style.removeProperty("--mfit"); return; }
        var s = fitScale();
        var ex = nav.querySelector(".mega-col.is-current.is-expanded");
        if (opening && ex && s < 0.6) {
          ex.classList.remove("is-expanded");
          var t = ex.querySelector(".mcol-toggle");
          if (t) t.setAttribute("aria-expanded", "false");
          s = fitScale();
        }
        nav.style.setProperty("--mfit", s.toFixed(3));
      }
      window.addEventListener("resize", function () {
        if (nav.classList.contains("is-open")) {
          if (header) nav.style.setProperty("--mnav-top", header.getBoundingClientRect().bottom + "px");
          fitNav();
        }
      });
      navToggle.addEventListener("click", function () {
        if (header) nav.style.setProperty("--mnav-top", header.getBoundingClientRect().bottom + "px");
        if (!nav.classList.contains("is-open")) fitNav(true);
        var open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("nav-open", open);
      });
    }

    document.querySelectorAll(".has-dropdown").forEach(function (li) {
      var btn = li.querySelector(".dropdown-toggle");
      var menu = li.querySelector(".dropdown-menu");
      if (!btn || !menu) return;

      function openMenu() {
        menu.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
      function closeMenu() {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }

      // Mouse: open on enter, close on leave — no lingering state to get stuck.
      li.addEventListener("mouseenter", openMenu);
      li.addEventListener("mouseleave", closeMenu);

      // Touch / keyboard: click toggles explicitly.
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (menu.classList.contains("is-open")) {
          closeMenu();
          btn.blur();
        } else {
          openMenu();
        }
      });

      // Keyboard focus opens it; losing focus (Tab away) closes it.
      btn.addEventListener("focus", openMenu);
      btn.addEventListener("blur", function () {
        // Small delay so a click on a menu link isn't cancelled by the blur.
        setTimeout(function () {
          if (!li.contains(document.activeElement)) closeMenu();
        }, 120);
      });
    });

    document.addEventListener("click", function () {
      document.querySelectorAll(".dropdown-menu.is-open").forEach(function (menu) {
        menu.classList.remove("is-open");
        var btn = menu.previousElementSibling;
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".dropdown-menu.is-open").forEach(function (menu) {
          menu.classList.remove("is-open");
          var btn = menu.previousElementSibling;
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }
    });

    // Full-page depth background (present only on pages with #furniture-page-bg):
    // Rellax.js moves it at a fraction of normal scroll speed for the depth/lag effect.

    // Section parallax (Rellax.js — only present on pages that include a .rellax element)
    if (document.querySelector(".rellax") && typeof Rellax !== "undefined" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      new Rellax(".rellax");
    }

    // Event photo galleries (DEMOLAB page): each "Gallery" button opens a lightbox
    // that browses assets/events/<gallery-id>/photo-01.jpg, photo-02.jpg, ... in order.
    var galleryBtns = document.querySelectorAll(".event-gallery-btn, .js-gallery");
    if (galleryBtns.length) {
      var lightbox = document.getElementById("gallery-lightbox");
      var lightboxImg = document.getElementById("gallery-image");
      var counter = document.getElementById("gallery-counter");
      var closeBtn = document.getElementById("gallery-close");
      var prevBtn = document.getElementById("gallery-prev");
      var nextBtn = document.getElementById("gallery-next");

      // Known photo counts per gallery id (file naming: photo-01.jpg ... photo-NN.jpg,
      // last one is photo-NN-group.jpg where applicable)
      var galleries = {
        "nutrijenti-2025": {
          count: 12,
          lastIsGroup: true
        },
        "podgorica-2024": {
          count: 8,
          lastIsGroup: true
        },
        "total-workflow-2024": {
          count: 14,
          lastIsGroup: true
        }
      };

      // Galleries with an explicit photo list (data-photos="a.jpg,b.jpg,..."),
      // e.g. the home page banner.
      galleryBtns.forEach(function (btn) {
        var list = btn.getAttribute("data-photos");
        if (list) {
          var photos = list.split(",").map(function (p) { return p.trim(); });
          galleries[btn.getAttribute("data-gallery")] = { count: photos.length, photos: photos };
        }
      });

      var currentGallery = null;
      var currentIndex = 0;

      function photoSrc(galleryId, index) {
        var info = galleries[galleryId];
        if (info.photos) return info.photos[index];
        var n = index + 1;
        var padded = n < 10 ? "0" + n : String(n);
        if (info.lastIsGroup && n === info.count) {
          return "assets/events/" + galleryId + "/photo-" + padded + "-group.jpg";
        }
        return "assets/events/" + galleryId + "/photo-" + padded + ".jpg";
      }

      function showPhoto() {
        var info = galleries[currentGallery];
        lightboxImg.src = photoSrc(currentGallery, currentIndex);
        counter.textContent = (currentIndex + 1) + " / " + info.count;
      }

      function openGallery(galleryId) {
        if (!galleries[galleryId]) return;
        currentGallery = galleryId;
        currentIndex = 0;
        showPhoto();
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }

      function closeGallery() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }

      function nextPhoto() {
        var info = galleries[currentGallery];
        currentIndex = (currentIndex + 1) % info.count;
        showPhoto();
      }

      function prevPhoto() {
        var info = galleries[currentGallery];
        currentIndex = (currentIndex - 1 + info.count) % info.count;
        showPhoto();
      }

      galleryBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          openGallery(btn.getAttribute("data-gallery"));
        });
      });

      closeBtn.addEventListener("click", closeGallery);
      nextBtn.addEventListener("click", nextPhoto);
      prevBtn.addEventListener("click", prevPhoto);

      // Close when clicking anywhere outside the photo and the controls
      // (the inner wrapper fills the whole overlay, so check it too).
      var lightboxInner = lightbox.querySelector(".gallery-lightbox-inner");
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox || e.target === lightboxInner || e.target === counter) closeGallery();
      });

      document.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") closeGallery();
        if (e.key === "ArrowRight") nextPhoto();
        if (e.key === "ArrowLeft") prevPhoto();
      });
    }

    // Contact page: "General company details" — opens on click, stays open
    // (so the numbers can be copied) and closes only on a click outside it.
    var cd = document.getElementById("company-details");
    if (cd) {
      var cdBtn = cd.querySelector(".cd-toggle");
      cdBtn.addEventListener("click", function () {
        var open = cd.classList.toggle("is-open");
        cdBtn.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", function (e) {
        if (cd.classList.contains("is-open") && !cd.contains(e.target)) {
          cd.classList.remove("is-open");
          cdBtn.setAttribute("aria-expanded", "false");
        }
      });
    }

    // YouTube video lightbox: any button with class "video-btn" and a
    // data-video="<YouTube ID>" attribute plays that video in an overlay.
    // Closes on the X, on Escape, or on a click anywhere outside the video.
    var videoBtns = document.querySelectorAll(".video-btn");
    if (videoBtns.length) {
      var videoLightbox = document.getElementById("video-lightbox");
      var videoFrame = document.getElementById("video-frame");
      var videoClose = document.getElementById("video-close");

      function openVideo(id) {
        videoFrame.setAttribute("src", "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0");
        videoLightbox.classList.add("is-open");
        videoLightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
      function closeVideo() {
        videoLightbox.classList.remove("is-open");
        videoLightbox.setAttribute("aria-hidden", "true");
        videoFrame.setAttribute("src", ""); // stops playback
        document.body.style.overflow = "";
      }

      videoBtns.forEach(function (btn) {
        btn.addEventListener("click", function () { openVideo(btn.getAttribute("data-video")); });
      });
      videoClose.addEventListener("click", closeVideo);
      videoLightbox.addEventListener("click", function (e) {
        if (e.target === videoLightbox) closeVideo();
      });
      document.addEventListener("keydown", function (e) {
        if (videoLightbox.classList.contains("is-open") && e.key === "Escape") closeVideo();
      });
    }

    // PDF catalog lightbox: any button with class "catalog-btn" and a
    // data-catalog="path/to/file.pdf" attribute opens that PDF in an overlay
    // (data-catalog-en, if present, is opened instead on the English page).
    var catalogBtns = document.querySelectorAll(".catalog-btn");
    if (catalogBtns.length) {
      var pdfLightbox = document.getElementById("pdf-lightbox");
      var pdfFrame = document.getElementById("pdf-frame");
      var pdfClose = document.getElementById("pdf-close");

      function openPdf(src) {
        pdfFrame.setAttribute("src", src);
        pdfLightbox.classList.add("is-open");
        pdfLightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }

      function closePdf() {
        pdfLightbox.classList.remove("is-open");
        pdfLightbox.setAttribute("aria-hidden", "true");
        pdfFrame.setAttribute("src", "");
        document.body.style.overflow = "";
      }

      catalogBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          // Optional English version: data-catalog-en (used when the page is in English)
          var enSrc = document.documentElement.getAttribute("lang") === "en" ? btn.getAttribute("data-catalog-en") : null;
          openPdf(enSrc || btn.getAttribute("data-catalog"));
        });
      });

      pdfClose.addEventListener("click", closePdf);

      pdfLightbox.addEventListener("click", function (e) {
        if (e.target === pdfLightbox) closePdf();
      });

      document.addEventListener("keydown", function (e) {
        if (pdfLightbox.classList.contains("is-open") && e.key === "Escape") closePdf();
      });
    }
  });
})();

// Contact form: send via send.php (cPanel) and show an inline status message.
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var btn = form.querySelector('button[type="submit"]');
  var ts = form.querySelector('input[name="ts"]');
  var langField = form.querySelector('input[name="lang"]');
  if (ts) ts.value = Date.now();
  function lang() { return document.documentElement.lang === "en" || /[?&]lang=en/.test(location.search) ? "en" : "sr"; }
  var T = {
    sending: { en: "Sending…", sr: "Slanje…" },
    ok:      { en: "Thank you — your message has been sent. We will reply as soon as possible.",
               sr: "Hvala — Vaša poruka je poslata. Odgovorićemo Vam u najkraćem roku." },
    invalid: { en: "Please fill in your name, a valid email address and the message.",
               sr: "Molimo Vas da unesete ime, ispravnu e-mail adresu i poruku." },
    fail:    { en: "The message could not be sent. Please write to us directly at proanalytica@proanalytica.com.",
               sr: "Poruka nije poslata. Molimo Vas da nam pišete direktno na proanalytica@proanalytica.com." }
  };
  function show(kind, key) {
    status.className = "form-status is-" + kind;
    status.textContent = T[key][lang()];
    status.hidden = false;
  }
  // Fallback without JS: send.php redirects back with ?sent=1 / ?error=...
  if (/[?&]sent=1/.test(location.search)) show("ok", "ok");
  else if (/[?&]error=invalid/.test(location.search)) show("error", "invalid");
  else if (/[?&]error=/.test(location.search)) show("error", "fail");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (langField) langField.value = lang();
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = T.sending[lang()];
    status.hidden = true;
    fetch(form.getAttribute("action"), {
      method: "POST", body: new FormData(form),
      headers: { "X-Requested-With": "XMLHttpRequest" }
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "mail" }; }); })
      .then(function (res) {
        if (res.ok) { form.reset(); if (ts) ts.value = Date.now(); show("ok", "ok"); }
        else show("error", res.error === "invalid" ? "invalid" : "fail");
      })
      .catch(function () { show("error", "fail"); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

// ---------- Products page: Prezi-style zoom into a category (Oct 2026) ----------
(function () {
  var cards = document.querySelectorAll(".cat-card[data-zoom]");
  if (!cards.length) return;
  var main = document.querySelector("main");
  var header = document.querySelector(".site-header");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null, lastCard = null, busy = false;
  var DUR = reduce ? 0 : 800;
  var root = document.documentElement;
  // The page "camera" zoom is only used on desktop: on phones a scaled page widens the
  // layout viewport for a moment, which made the panel text appear too wide and then snap.
  var zoomPage = !reduce && window.matchMedia && window.matchMedia("(min-width: 901px) and (hover: hover)").matches;
  // Desktop keeps its scrollbar (no layout jump); the page is simply held in place while a
  // panel is open. Phones lock scrolling the usual way.
  var desktop = zoomPage;
  if (desktop) root.style.overflowY = "scroll";
  var pinY = 0;
  function pin() { if (window.scrollY !== pinY) window.scrollTo(0, pinY); }
  function stopWheel(e) { if (!e.target.closest || !e.target.closest(".cz-scroll") || !canScroll(e.target.closest(".cz-scroll"), e.deltaY)) e.preventDefault(); }
  function canScroll(el, dy) { return dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1; }
  function stopKeys(e) {
    var k = e.key;
    if ((k === " " || k === "PageDown" || k === "PageUp" || k === "Home" || k === "End" || k === "ArrowDown" || k === "ArrowUp") && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) e.preventDefault();
  }
  function lock() {
    if (desktop) {
      pinY = window.scrollY;
      window.addEventListener("scroll", pin);
      window.addEventListener("wheel", stopWheel, { passive: false });
      window.addEventListener("keydown", stopKeys);
      document.body.classList.add("cz-clip");
    } else {
      document.body.classList.add("cz-lock");
    }
  }
  function unlock() {
    window.removeEventListener("scroll", pin);
    window.removeEventListener("wheel", stopWheel, { passive: false });
    window.removeEventListener("keydown", stopKeys);
    document.body.classList.remove("cz-lock", "cz-clip");
  }

  function headerBottom() { return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0; }
  function place(panel, card) {
    var top = headerBottom();
    var icon = card.querySelector(".cat-icon").getBoundingClientRect();
    var x = icon.left + icon.width / 2, y = icon.top + icon.height / 2 - top;
    var w = window.innerWidth, h = window.innerHeight - top;
    var r = Math.ceil(Math.sqrt(Math.pow(Math.max(x, w - x), 2) + Math.pow(Math.max(y, h - y), 2))) + 4;
    panel.style.setProperty("--cz-top", top + "px");
    panel.style.setProperty("--cz-x", x + "px");
    panel.style.setProperty("--cz-y", y + "px");
    panel.style.setProperty("--cz-r", r + "px");
    return { x: x, y: y + top };
  }
  function open(card, push) {
    if (busy || current) return;
    var panel = document.getElementById(card.getAttribute("data-zoom"));
    if (!panel) return;
    busy = true; lastCard = card; current = panel;
    var pt = place(panel, card);
    lock();
    panel.hidden = false; panel.setAttribute("aria-hidden", "false");
    if (main && zoomPage) {
      main.style.transformOrigin = pt.x + "px " + (pt.y + window.scrollY) + "px";
      main.classList.add("cz-zooming");
    }
    panel.getBoundingClientRect(); // commit the start state before animating
    requestAnimationFrame(function () {
      panel.classList.add("is-open");
      if (main && zoomPage) main.style.transform = "scale(1.8)";
    });
    if (push !== false && history.pushState) history.pushState({ cz: panel.id }, "", "#" + panel.id.replace(/^cz-/, ""));
    setTimeout(function () {
      if (main) { main.classList.remove("cz-zooming"); main.style.transform = ""; }
      var back = panel.querySelector(".cz-back"); if (back) back.focus({ preventScroll: true });
      busy = false;
    }, DUR + 50);
  }
  function close(fromHistory) {
    if (busy || !current) return;
    busy = true;
    var panel = current;
    var pt = place(panel, lastCard);
    if (main && zoomPage) {
      main.style.transformOrigin = pt.x + "px " + (pt.y + window.scrollY) + "px";
      main.style.transform = "scale(1.8)";
      main.getBoundingClientRect();
      main.classList.add("cz-zooming");
      requestAnimationFrame(function () { main.style.transform = "scale(1)"; });
    }
    panel.classList.remove("is-open");
    setTimeout(function () {
      panel.hidden = true; panel.setAttribute("aria-hidden", "true");
      if (main) { main.classList.remove("cz-zooming"); main.style.transform = ""; main.style.transformOrigin = ""; }
      unlock();
      if (lastCard) lastCard.focus({ preventScroll: true });
      current = null; busy = false;
    }, DUR + 50);
    if (!fromHistory && history.state && history.state.cz) history.back();
    else if (!fromHistory && location.hash && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }
  cards.forEach(function (card) { card.addEventListener("click", function () { open(card); }); });
  document.querySelectorAll(".cat-zoom .cz-back").forEach(function (b) { b.addEventListener("click", function () { close(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && current) close(false); });
  window.addEventListener("popstate", function () { if (current) close(true); });
  window.addEventListener("resize", function () { if (current && lastCard) place(current, lastCard); });
  // Opening a deep link such as products.html#oprema shows that panel straight away
  var hash = location.hash.replace("#", "");
  if (hash) {
    var target = document.querySelector('.cat-card[data-zoom="cz-' + hash + '"]');
    if (target) { var d = DUR, z = zoomPage; DUR = 0; zoomPage = false; open(target, false); DUR = d; zoomPage = z; }
  }
})();
