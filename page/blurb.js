// Blurb tool init. Loaded via <script src="/page/blurb.js" defer>.
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/blurb",
      toolSlug: "blurb",
      primaryFieldId: "plot",
      primaryFieldName: "description",
      primaryMin: 50,
      primaryMax: 2000,
      primaryShortMsg: "Please paste at least a couple of sentences (50+ characters) about your plot — characters, situation, tone.",
      primaryLongMsg: "Plot details too long (max 2000 characters). Trim it to a punchy paragraph or two.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Write the blurb <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Writing <span class="btn-arrow">…</span>',
      loadingMsg: "Drafting your blurb",
      remainingNoun: "blurb",
      remainingPlural: "blurbs",
      onResult: function (outBody) {
        // Find the "Ready to paste" h2 and add a Copy button covering all <p> until next h2
        outBody.querySelectorAll("h2").forEach(function (h) {
          if (!/ready to paste/i.test(h.textContent)) return;
          var paragraphs = [];
          var last = null;
          var n = h.nextElementSibling;
          while (n && n.tagName !== "H2") {
            if (n.tagName === "P") { paragraphs.push(n.textContent); last = n; }
            n = n.nextElementSibling;
          }
          if (!paragraphs.length) return;
          var body = paragraphs.join("\n\n").trim().replace(/^["“”'`]+\s*/, "").replace(/\s*["“”'`]+$/, "");
          var b = document.createElement("button");
          b.type = "button";
          b.className = "copy-btn";
          b.textContent = "Copy blurb";
          b.onclick = function () {
            navigator.clipboard.writeText(body).then(function () {
              b.textContent = "Copied ✓";
              b.classList.add("copied");
              setTimeout(function () { b.textContent = "Copy blurb"; b.classList.remove("copied"); }, 1800);
            }).catch(function () {
              b.textContent = "Copy failed — long-press to copy";
            });
          };
          if (last) {
            last.appendChild(document.createTextNode(" "));
            last.appendChild(b);
          }
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
