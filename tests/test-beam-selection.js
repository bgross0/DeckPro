// Test beam selection for 16' span with 8' joists
console.log('Testing beam selection for 16\' beam span with 8\' joist span...\n');

// Simulate the beam selection logic
const beamSpan = 16;
const joistSpan = 8;
const species = 'SPF #2';

// SPF #2 beam spans for 8' joist span
const beamSpans = {
  '(1)2x8': 6.0,    // 6'0"
  '(2)2x8': 7.9,    // 7'9"  
  '(3)2x8': 9.0,    // 9'0"
  '(1)2x10': 7.7,   // 7'7"
  '(2)2x10': 10.0,  // 10'0"
  '(3)2x10': 11.9,  // 11'9"
  '(1)2x12': 9.2,   // 9'2"
  '(2)2x12': 12.2,  // 12'2"
  '(3)2x12': 14.5   // 14'5"
};

console.log('Beam options for SPF #2 with 8\' joist span:');
console.log('==========================================');

const beamSizes = ['(2)2x8', '(3)2x8', '(2)2x10', '(3)2x10', 
                   '(2)2x12', '(3)2x12', '(1)2x10', '(1)2x12', '(1)2x8'];

for (const size of beamSizes) {
  const allowableSpan = beamSpans[size];
  const minPostsNeeded = Math.ceil(beamSpan / allowableSpan) + 1;
  const actualPostSpacing = beamSpan / (minPostsNeeded - 1);
  const isValid = actualPostSpacing <= allowableSpan;
  
  console.log(`\n${size}:`);
  console.log(`  Allowable span: ${allowableSpan}'`);
  console.log(`  Posts needed: ${minPostsNeeded}`);
  console.log(`  Actual post spacing: ${actualPostSpacing.toFixed(1)}'`);
  console.log(`  Valid: ${isValid ? 'YES' : 'NO'}`);
  
  if (!isValid) {
    console.log(`  -> FAILS: ${actualPostSpacing.toFixed(1)}' spacing exceeds ${allowableSpan}' allowable`);
  }
}

console.log('\n\nCONCLUSION:');
console.log('===========');
console.log('Valid beam options for 16\' span with 8\' joists:');
const validOptions = [];
for (const size of beamSizes) {
  const allowableSpan = beamSpans[size];
  const minPostsNeeded = Math.ceil(beamSpan / allowableSpan) + 1;
  const actualPostSpacing = beamSpan / (minPostsNeeded - 1);
  if (actualPostSpacing <= allowableSpan) {
    validOptions.push(`${size} with ${minPostsNeeded} posts @ ${actualPostSpacing.toFixed(1)}' spacing`);
  }
}

if (validOptions.length === 0) {
  console.log('NO VALID BEAM OPTIONS! This deck configuration cannot be built to code.');
} else {
  validOptions.forEach(opt => console.log(`  - ${opt}`));
}