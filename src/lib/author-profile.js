// src/lib/author-profile.js
// Authorly profile module — owns the versioned Authorly.Profile.* namespace.
//
// Storage:   localStorage key 'authorly.profile.v1'
// Failure:   localStorage failures fail open (return null, site continues).
// Privacy:   never sent to any server. All data is browser-local.
// Mirrors:   slatework/src/lib/profile.js shape (single-author, no signup).
//
// Public API:
//   Authorly.Profile.get()                   -> object | null
//   Authorly.Profile.set(partial)            -> merge + persist, returns merged or null
//   Authorly.Profile.clear()                 -> remove from storage, returns boolean
//   Authorly.Profile.recordBookContext({title, blurb_hint})
//                                            -> append to recent_books, dedupe by title, last 3
//   Authorly.Profile.has()                   -> boolean
//
// Schema (v1):
//   {
//     version: 1,
//     genre: 'romance_contemporary' | '' | ...,    // mirrors GENRE_ENUM in functions/api/_lib.js
//     pen_name_only: boolean,                       // when true, blurb/bio prompts avoid legal-name patterns
//     author_voice: string,                         // free-form short tag, e.g. "warm and direct"
//     recent_books: [{title, blurb_hint}],          // last 3, dedupe by lowercase title
//     default_market: 'us'|'uk'|'ca'|'au'|'',       // hint for future geo-aware tools
//     set_at: ISO8601
//   }

(function () {
  var A = window.Authorly = window.Authorly || {};
  if (A.Profile) return; // idempotent: tolerate double-load (multiple page scripts include the lib)

  var STORAGE_KEY = 'authorly.profile.v1';
  var SCHEMA_VERSION = 1;

  // Mirror of the genre values accepted by functions/api/_lib.js GENRE_ENUM.
  // We don't reject unknown values here (server-side validateGenre is the
  // defense-in-depth gate); this list is for the editor dropdown only.
  var GENRE_VALUES = [
    '',
    'romance_contemporary', 'romance_historical', 'romance_paranormal',
    'romance_romantasy', 'romance_dark', 'romance_smalltown',
    'romance_suspense', 'romance_clean',
    'fantasy_urban', 'fantasy_litrpg', 'fantasy_romantasy', 'fantasy_epic',
    'scifi_hard', 'scifi_military', 'scifi_dystopian_ya',
    'mystery_cozy', 'mystery_hardboiled',
    'thriller_psychological', 'thriller_military', 'thriller_legal',
    'literary', 'literary_womens',
    'ya_contemporary', 'ya_fantasy', 'ya_dystopian',
    'middle_grade', 'picture_book',
    'nonfiction_memoir', 'nonfiction_business',
    'nonfiction_selfhelp', 'nonfiction_cookbook'
  ];

  var MARKET_VALUES = ['', 'us', 'uk', 'ca', 'au'];

  function clampStr(v, fallback, max) {
    if (typeof v !== 'string') return fallback || '';
    return v.trim().slice(0, max || 200);
  }

  function emptyShape() {
    return {
      version: SCHEMA_VERSION,
      genre: '',
      pen_name_only: false,
      author_voice: '',
      recent_books: [],
      default_market: '',
      set_at: null
    };
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.version !== SCHEMA_VERSION) return null; // future-proof migration anchor
      return {
        version: SCHEMA_VERSION,
        genre: typeof parsed.genre === 'string' ? parsed.genre : '',
        pen_name_only: parsed.pen_name_only === true,
        author_voice: clampStr(parsed.author_voice, '', 120),
        recent_books: Array.isArray(parsed.recent_books)
          ? parsed.recent_books.slice(0, 3).filter(function (b) {
              return b && typeof b === 'object' && typeof b.title === 'string';
            })
          : [],
        default_market: typeof parsed.default_market === 'string' ? parsed.default_market : '',
        set_at: typeof parsed.set_at === 'string' ? parsed.set_at : null
      };
    } catch (e) {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function get() {
    return read();
  }

  function set(partial) {
    if (!partial || typeof partial !== 'object') return null;
    var current = read() || emptyShape();
    var next = {
      version: SCHEMA_VERSION,
      genre: typeof partial.genre === 'string' ? partial.genre : current.genre,
      pen_name_only: typeof partial.pen_name_only === 'boolean' ? partial.pen_name_only : current.pen_name_only,
      author_voice: typeof partial.author_voice === 'string'
        ? clampStr(partial.author_voice, current.author_voice, 120)
        : current.author_voice,
      recent_books: Array.isArray(partial.recent_books)
        ? partial.recent_books.slice(0, 3)
        : current.recent_books,
      default_market: typeof partial.default_market === 'string' ? partial.default_market : current.default_market,
      set_at: new Date().toISOString()
    };
    return write(next) ? next : null;
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function recordBookContext(book) {
    if (!book || typeof book !== 'object') return null;
    var title = clampStr(book.title, '', 160);
    if (!title) return null;
    var hint = clampStr(book.blurb_hint, '', 240);
    var current = read() || emptyShape();
    var existing = (current.recent_books || []).filter(function (b) {
      return b.title.trim().toLowerCase() !== title.trim().toLowerCase();
    });
    var next = [{ title: title, blurb_hint: hint }].concat(existing).slice(0, 3);
    return set({ recent_books: next });
  }

  function has() {
    var p = read();
    return !!(p && (p.genre || p.author_voice || p.pen_name_only || (p.recent_books && p.recent_books.length)));
  }

  A.Profile = Object.freeze({
    get: get,
    set: set,
    clear: clear,
    recordBookContext: recordBookContext,
    has: has,
    GENRE_VALUES: Object.freeze(GENRE_VALUES.slice()),
    MARKET_VALUES: Object.freeze(MARKET_VALUES.slice()),
    SCHEMA_VERSION: SCHEMA_VERSION
  });
})();
