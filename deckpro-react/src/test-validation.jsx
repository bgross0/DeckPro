// Automated GUI validation script
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import useDeckStore from './store/deckStore.js'
import { DrawingSurface } from './components/Canvas/DrawingSurface.js'

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function log(type, message, details) {
  testResults[type].push({ message, details, timestamp: new Date() });
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
}

// Test 1: Component Mounting
async function testComponentMounting() {
  try {
    const testDiv = document.createElement('div');
    testDiv.id = 'test-root';
    document.body.appendChild(testDiv);
    
    const root = createRoot(testDiv);
    root.render(<App />);
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if main components exist
    const header = document.querySelector('header');
    const canvas = document.querySelector('canvas');
    const sidebar = document.querySelector('[class*="sidebar"]');
    
    if (header && canvas && sidebar) {
      log('passed', 'All main components mounted successfully');
    } else {
      log('failed', 'Missing components', {
        header: !!header,
        canvas: !!canvas,
        sidebar: !!sidebar
      });
    }
    
    root.unmount();
    document.body.removeChild(testDiv);
  } catch (error) {
    log('failed', 'Component mounting failed', error.message);
  }
}

// Test 2: Store Functionality
async function testStoreManagement() {
  try {
    const store = useDeckStore.getState();
    
    // Test initial state
    if (store.footprint && store.config) {
      log('passed', 'Store initialized with default state');
    }
    
    // Test config update
    const originalSpacing = store.config.joist_spacing_in;
    store.updateConfig({ joist_spacing_in: 24 });
    
    if (useDeckStore.getState().config.joist_spacing_in === 24) {
      log('passed', 'Store config update works');
      store.updateConfig({ joist_spacing_in: originalSpacing });
    } else {
      log('failed', 'Store config update failed');
    }
    
    // Test footprint update
    const testFootprint = [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 120, y: 144 },
      { x: 0, y: 144 }
    ];
    
    store.setFootprint(testFootprint);
    if (useDeckStore.getState().footprint.length === 4) {
      log('passed', 'Footprint update works');
    } else {
      log('failed', 'Footprint update failed');
    }
    
  } catch (error) {
    log('failed', 'Store management test failed', error.message);
  }
}

// Test 3: Canvas Drawing System
async function testCanvasSystem() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const surface = new DrawingSurface(canvas);
    
    // Test layer system
    if (surface.layers && surface.layers.length > 0) {
      log('passed', 'Canvas layer system initialized');
    } else {
      log('failed', 'Canvas layer system failed');
    }
    
    // Test coordinate conversion
    const worldCoords = surface.screenToWorld(400, 300);
    const screenCoords = surface.worldToScreen(worldCoords.x, worldCoords.y);
    
    if (Math.abs(screenCoords.x - 400) < 0.1 && Math.abs(screenCoords.y - 300) < 0.1) {
      log('passed', 'Coordinate conversion works correctly');
    } else {
      log('failed', 'Coordinate conversion error');
    }
    
    // Test zoom functionality
    const originalZoom = surface.zoom;
    surface.zoomTo(400, 300, 2);
    
    if (Math.abs(surface.zoom - originalZoom * 2) < 0.1) {
      log('passed', 'Zoom functionality works');
    } else {
      log('failed', 'Zoom functionality error');
    }
    
  } catch (error) {
    log('failed', 'Canvas system test failed', error.message);
  }
}

// Test 4: Engine Calculations
async function testEngineCalculations() {
  try {
    const { computeStructure } = await import('./engine/index.js');
    
    const testPayload = {
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
    
    const result = computeStructure(testPayload);
    
    if (result && result.joists && result.beams && result.posts) {
      log('passed', 'Engine calculations successful', {
        joists: result.joists.length,
        beams: result.beams.length,
        posts: result.posts.length
      });
    } else {
      log('failed', 'Engine calculations incomplete');
    }
    
  } catch (error) {
    log('failed', 'Engine calculation test failed', error.message);
  }
}

// Test 5: User Interaction Simulation
async function testUserInteractions() {
  try {
    const store = useDeckStore.getState();
    
    // Simulate tool selection
    store.setTool('rectangle');
    if (useDeckStore.getState().tool === 'rectangle') {
      log('passed', 'Tool selection works');
    } else {
      log('failed', 'Tool selection failed');
    }
    
    // Simulate structure generation
    store.setFootprint([
      { x: 0, y: 0 },
      { x: 240, y: 0 },
      { x: 240, y: 180 },
      { x: 0, y: 180 }
    ]);
    
    await store.generateStructure();
    
    const state = useDeckStore.getState();
    if (state.structure && !state.loading && !state.error) {
      log('passed', 'Structure generation works', {
        hasJoists: !!state.structure.joists,
        hasBeams: !!state.structure.beams,
        hasPosts: !!state.structure.posts
      });
    } else {
      log('failed', 'Structure generation failed', state.error);
    }
    
  } catch (error) {
    log('failed', 'User interaction test failed', error.message);
  }
}

// Run all tests
export async function runValidation() {
  console.log('Starting GUI validation tests...');
  
  await testComponentMounting();
  await testStoreManagement();
  await testCanvasSystem();
  await testEngineCalculations();
  await testUserInteractions();
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed tests:');
    testResults.failed.forEach(test => {
      console.log(`- ${test.message}:`, test.details);
    });
  }
  
  return testResults;
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().then(results => {
    process.exit(results.failed.length > 0 ? 1 : 0);
  });
}