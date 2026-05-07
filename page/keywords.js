// Keywords tool init. Loaded via <script src="/page/keywords.js" defer>.
(function () {
  function init() {
    if (!window.Authorly || typeof window.Authorly.initTool !== "function") return;
    window.Authorly.initTool({
      endpoint: "/api/keywords",
      toolSlug: "keywords",
      primaryFieldId: "seed",
      primaryFieldName: "seed",
      primaryMin: 2,
      primaryMax: 80,
      primaryShortMsg: "Please enter a seed keyword (a word or short phrase).",
      primaryLongMsg: "Seed too long (max 80 characters). Try a 1–3 word phrase.",
      counterId: "cc",
      buttonId: "generate",
      outputId: "output",
      outputBodyId: "output-body",
      buttonRestHTML: 'Expand keywords <span class="btn-arrow">→</span>',
      buttonLoadingHTML: 'Expanding <span class="btn-arrow">…</span>',
      loadingMsg: "Finding keywords",
      remainingNoun: "expansion",
      remainingPlural: "expansions",
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
        // Copy-all-7 button under the Top 7 heading
        outBody.querySelectorAll("h2").forEach(function (h) {
          if (!/top 7/i.test(h.textContent)) return;
          var next = h.nextElementSibling;
          if (!next || next.tagName !== "UL") return;
          var phrases = Array.prototype.map.call(next.querySelectorAll("li > strong"), function (s) {
            return (s.firstChild ? s.firstChild.textContent : s.textContent).trim();
          }).filter(Boolean);
          if (phrases.length < 2) return;
          var all = document.createElement("button");
          all.type = "button";
          all.className = "copy-all-btn";
          all.textContent = "Copy all 7 →";
          all.onclick = function () {
            navigator.clipboard.writeText(phrases.join("\n")).then(function () {
              all.textContent = "Copied 7 ✓";
              all.classList.add("copied");
              setTimeout(function () { all.textContent = "Copy all 7 →"; all.classList.remove("copied"); }, 1800);
            }).catch(function () {
              all.textContent = "Copy failed — long-press to copy";
            });
          };
          h.insertAdjacentElement("afterend", all);
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
