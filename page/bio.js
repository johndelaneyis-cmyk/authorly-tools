// Bio tool init. Loaded via <script src="/page/bio.js" defer>.
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/bio",
      toolSlug: "bio",
      primaryFieldId: "author-facts",
      primaryFieldName: "facts",
      primaryMin: 30,
      primaryMax: 1500,
      primaryShortMsg: "Please share a few facts (30+ characters) about yourself.",
      primaryLongMsg: "Facts too long (max 1500 characters). A bio doesn't need a memoir.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Write bio <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Writing <span class="btn-arrow">…</span>',
      loadingMsg: "Drafting bios",
      remainingNoun: "bio set",
      remainingPlural: "bio sets",
      onResult: function (outBody) {
        // For each Short/Medium/Long bio h2, attach a Copy button to the heading.
        outBody.querySelectorAll("h2").forEach(function (h) {
          if (!/^(short|medium|long)\s+bio/i.test(h.textContent.trim())) return;
          var paragraphs = [];
          var n = h.nextElementSibling;
          while (n && n.tagName !== "H2") {
            if (n.tagName === "P") paragraphs.push(n.textContent);
            n = n.nextElementSibling;
          }
          if (!paragraphs.length) return;
          var text = paragraphs.join("\n\n").trim();
          var b = document.createElement("button");
          b.type = "button";
          b.className = "copy-btn";
          b.textContent = "Copy";
          b.onclick = function () {
            navigator.clipboard.writeText(text).then(function () {
              b.textContent = "Copied ✓";
              b.classList.add("copied");
              setTimeout(function () { b.textContent = "Copy"; b.classList.remove("copied"); }, 1800);
            }).catch(function () {
              b.textContent = "Copy failed — long-press to copy";
            });
          };
          h.appendChild(document.createTextNode(" "));
          h.appendChild(b);
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
