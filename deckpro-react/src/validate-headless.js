// Headless validation script (no JSX, pure JS testing)
import useDeckStore from './store/deckStore.js';
import { DrawingSurface } from './components/Canvas/DrawingSurface.js';
import { computeStructure } from './engine/index.js';
import { validatePayload } from './engine/validation.js';

console.log('🔍 Starting DeckPro validation...\n');

let passCount = 0;
let failCount = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failCount++;
  }
}


// Run all tests
async function runAllTests() {
  await test('Store initializes with default state', () => {
    const state = useDeckStore.getState();
    if (!state.footprint || !state.config) {
      throw new Error('Missing default state properties');
    }
    if (state.config.joist_spacing_in !== 16) {
      throw new Error('Invalid default joist spacing');
    }
  });

  await test('Store config updates work', () => {
    const store = useDeckStore.getState();
    store.updateConfig({ joist_spacing_in: 24 });
    
    const newState = useDeckStore.getState();
    if (newState.config.joist_spacing_in !== 24) {
      throw new Error('Config update failed');
    }
    
    // Reset
    store.updateConfig({ joist_spacing_in: 16 });
  });

  await test('Footprint can be set and retrieved', () => {
    const store = useDeckStore.getState();
    const testFootprint = [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 144 },
      { x: 0, y: 144 }
    ];
    
    store.setFootprint(testFootprint);
    const state = useDeckStore.getState();
    
    if (state.footprint.length !== 4) {
      throw new Error('Footprint not saved correctly');
    }
  });

  await test('Engine computes valid structure', () => {
    const payload = {
      footprint: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 12 },
        { x: 0, y: 12 }
      ],
      config: {
        joist_spacing_in: 16,
        joist_size: "2x8",
        beam_type: "flush",
        decking_type: "5/4",
        foundation: "deck-blocks",
        double_rim_joists: true,
        bridging: false,
        beam_size: "single",
        beam_species: "SPF",
        joist_species: "SPF",
        decking_direction: "perpendicular"
      }
    };
    
    const result = computeStructure(payload);
    
    if (!result || !result.joists || !result.beams || !result.posts) {
      throw new Error('Invalid structure result');
    }
    
    if (result.joists.length === 0) {
      throw new Error('No joists generated');
    }
    
    if (result.beams.length === 0) {
      throw new Error('No beams generated');
    }
  });

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n${failCount === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
  
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests();