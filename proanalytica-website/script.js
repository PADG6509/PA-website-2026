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
      toggle.textContent = lang === "sr" ? "EN" : "SR";
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
  });
})();
