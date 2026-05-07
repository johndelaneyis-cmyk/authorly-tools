// Categories tool init. Loaded via <script src="/page/categories.js" defer>.
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/categories",
      toolSlug: "categories",
      primaryFieldId: "book-desc",
      primaryFieldName: "description",
      primaryMin: 30,
      primaryMax: 2000,
      primaryShortMsg: "Please paste at least a paragraph (30+ characters) describing your book — what it is, who it's for, what it's like.",
      primaryLongMsg: "Description too long (max 2000 characters). Trim it to the essentials.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Recommend categories <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Picking <span class="btn-arrow">…</span>',
      loadingMsg: "Picking categories",
      remainingNoun: "lookup",
      remainingPlural: "lookups",
      onResult: function (outBody) {
        outBody.querySelectorAll("li").forEach(function (li) {
          var strong = li.querySelector("strong");
          if (!strong || !/^path:/i.test(strong.textContent.trim())) return;
          var fullText = li.textContent.replace(/^\s*Path:\s*/i, "").trim();
          if (!fullText) return;
          var b = document.createElement("button");
          b.type = "button";
          b.className = "copy-btn";
          b.textContent = "Copy path";
          b.onclick = function () {
            navigator.clipboard.writeText(fullText).then(function () {
              b.textContent = "Copied ✓";
              b.classList.add("copied");
              setTimeout(function () { b.textContent = "Copy path"; b.classList.remove("copied"); }, 1800);
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
