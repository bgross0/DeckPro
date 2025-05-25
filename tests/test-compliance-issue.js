// Test compliance issue
console.log('Testing compliance issue...');

// Test cases that might fail compliance
const testCases = [
  {
    name: 'Small deck with surface footings',
    payload: {
      width_ft: 10,
      length_ft: 12,
      height_ft: 3,
      attachment: 'ledger',
      footing_type: 'surface',
      species_grade: 'SPF #2',
      decking_type: 'composite_1in'
    }
  },
  {
    name: 'Large deck with wide joist spacing',
    payload: {
      width_ft: 16,
      length_ft: 20,
      height_ft: 2,
      attachment: 'ledger',
      footing_type: 'helical',
      species_grade: 'SPF #2',
      decking_type: 'composite_1in',
      forced_joist_spacing_in: 24
    }
  },
  {
    name: 'Deck with cantilever',
    payload: {
      width_ft: 14,
      length_ft: 16,
      height_ft: 2,
      attachment: 'ledger',
      beam_style_outer: 'drop',
      footing_type: 'helical',
      species_grade: 'SPF #2',
      decking_type: 'composite_1in'
    }
  }
];

// Run tests
testCases.forEach(test => {
  console.log(`\nTesting: ${test.name}`);
  console.log('Payload:', test.payload);
  
  try {
    const result = computeStructure(test.payload);
    console.log('Compliance:', result.compliance);
    console.log('Passes:', result.compliance.passes);
    
    if (result.compliance.warnings.length > 0) {
      console.log('WARNINGS FOUND:');
      result.compliance.warnings.forEach(w => console.log('  -', w));
    } else {
      console.log('✓ No compliance warnings');
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  }
});