// Authorly tool feedback widget — used by every tool page.
// Exposes window.attachFeedback(toolSlug, container).
// Self-installs its own styles on first call, no CSS file needed.

// --- Scrape-proof contact link ----------------------------------------------
// Every page footer has <a class="contact" data-u="..." data-d="...">Contact</a>
// or similar. We assemble the mailto on load so the literal address is never
// in the served HTML. Wires on first paint AND on DOMContentLoaded to be
// resilient to script-vs-DOM timing edge cases.
(() => {
  const wire = () => {
    const links = document.querySelectorAll("a.contact[data-u][data-d]");
    links.forEach(a => {
      const u = a.getAttribute("data-u");
      const d = a.getAttribute("data-d");
      if (!u || !d) return;
      a.setAttribute("href", "mailto:" + u + "@" + d);
      if (!a.textContent.trim()) a.textContent = u + "@" + d;
    });
    return links.length;
  };
  // Try immediately (after-parse for defer scripts) AND on DOMContentLoaded —
  // covers both "script ran early" and "DOM mutated after script" cases.
  const tryWire = () => { try { wire(); } catch {} };
  tryWire();
  if (document.readyState !== "complete") {
    document.addEventListener("DOMContentLoaded", tryWire, { once: true });
    window.addEventListener("load", tryWire, { once: true });
  }
})();

// --- Feedback widget ---------------------------------------------------------
(() => {
  const css = `
.authorly-feedback{margin-top:32px;padding-top:18px;border-top:1px dashed var(--rule,#e0d5c0);font-size:14px;color:var(--ink-mute,#6b6760)}
.authorly-feedback-prompt{font-style:italic;display:inline-block;margin-right:12px}
.authorly-feedback-btn{padding:6px 14px;background:transparent;border:1px solid var(--rule,#e0d5c0);border-radius:3px;font-family:"Fraunces",serif;font-size:13px;cursor:pointer;color:var(--ink-mute,#6b6760);transition:all .2s;margin-right:8px;vertical-align:baseline}
.authorly-feedback-btn:hover{border-color:var(--accent,#a83232);color:var(--accent,#a83232)}
.authorly-feedback-btn.selected{background:var(--accent,#a83232);color:var(--paper,#faf6f0);border-color:var(--accent,#a83232)}
.authorly-feedback-comment{display:none;width:100%;margin-top:12px;padding:10px 12px;border:1px solid var(--rule,#e0d5c0);border-radius:3px;font-family:"Fraunces",serif;font-size:14px;background:var(--paper,#faf6f0);min-height:60px;resize:vertical;color:var(--ink,#1a1814);line-height:1.55}
.authorly-feedback-comment:focus{outline:none;border-color:var(--accent,#a83232);box-shadow:0 0 0 3px var(--accent-soft,rgba(168,50,50,.05))}
.authorly-feedback-comment.visible{display:block}
.authorly-feedback-submit{display:none;padding:6px 14px;background:var(--ink,#1a1814);color:var(--paper,#faf6f0);border:none;border-radius:3px;font-family:"Fraunces",serif;font-size:13px;cursor:pointer;margin-top:10px}
.authorly-feedback-submit:hover{background:var(--accent,#a83232)}
.authorly-feedback-submit:disabled{opacity:.5;cursor:not-allowed}
.authorly-feedback-submit.visible{display:inline-block}
.authorly-feedback-thanks{font-style:italic;color:#2a7a3a}
`.trim();

  let cssInstalled = false;
  function installCss() {
    if (cssInstalled) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    cssInstalled = true;
  }

  window.attachFeedback = function attachFeedback(toolSlug, container) {
    if (!container) return;
    installCss();

    const wrap = document.createElement("div");
    wrap.className = "authorly-feedback";

    const prompt = document.createElement("span");
    prompt.className = "authorly-feedback-prompt";
    prompt.textContent = "Was this useful?";
    wrap.appendChild(prompt);

    const btnUp = document.createElement("button");
    btnUp.type = "button";
    btnUp.className = "authorly-feedback-btn";
    btnUp.dataset.rating = "up";
    btnUp.textContent = "👍 Yes";

    const btnDown = document.createElement("button");
    btnDown.type = "button";
    btnDown.className = "authorly-feedback-btn";
    btnDown.dataset.rating = "down";
    btnDown.textContent = "👎 Not really";

    wrap.appendChild(btnUp);
    wrap.appendChild(btnDown);

    const comment = document.createElement("textarea");
    comment.className = "authorly-feedback-comment";
    comment.placeholder = "Anything we should fix? (optional)";
    comment.maxLength = 1000;
    wrap.appendChild(comment);

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "authorly-feedback-submit";
    submit.textContent = "Send feedback";
    wrap.appendChild(submit);

    container.appendChild(wrap);

    let chosen = null;
    [btnUp, btnDown].forEach(b => {
      b.addEventListener("click", () => {
        chosen = b.dataset.rating;
        btnUp.classList.toggle("selected", b === btnUp);
        btnDown.classList.toggle("selected", b === btnDown);
        comment.classList.add("visible");
        submit.classList.add("visible");
        if (chosen === "down") setTimeout(() => comment.focus(), 0);
      });
    });

    submit.addEventListener("click", async () => {
      if (!chosen) return;
      submit.disabled = true;
      const orig = submit.textContent;
      submit.textContent = "Sending…";
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: toolSlug, rating: chosen, comment: comment.value })
        });
        wrap.innerHTML = '<span class="authorly-feedback-thanks">Thanks — noted.</span>';
      } catch {
        submit.disabled = false;
        submit.textContent = orig;
      }
    });
  };
})();
