const fs = require('fs');

console.log('=== FEATURE VALIDATION TEST SUITE ===\n');

// Test 1: Validate _lib.js structure
console.log('TEST 1: _lib.js exports and enums');
const libCode = fs.readFileSync('./functions/api/_lib.js', 'utf8');

const checks = {
  'GENRE_ENUM defined': libCode.includes('const GENRE_ENUM'),
  'isNonFiction() function': libCode.includes('function isNonFiction'),
  'genreLabel() function': libCode.includes('function genreLabel'),
  'CULTURAL_ANCHOR_ENUM defined': libCode.includes('const CULTURAL_ANCHOR_ENUM'),
  'validateCulturalAnchor() function': libCode.includes('function validateCulturalAnchor'),
  'culturalAnchorLabel() function': libCode.includes('function culturalAnchorLabel'),
};

Object.entries(checks).forEach(([desc, result]) => {
  console.log(`  ${result ? '✓' : '✗'} ${desc}`);
});

// Count genres
const genreMatch = libCode.match(/const GENRE_ENUM = new Set\(\[([\s\S]*?)\]\);/);
if (genreMatch) {
  const genreString = genreMatch[1];
  const matches = genreString.match(/"([^"]+)"/g) || [];
  console.log(`\n  Genre values: ${matches.length} total`);
  
  const expectedGenres = [
    'romance_contemporary', 'fantasy_litrpg', 'nonfiction_memoir', 'nonfiction_business'
  ];
  
  const cleanGenres = matches.map(m => m.replace(/"/g, ''));
  expectedGenres.forEach(genre => {
    const found = cleanGenres.includes(genre);
    console.log(`    ${found ? '✓' : '✗'} ${genre}`);
  });
}

// Test 2: author-profile.js
console.log('\nTEST 2: author-profile.js');
const profileCode = fs.readFileSync('./src/lib/author-profile.js', 'utf8');
const hasProfile = profileCode.includes('authorly.profile.v1') && profileCode.includes('function get()');
console.log(`  ${hasProfile ? '✓' : '✗'} Profile module structure`);

// Test 3: author-profile-ui.js
console.log('\nTEST 3: author-profile-ui.js');
const uiCode = fs.readFileSync('./src/lib/author-profile-ui.js', 'utf8');
const hasUI = uiCode.includes('function mountStrip') && uiCode.includes('function applyToTool');
console.log(`  ${hasUI ? '✓' : '✗'} UI component structure`);

// Test 4: blurb.js branching
console.log('\nTEST 4: blurb.js');
const blurbCode = fs.readFileSync('./functions/api/blurb.js', 'utf8');
const hasBlurbBranching = blurbCode.includes('isNonFiction') && 
  blurbCode.includes('FICTION_SYSTEM_PROMPT') && 
  blurbCode.includes('NONFICTION_SYSTEM_PROMPT');
console.log(`  ${hasBlurbBranching ? '✓' : '✗'} Fiction/non-fiction branching`);

// Test 5: comp.js
console.log('\nTEST 5: comp.js');
const compCode = fs.readFileSync('./functions/api/comp.js', 'utf8');
const hasCompAnchor = compCode.includes('validateCulturalAnchor') && compCode.includes('culturalAnchorLabel');
console.log(`  ${hasCompAnchor ? '✓' : '✗'} Cultural anchor support`);

// Test 6: tropes.js
console.log('\nTEST 6: tropes.js');
const tropesCode = fs.readFileSync('./functions/api/tropes.js', 'utf8');
const hasTropesSupport = tropesCode.includes('validateCulturalAnchor') && tropesCode.includes('isNonFiction');
console.log(`  ${hasTropesSupport ? '✓' : '✗'} Cultural anchor + non-fiction`);

// Test 7: HTML pages
console.log('\nTEST 7: HTML pages');
const indexHtml = fs.readFileSync('./index.html', 'utf8');
const hasProfileStrip = indexHtml.includes('author-profile-strip');
const hasChips = (indexHtml.match(/genre-chip/g) || []).length >= 30;
const hasAnchor = indexHtml.includes('cultural_anchor');
console.log(`  ${hasProfileStrip ? '✓' : '✗'} Author profile strip mounted`);
console.log(`  ${hasChips ? '✓' : '✗'} ~30+ genre chips`);
console.log(`  ${hasAnchor ? '✓' : '✗'} Cultural anchor select`);

console.log('\n=== VALIDATION COMPLETE ===\n');
