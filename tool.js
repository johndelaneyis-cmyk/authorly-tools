/* Shared tool runtime for Authorly.
   Loaded via <script src="/tool.js" defer></script>.
   Each tool page calls Authorly.initTool({ ...config }) with its specifics.
   Auto-wires: contact link mailto, genre-chip toggle, char counter. */

(function () {
  var Authorly = window.Authorly || (window.Authorly = {});

  // -------- Trusted Types default policy ---------------------------------
  // feedback.js installs this on tool pages (loads first); we ONLY install
  // here when no default policy exists yet — pages like 404.html ship
  // tool.js without feedback.js. Checking `defaultPolicy` prevents
  // duplicate-creation churn even though CSP allows duplicates.
  if (typeof window.trustedTypes !== "undefined" &&
      window.trustedTypes.createPolicy &&
      !window.trustedTypes.defaultPolicy) {
    try {
      window.trustedTypes.createPolicy("default", {
        createHTML: function (s) { return String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""); },
        createScript: function (s) { return String(s); },
        createScriptURL: function (s) { return String(s); }
      });
    } catch (e) { /* already installed or refused */ }
  }

  // -------- Markdown rendering used by every tool's output ----------
  Authorly.renderMarkdown = function (md) {
    var html = String(md || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    // Asterisk handling — bold (**...**) is matched first via a negative-
    // lookahead inner pattern so a stray single * inside a bold pair doesn't
    // confuse the regex. Italic (*...*) then runs with a left-boundary guard
    // and a negative-lookahead right boundary so leftover ** can't be torn.
    // Stray asterisks in user-generated content render literally instead of
    // producing malformed HTML.
    html = html.replace(/\*\*((?:[^*]|\*(?!\*))+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
    var lines = html.split("\n");
    var result = [];
    var listType = null;
    function closeList() {
      if (listType) { result.push("</" + listType + ">"); listType = null; }
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var t = line.trim();
      if (!t) continue;
      var ol = line.match(/^\s*\d+\.\s+(.+)$/);
      var ul = line.match(/^\s*[-*]\s+(.+)$/);
      if (ol) {
        if (listType !== "ol") { closeList(); result.push("<ol>"); listType = "ol"; }
        result.push("<li>" + ol[1] + "</li>");
      } else if (ul) {
        if (listType !== "ul") { closeList(); result.push("<ul>"); listType = "ul"; }
        result.push("<li>" + ul[1] + "</li>");
      } else {
        closeList();
        if (t.indexOf("<h") === 0 || t.indexOf("</") === 0) {
          result.push(t);
        } else {
          result.push("<p>" + t + "</p>");
        }
      }
    }
    closeList();
    return result.join("\n");
  };

  // -------- Contact link wiring (mailto built at runtime) -----------
  function wireContactLinks() {
    var links = document.querySelectorAll("a.contact[data-u][data-d]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var u = a.getAttribute("data-u");
      var d = a.getAttribute("data-d");
      if (!u || !d) continue;
      a.setAttribute("href", "mailto:" + u + "@" + d);
      if (!a.textContent.trim()) a.textContent = u + "@" + d;
    }
  }

  // -------- Genre chip toggle (single-select group with aria-pressed) -----
  function wireGenreChips() {
    var chips = document.querySelectorAll(".genre-chip");
    if (!chips.length) return null;
    var state = { selected: "" };
    var anyDefault = false;
    for (var i = 0; i < chips.length; i++) {
      (function (chip) {
        if (chip.classList.contains("active") || chip.getAttribute("aria-pressed") === "true") {
          state.selected = chip.dataset.g || "";
          anyDefault = true;
        }
        chip.addEventListener("click", function (e) {
          e.preventDefault();
          for (var j = 0; j < chips.length; j++) {
            chips[j].classList.remove("active");
            chips[j].setAttribute("aria-pressed", "false");
          }
          chip.classList.add("active");
          chip.setAttribute("aria-pressed", "true");
          state.selected = chip.dataset.g || "";
        });
      })(chips[i]);
    }
    if (!anyDefault) {
      // Fall back to the data-g="" chip if present
      var fallback = document.querySelector('.genre-chip[data-g=""]');
      if (fallback) {
        fallback.classList.add("active");
        fallback.setAttribute("aria-pressed", "true");
      }
    }
    return state;
  }

  // -------- Character counter -------------------------------------------
  function wireCharCounter(field, counterEl) {
    if (!field || !counterEl) return;
    var update = function () { counterEl.textContent = field.value.length; };
    field.addEventListener("input", update);
    update();
  }

  // -------- Main: per-tool init -----------------------------------------
  // cfg fields:
  //   endpoint (string, required) — e.g. "/api/comp"
  //   toolSlug (string, required) — e.g. "comp"  (passed to feedback widget)
  //   primaryFieldId, primaryFieldName — main text input/textarea binding
  //   primaryMin, primaryMax, primaryShortMsg, primaryLongMsg — validation
  //   extraFields: [{id, name, required, errEmpty}] — optional additional inputs
  //   counterId — id of the char-count <span>, falsy to skip
  //   buttonId, outputId, outputBodyId
  //   buttonRestHTML, buttonLoadingHTML — button label states
  //   loadingMsg — paragraph shown during fetch
  //   remainingNoun, remainingPlural — for the "X free Y remaining today" chip
  //   onResult(outBody, data) — page-specific copy-button attachment
  Authorly.initTool = function (cfg) {
    wireContactLinks();
    var genre = wireGenreChips();
    var counter = cfg.counterId ? document.getElementById(cfg.counterId) : null;
    var primaryField = document.getElementById(cfg.primaryFieldId);
    if (counter) wireCharCounter(primaryField, counter);

    var btn = document.getElementById(cfg.buttonId);
    var out = document.getElementById(cfg.outputId);
    var outBody = document.getElementById(cfg.outputBodyId);
    if (!btn || !out || !outBody || !primaryField) return; // page missing pieces; bail quietly

    function showError(msg) {
      var div = document.createElement("div");
      div.className = "error";
      div.setAttribute("role", "alert");
      div.textContent = msg;
      outBody.replaceChildren ? outBody.replaceChildren(div) : (outBody.innerHTML = "", outBody.appendChild(div));
      out.classList.add("visible");
    }

    function buildBody() {
      var body = {};
      body[cfg.primaryFieldName] = primaryField.value.trim();
      var extras = cfg.extraFields || [];
      for (var i = 0; i < extras.length; i++) {
        var f = extras[i];
        var el = document.getElementById(f.id);
        if (el) body[f.name] = el.value.trim();
      }
      // Read genre from the chip currently marked aria-pressed=true. This
      // re-derives state every submission so applyToTool() (which sets
      // aria-pressed on a chip from the saved profile after wireGenreChips
      // has captured the closure) is honored without a custom event.
      if (genre) {
        var pressed = document.querySelector('.genre-chip[aria-pressed="true"]');
        body.genre = pressed ? (pressed.getAttribute("data-g") || "") : (genre.selected || "");
      }
      // Cultural anchor (comp finder + tropes finder) — optional select on page.
      var ca = document.getElementById("cultural_anchor");
      if (ca && ca.value) body.cultural_anchor = ca.value;
      // Pen-name-only flag (set by author-profile-ui on body when active).
      if (document.body.getAttribute("data-pen-name-only") === "true") {
        body.pen_name_only = true;
      }
      // Author voice hint (from saved profile, if any).
      try {
        if (window.Authorly && window.Authorly.Profile) {
          var prof = window.Authorly.Profile.get();
          if (prof && prof.author_voice) body.author_voice = prof.author_voice;
        }
      } catch (e) { /* fail open */ }
      return body;
    }

    function pluralRemaining(n) {
      var noun = cfg.remainingNoun || "search";
      var plural = cfg.remainingPlural || (noun + "es"); // e.g. "search" -> "searches" by default; some tools override
      return n === 1 ? "1 free " + noun + " remaining today." : n + " free " + plural + " remaining today.";
    }

    btn.addEventListener("click", async function () {
      // Validate required extras first (they fail more obviously than length)
      var extras = cfg.extraFields || [];
      for (var i = 0; i < extras.length; i++) {
        var f = extras[i];
        var el = document.getElementById(f.id);
        if (f.required && (!el || !el.value.trim())) {
          showError(f.errEmpty || "Please fill in all required fields.");
          return;
        }
      }
      // Validate primary length
      var primary = primaryField.value.trim();
      if (cfg.primaryMin && primary.length < cfg.primaryMin) {
        showError(cfg.primaryShortMsg || "That's too short.");
        return;
      }
      if (cfg.primaryMax && primary.length > cfg.primaryMax) {
        showError(cfg.primaryLongMsg || "That's too long.");
        return;
      }

      // Lock UI + show loading
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.innerHTML = cfg.buttonLoadingHTML || 'Loading <span class="btn-arrow">…</span>';
      var loadingMsg = cfg.loadingMsg || "Working";
      outBody.innerHTML = '<div class="loading">' + loadingMsg +
        '<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span></div>';
      out.classList.add("visible");
      out.setAttribute("aria-busy", "true");
      try { out.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}

      var res, data;
      try {
        res = await fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody())
        });
      } catch (e) {
        showError("Couldn't reach the server. Check your connection and try again.");
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.innerHTML = cfg.buttonRestHTML;
        out.setAttribute("aria-busy", "false");
        return;
      }
      try { data = await res.json(); } catch (e) { data = {}; }

      try {
        if (!res.ok) {
          showError(data.error || ("Request failed (" + res.status + ")."));
        } else if (!data.text) {
          showError("No response from server. Try again.");
        } else {
          outBody.innerHTML = Authorly.renderMarkdown(data.text);
          if (typeof cfg.onResult === "function") {
            try { cfg.onResult(outBody, data); } catch (e) {
              console && console.error && console.error("onResult error:", e);
            }
          }
          if (typeof window.attachFeedback === "function") {
            try { window.attachFeedback(cfg.toolSlug, outBody); } catch (e) {}
          }
          if (typeof data.remaining === "number") {
            var note = document.createElement("div");
            note.className = "remaining-note";
            note.textContent = data.remaining === 0
              ? "No free " + (cfg.remainingPlural || (cfg.remainingNoun || "search") + "es") + " remaining today. Limit resets at midnight UTC."
              : pluralRemaining(data.remaining);
            outBody.appendChild(note);
          }
        }
      } catch (err) {
        showError("Unexpected error rendering the response. Try again.");
      } finally {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.innerHTML = cfg.buttonRestHTML;
        out.setAttribute("aria-busy", "false");
      }
    });

    // Submit on Enter for single-line inputs (e.g. /keywords seed input)
    if (primaryField.tagName === "INPUT") {
      primaryField.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); btn.click(); }
      });
    }
  };

  // Smoothly scroll opened <details class="sample"> bodies into view
  function wireSampleScroll() {
    var elems = document.querySelectorAll("details.sample");
    for (var i = 0; i < elems.length; i++) {
      (function (d) {
        d.addEventListener("toggle", function () {
          if (d.open) {
            try { d.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
          }
        });
      })(elems[i]);
    }
  }

  // Auto-wire contact links + sample scroll on page load even if initTool isn't called
  // (so /privacy and /terms get them too).
  function autoWire() {
    wireContactLinks();
    wireSampleScroll();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoWire, { once: true });
  } else {
    autoWire();
  }
})();
