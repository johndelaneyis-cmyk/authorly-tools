// Ads tool init — uses shared Authorly.initTool runtime with extraFields.
// Migrated from inline duplicated logic on 2026-05-08 (audit-flagged drift).
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/ads",
      toolSlug: "ads",
      primaryFieldId: "book-desc",
      primaryFieldName: "description",
      primaryMin: 30,
      primaryMax: 2000,
      primaryShortMsg: "Please paste at least a paragraph (30+ characters) describing your book.",
      primaryLongMsg: "Description too long (max 2000 characters). Trim it to the essentials.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Write headlines <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Writing <span class="btn-arrow">…</span>',
      loadingMsg: "Drafting headlines",
      remainingNoun: "headline set",
      remainingPlural: "headline sets",
      extraFields: [
        { id: "title", name: "title", required: true, errEmpty: "Please enter your book title." },
        { id: "comps", name: "comps" }
      ],
      onResult: function (outBody) {
        // Each numbered headline has a quoted fragment; attach Copy button.
        outBody.querySelectorAll("ol li").forEach(function (li) {
          var m = li.textContent.match(/"([^"]+)"/);
          if (!m) return;
          var headline = m[1];
          var b = document.createElement("button");
          b.type = "button";
          b.className = "copy-btn";
          b.textContent = "Copy";
          b.onclick = function () {
            navigator.clipboard.writeText(headline).then(function () {
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
