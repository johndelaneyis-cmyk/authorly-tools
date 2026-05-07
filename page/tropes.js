// Tropes tool init. Loaded via <script src="/page/tropes.js" defer>.
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/tropes",
      toolSlug: "tropes",
      primaryFieldId: "book-desc",
      primaryFieldName: "description",
      primaryMin: 30,
      primaryMax: 2000,
      primaryShortMsg: "Please paste at least a paragraph (30+ characters) describing your plot — characters, conflict, tone.",
      primaryLongMsg: "Description too long (max 2000 characters). Trim it to the essentials.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Find tropes <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Reading <span class="btn-arrow">…</span>',
      loadingMsg: "Finding tropes",
      remainingNoun: "search",
      remainingPlural: "searches",
      onResult: function (outBody) {
        outBody.querySelectorAll("li").forEach(function (li) {
          var strong = li.querySelector("strong");
          if (!strong) return;
          var phrase = strong.textContent.trim();
          if (!phrase) return;
          var b = document.createElement("button");
          b.type = "button";
          b.className = "copy-btn";
          b.textContent = "Copy";
          b.onclick = function () {
            navigator.clipboard.writeText(phrase).then(function () {
              b.textContent = "Copied ✓";
              b.classList.add("copied");
              setTimeout(function () { b.textContent = "Copy"; b.classList.remove("copied"); }, 1800);
            }).catch(function () {
              b.textContent = "Copy failed — long-press to copy";
            });
          };
          strong.appendChild(document.createTextNode(" "));
          strong.appendChild(b);
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
