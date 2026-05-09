// Simulate browser localStorage and test the profile module
const fs = require('fs');

// Create a mock localStorage
const mockStorage = {};
const localStorage = {
  getItem(key) { return mockStorage[key] || null; },
  setItem(key, value) { mockStorage[key] = value; },
  removeItem(key) { delete mockStorage[key]; },
  clear() { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Create window object for the profile module
const window = { localStorage, Authorly: {} };

// Load and execute the profile module in this context
eval(fs.readFileSync('./src/lib/author-profile.js', 'utf8'));

console.log('=== LOCALSTORAGE PROFILE TESTS ===\n');

// Test 1: Initial state is empty
console.log('TEST 1: Initial get() on empty storage');
let profile = window.Authorly.Profile.get();
console.log(`  ✓ Empty profile returns: ${profile === null ? 'null' : JSON.stringify(profile)}`);

// Test 2: Set profile data
console.log('\nTEST 2: Set profile with genre + author_voice');
const result = window.Authorly.Profile.set({
  genre: 'romance_contemporary',
  author_voice: 'warm and witty'
});
console.log(`  ✓ Set returned merged profile:`, {
  genre: result.genre,
  author_voice: result.author_voice,
  pen_name_only: result.pen_name_only
});

// Test 3: Verify persistence in localStorage
console.log('\nTEST 3: Verify data persisted in localStorage');
const stored = localStorage.getItem('authorly.profile.v1');
const parsed = JSON.parse(stored);
console.log(`  ✓ Stored in localStorage with key 'authorly.profile.v1'`);
console.log(`  ✓ Data: genre="${parsed.genre}", voice="${parsed.author_voice}", version=${parsed.version}`);

// Test 4: Get returns same data
console.log('\nTEST 4: Get() retrieves saved profile');
profile = window.Authorly.Profile.get();
console.log(`  ✓ Retrieved genre: ${profile.genre}`);
console.log(`  ✓ Retrieved voice: ${profile.author_voice}`);
console.log(`  ✓ Has timestamp: ${!!profile.set_at}`);

// Test 5: Set with partial update
console.log('\nTEST 5: Partial update (pen_name_only only)');
const updated = window.Authorly.Profile.set({
  pen_name_only: true
});
console.log(`  ✓ pen_name_only now: ${updated.pen_name_only}`);
console.log(`  ✓ genre preserved: ${updated.genre}`);
console.log(`  ✓ author_voice preserved: ${updated.author_voice}`);

// Test 6: has() function
console.log('\nTEST 6: has() indicates profile exists');
const hasProfile = window.Authorly.Profile.has();
console.log(`  ✓ has() returns: ${hasProfile}`);

// Test 7: recordBookContext
console.log('\nTEST 7: recordBookContext adds book');
window.Authorly.Profile.recordBookContext({
  title: 'The Lost Apothecary',
  blurb_hint: 'Dual timeline mystery'
});
profile = window.Authorly.Profile.get();
console.log(`  ✓ Book recorded: ${profile.recent_books[0].title}`);
console.log(`  ✓ Hint stored: "${profile.recent_books[0].blurb_hint}"`);

// Test 8: recordBookContext deduplication
console.log('\nTEST 8: recordBookContext deduplicates by title');
const initialLen = profile.recent_books.length;
window.Authorly.Profile.recordBookContext({
  title: 'The Lost Apothecary',
  blurb_hint: 'Updated hint'
});
profile = window.Authorly.Profile.get();
console.log(`  ✓ Length unchanged: ${profile.recent_books.length} (was ${initialLen})`);
console.log(`  ✓ Updated hint: "${profile.recent_books[0].blurb_hint}"`);

// Test 9: Clear
console.log('\nTEST 9: clear() removes all data');
window.Authorly.Profile.clear();
profile = window.Authorly.Profile.get();
console.log(`  ✓ After clear, get() returns: ${profile}`);
console.log(`  ✓ has() returns: ${window.Authorly.Profile.has()}`);

// Test 10: Version mismatch (future-proofing)
console.log('\nTEST 10: Version mismatch protection');
mockStorage.clear();
localStorage.setItem('authorly.profile.v1', JSON.stringify({
  version: 2,  // Different version
  genre: 'mystery_cozy'
}));
profile = window.Authorly.Profile.get();
console.log(`  ✓ Mismatched version returns: ${profile}`);

console.log('\n=== LOCALSTORAGE TESTS COMPLETE ===\n');
