(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var lang = params.get("lang") === "sr" ? "sr" : "en";

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
  }

  applyLang(lang);

  document.addEventListener("DOMContentLoaded", function () {
    var navToggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(open));
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
    var galleryBtns = document.querySelectorAll(".event-gallery-btn");
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

      var currentGallery = null;
      var currentIndex = 0;

      function photoSrc(galleryId, index) {
        var info = galleries[galleryId];
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

    // PDF catalog lightbox: any button with class "catalog-btn" and a
    // data-catalog="path/to/file.pdf" attribute opens that PDF in an overlay.
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
          openPdf(btn.getAttribute("data-catalog"));
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
