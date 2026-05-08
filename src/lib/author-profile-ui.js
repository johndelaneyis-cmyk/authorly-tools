// src/lib/author-profile-ui.js
// Mounts the author-profile strip + inline edit panel on tool pages.
//
// Exposes:
//   Authorly.ProfileUI.mountStrip(container)   — Render strip into container element
//   Authorly.ProfileUI.applyToTool(getters)    — Pre-fill chip + textarea hints from saved profile
//
// Strict CSP friendly: never sets innerHTML on user data; uses textContent / DOM ops.
// Trusted Types policy already installed by tool.js so any document.createElement is safe.

(function () {
  var A = window.Authorly = window.Authorly || {};
  if (!A.Profile) {
    // Profile module didn't load — render nothing, fail silent.
    return;
  }
  if (A.ProfileUI) return; // idempotent

  // Human labels for genre values — mirrors functions/api/_lib.js genreLabel().
  var GENRE_LABEL = {
    '': 'Any',
    'romance_contemporary': 'Contemporary romance',
    'romance_historical': 'Historical romance',
    'romance_paranormal': 'Paranormal romance',
    'romance_romantasy': 'Romantasy (romance)',
    'romance_dark': 'Dark / mafia romance',
    'romance_smalltown': 'Small-town / cowboy romance',
    'romance_suspense': 'Romantic suspense',
    'romance_clean': 'Christian / clean romance',
    'fantasy_urban': 'Urban fantasy',
    'fantasy_litrpg': 'LitRPG / GameLit',
    'fantasy_romantasy': 'Romantasy (fantasy)',
    'fantasy_epic': 'Epic / high fantasy',
    'scifi_hard': 'Hard sci-fi',
    'scifi_military': 'Military sci-fi',
    'scifi_dystopian_ya': 'Dystopian / YA-adjacent',
    'mystery_cozy': 'Cozy mystery',
    'mystery_hardboiled': 'Hardboiled / crime',
    'thriller_psychological': 'Psychological thriller',
    'thriller_military': 'Military thriller',
    'thriller_legal': 'Legal thriller',
    'literary': 'Literary',
    'literary_womens': "Women's fiction",
    'ya_contemporary': 'YA contemporary',
    'ya_fantasy': 'YA fantasy',
    'ya_dystopian': 'YA dystopian',
    'middle_grade': 'Middle grade',
    'picture_book': 'Picture book',
    'nonfiction_memoir': 'Memoir',
    'nonfiction_business': 'Business / how-to',
    'nonfiction_selfhelp': 'Self-help / productivity',
    'nonfiction_cookbook': 'Cookbook / hobby'
  };

  function genreLabel(v) {
    return GENRE_LABEL[v] || v || '';
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
    }
    if (text != null) n.textContent = text;
    return n;
  }

  function buildOption(value, label, selected) {
    var o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    if (selected) o.selected = true;
    return o;
  }

  function buildEditPanel(container, onChange) {
    var panel = el('div', { class: 'author-profile-panel', role: 'group', 'aria-label': 'Author profile editor' });
    var current = A.Profile.get() || {};

    // Genre dropdown
    var genreField = el('div', { class: 'ap-field' });
    genreField.appendChild(el('label', { for: 'ap-genre' }, 'Default genre'));
    var genreSel = el('select', { id: 'ap-genre' });
    genreSel.appendChild(buildOption('', 'No default', !current.genre));
    A.Profile.GENRE_VALUES.forEach(function (v) {
      if (!v) return; // skip empty (already added)
      genreSel.appendChild(buildOption(v, genreLabel(v), v === current.genre));
    });
    genreField.appendChild(genreSel);
    panel.appendChild(genreField);

    // Author voice
    var voiceField = el('div', { class: 'ap-field' });
    voiceField.appendChild(el('label', { for: 'ap-voice' }, 'Author voice (optional)'));
    var voiceInput = el('input', { id: 'ap-voice', type: 'text', placeholder: 'e.g. warm and direct, literary and reserved, snarky', maxlength: '120' });
    voiceInput.value = current.author_voice || '';
    voiceField.appendChild(voiceInput);
    panel.appendChild(voiceField);

    // Pen-name strict mode toggle
    var penField = el('div', { class: 'ap-field' });
    var penLabel = el('label', { class: 'ap-checkbox', for: 'ap-pen' });
    var penInput = el('input', { id: 'ap-pen', type: 'checkbox' });
    if (current.pen_name_only) penInput.checked = true;
    penLabel.appendChild(penInput);
    penLabel.appendChild(document.createTextNode(' Pen name only (avoid legal-name patterns in bios / blurbs)'));
    penField.appendChild(penLabel);
    panel.appendChild(penField);

    // Default market
    var marketField = el('div', { class: 'ap-field' });
    marketField.appendChild(el('label', { for: 'ap-market' }, 'Default market (for future geo-aware tools)'));
    var marketSel = el('select', { id: 'ap-market' });
    marketSel.appendChild(buildOption('', 'No default', !current.default_market));
    [['us', 'United States (amazon.com)'], ['uk', 'United Kingdom (amazon.co.uk)'], ['ca', 'Canada (amazon.ca)'], ['au', 'Australia (amazon.com.au)']].forEach(function (pair) {
      marketSel.appendChild(buildOption(pair[0], pair[1], pair[0] === current.default_market));
    });
    marketField.appendChild(marketSel);
    panel.appendChild(marketField);

    // Actions
    var actions = el('div', { class: 'ap-actions' });
    var save = el('button', { type: 'button', class: 'ap-btn' }, 'Save profile');
    var clear = el('button', { type: 'button', class: 'ap-btn ap-btn-danger' }, 'Clear profile');
    actions.appendChild(save);
    actions.appendChild(clear);
    panel.appendChild(actions);

    var privacy = el('p', { class: 'ap-privacy' }, 'Your profile lives only in your browser. Authorly’s servers never see it. Clearing it removes everything immediately.');
    panel.appendChild(privacy);

    save.addEventListener('click', function () {
      A.Profile.set({
        genre: genreSel.value,
        author_voice: voiceInput.value,
        pen_name_only: penInput.checked,
        default_market: marketSel.value
      });
      if (typeof onChange === 'function') onChange();
    });

    clear.addEventListener('click', function () {
      A.Profile.clear();
      if (typeof onChange === 'function') onChange();
    });

    container.appendChild(panel);
  }

  function mountStrip(container) {
    if (!container) return null;

    function render() {
      // Wipe + redraw
      while (container.firstChild) container.removeChild(container.firstChild);

      var details = el('details', { class: 'author-profile-strip' });
      var summary = el('summary');
      var current = A.Profile.get();

      if (current && (current.genre || current.author_voice || current.pen_name_only)) {
        var parts = [];
        if (current.genre) parts.push(genreLabel(current.genre));
        if (current.author_voice) parts.push(current.author_voice);
        if (current.pen_name_only) parts.push('pen name only');
        summary.appendChild(el('span', { class: 'ap-summary-prefix' }, 'Profile:'));
        summary.appendChild(document.createTextNode(' '));
        summary.appendChild(el('span', { class: 'ap-saved-pill' }, parts.join(' · ')));
        summary.appendChild(document.createTextNode(' · edit'));
      } else {
        summary.appendChild(el('span', { class: 'ap-summary-prefix' }, 'Optional:'));
        summary.appendChild(document.createTextNode(' save your genre + voice so you don’t re-enter them every tool'));
      }

      details.appendChild(summary);
      buildEditPanel(details, function () {
        render();
        // After save/clear, re-apply to current page form fields.
        applyToTool();
      });
      container.appendChild(details);
    }

    render();
    return { refresh: render };
  }

  // Reads saved profile and applies sensible pre-fills to the current page.
  // Looks for: a chip group (#genre-row), a body class (page-bio etc.), and
  // optionally an author-facts textarea (bio tool) or other voice-aware fields.
  function applyToTool() {
    var profile = A.Profile.get();
    if (!profile) return;

    // 1. Pre-select the matching genre chip if profile.genre exists and a chip
    //    with that data-g is present on the page.
    if (profile.genre) {
      var chips = document.querySelectorAll('.genre-chip');
      var match = null;
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute('data-g') === profile.genre) {
          match = chips[i];
          break;
        }
      }
      if (match) {
        // Clear all aria-pressed first
        for (var j = 0; j < chips.length; j++) {
          chips[j].classList.remove('active');
          chips[j].setAttribute('aria-pressed', 'false');
        }
        match.classList.add('active');
        match.setAttribute('aria-pressed', 'true');
        // Open the parent <details class="genre-cluster"> if present so the chip is visible.
        var cluster = match.closest('details.genre-cluster');
        if (cluster) cluster.open = true;
      }
    }

    // 2. On bio.html only, if author-voice is set and the textarea is empty,
    //    we DO NOT inject voice into the user's facts (privacy-respecting).
    //    The genre chip + pen_name_only are forwarded to the API request body
    //    by tool.js's buildBody() if a chip is selected — so the prompt
    //    receives them. No textarea mutation needed.
    //
    //    For pen_name_only: stamp data-pen-name-only on the body so tool.js
    //    can include it in the API request. (See tool.js for the read.)
    if (profile.pen_name_only) {
      document.body.setAttribute('data-pen-name-only', 'true');
    } else {
      document.body.removeAttribute('data-pen-name-only');
    }
  }

  A.ProfileUI = Object.freeze({
    mountStrip: mountStrip,
    applyToTool: applyToTool
  });

  // Auto-mount: if the page has a #author-profile-strip container, mount + apply
  // immediately. This keeps each tool page's HTML simple — drop the empty div in.
  function autoMount() {
    var strip = document.getElementById('author-profile-strip');
    if (strip) mountStrip(strip);
    applyToTool();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  } else {
    autoMount();
  }
})();
