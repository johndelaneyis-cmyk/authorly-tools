// Homepage init: comp finder + Pro waitlist.
// Loaded via <script src="/page/index.js" defer>.
(function () {
  function init() {
    // -------- Comp finder via shared Authorly.initTool runtime ----------
    if (window.Authorly && typeof window.Authorly.initTool === "function") {
      window.Authorly.initTool({
        endpoint: "/api/comp",
        toolSlug: "comp",
        primaryFieldId: "book-desc",
        primaryFieldName: "description",
        primaryMin: 30,
        primaryMax: 2000,
        primaryShortMsg: "Please paste at least a paragraph (30+ characters) describing your book — characters, conflict, setting, tone.",
        primaryLongMsg: "Description too long (max 2000 characters). Trim it to the essentials.",
        counterId: "cc",
        buttonId: "generate",
        outputId: "output",
        outputBodyId: "output-body",
        buttonRestHTML: 'Find comp titles <span class="btn-arrow">→</span>',
        buttonLoadingHTML: 'Reading <span class="btn-arrow">…</span>',
        loadingMsg: "Finding comp titles",
        remainingNoun: "search",
        remainingPlural: "searches",
        onResult: function (outBody) {
          // The "Use these in" section contains bullets with quoted paste-able fragments.
          // Add a Copy button next to each quoted fragment.
          outBody.querySelectorAll("ul li").forEach(function (li) {
            var m = li.textContent.match(/"([^"]+)"/);
            if (!m) return;
            var fragment = m[1];
            var b = document.createElement("button");
            b.type = "button";
            b.className = "copy-btn";
            b.textContent = "Copy";
            b.onclick = function () {
              navigator.clipboard.writeText(fragment).then(function () {
                b.textContent = "Copied ✓";
                b.classList.add("copied");
                setTimeout(function () { b.textContent = "Copy"; b.classList.remove("copied"); }, 1800);
              }).catch(function () {
                b.textContent = "Copy failed — long-press to copy";
              });
            };
            li.appendChild(document.createTextNode(" "));
            li.appendChild(b);
          });
        }
      });
    }

    // -------- SearchAction prefill via ?q= ---------------------------
    try {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q) {
        var ta = document.getElementById("book-desc");
        if (ta && !ta.value) {
          ta.value = q;
          var cc = document.getElementById("cc");
          if (cc) cc.textContent = String(q.length);
          ta.focus();
        }
      }
    } catch (e) {}

    // -------- Pro-tier waitlist (homepage-only) -----------------------
    var form = document.getElementById("waitlist-form");
    if (!form) return;
    var emailInput = document.getElementById("waitlist-email");
    var submitBtn = document.getElementById("waitlist-submit");
    var status = document.getElementById("waitlist-status");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = (emailInput.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.className = "waitlist-status error";
        status.textContent = "Email needs an @ and a domain (like you@example.com).";
        emailInput.focus();
        return;
      }
      submitBtn.disabled = true;
      var origLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Saving <span class="btn-arrow">…</span>';
      status.className = "waitlist-status";
      status.textContent = "";

      try {
        var r = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, source: "homepage" })
        });
        var data;
        try { data = await r.json(); } catch (err) { data = {}; }
        if (!r.ok) {
          status.className = "waitlist-status error";
          status.textContent = data.error || ("Couldn't save your email (" + r.status + "). Try again in a bit.");
        } else {
          status.className = "waitlist-status success";
          status.textContent = data.alreadyOnList
            ? "You're already on the list — we'll email when Pro is ready."
            : "You're on the list. We'll email when Pro is ready.";
          emailInput.value = "";
        }
      } catch (err) {
        status.className = "waitlist-status error";
        status.textContent = "Couldn't reach the server. Check your connection and try again.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origLabel;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
