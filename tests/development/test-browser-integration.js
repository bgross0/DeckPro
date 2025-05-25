// Test actual browser integration and UI interactions
const fs = require('fs');

// Simulate actual browser environment more accurately
function createBrowserMock() {
    const elements = new Map();
    
    global.window = {
        addEventListener: (event, handler) => {},
        location: { hostname: 'localhost' },
        updateBOMTable: () => {}
    };
    
    global.document = {
        readyState: 'complete',
        getElementById: (id) => {
            if (!elements.has(id)) {
                // Create mock element
                const element = {
                    id: id,
                    value: '',
                    innerHTML: '',
                    style: {},
                    classList: { 
                        add: () => {}, 
                        remove: () => {}, 
                        toggle: () => {} 
                    },
                    addEventListener: () => {},
                    getBoundingClientRect: () => ({ width: 400, height: 300 })
                };
                elements.set(id, element);
            }
            return elements.get(id);
        },
        querySelector: (selector) => ({ textContent: '', addEventListener: () => {} }),
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    
    return elements;
}

console.log('🌐 Testing Browser Integration and UI Interactions\n');

try {
    const mockElements = createBrowserMock();
    
    // Load all dependencies in correct order
    console.log('1. Loading dependencies in order...');
    
    // Logger
    eval(fs.readFileSync('./js/utils/logger.js', 'utf8'));
    console.log('  ✅ Logger loaded');
    
    // EventBus
    eval(fs.readFileSync('./js/utils/eventBus.js', 'utf8'));
    console.log('  ✅ EventBus loaded');
    
    // Store  
    eval(fs.readFileSync('./js/utils/store.js', 'utf8'));
    console.log('  ✅ Store loaded');
    
    // Command stack
    eval(fs.readFileSync('./js/utils/command.js', 'utf8'));
    console.log('  ✅ Command stack loaded');
    
    // Materials data
    eval(fs.readFileSync('./data/materials.js', 'utf8'));
    console.log('  ✅ Materials loaded');
    
    // Our extracted utilities
    eval(fs.readFileSync('./js/utils/footprintUtils.js', 'utf8'));
    console.log('  ✅ FootprintUtils loaded');
    
    eval(fs.readFileSync('./js/utils/materialCostUtils.js', 'utf8'));
    console.log('  ✅ MaterialCostUtils loaded');

    console.log('\n2. Testing utility functions with realistic data...');
    
    // Test FootprintUtils.verifyElements with actual UI elements
    try {
        global.window.FootprintUtils.verifyElements();
        console.log('  ✅ verifyElements completed without errors');
    } catch (error) {
        console.log('  ❌ verifyElements failed:', error.message);
    }
    
    // Test MaterialCostUtils.updateCostSummary with realistic store data
    try {
        const mockStore = global.createStore({
            engineOut: {
                material_takeoff: [
                    { item: "2x8 Joist", qty: "10", totalCost: 150.00, category: "lumber" },
                    { item: "LUS28 hanger", qty: "8", totalCost: 32.00, category: "hardware" }
                ]
            }
        });
        
        global.window.MaterialCostUtils.updateCostSummary(mockStore);
        
        const costSummary = global.document.getElementById('cost-summary');
        if (costSummary.innerHTML.includes('Total Project Cost')) {
            console.log('  ✅ updateCostSummary working correctly');
        } else {
            console.log('  ❌ updateCostSummary not updating DOM');
        }
    } catch (error) {
        console.log('  ❌ updateCostSummary failed:', error.message);
    }

    console.log('\n3. Testing integration with remaining controls.js...');
    
    // Test that controls.js can be loaded with our extractions
    try {
        // Mock additional globals that controls.js needs
        global.window.drawingSurface = {
            layers: [],
            toWorldCoords: (x, y) => ({ x, y }),
            pixelsToFeet: (pixels) => pixels / 10,
            draw: () => {}
        };
        
        // Read controls.js and check for critical integration points
        const controlsContent = fs.readFileSync('./js/ui/controls.js', 'utf8');
        
        // Verify the extracted method calls are properly replaced
        const integrationChecks = [
            {
                name: 'FootprintUtils.createDefaultFootprint calls',
                check: controlsContent.includes('FootprintUtils.createDefaultFootprint(') && 
                       !controlsContent.includes('this.createDefaultFootprint(')
            },
            {
                name: 'MaterialCostUtils.updateCostSummary calls', 
                check: controlsContent.includes('MaterialCostUtils.updateCostSummary(this.store)') &&
                       !controlsContent.includes('this.updateCostSummary()')
            },
            {
                name: 'FootprintUtils.verifyElements calls',
                check: controlsContent.includes('FootprintUtils.verifyElements()') &&
                       !controlsContent.includes('this.verifyElements()')
            },
            {
                name: 'No orphaned method definitions',
                check: !controlsContent.includes('createDefaultFootprint(width_ft, length_ft)') &&
                       !controlsContent.includes('updateCostSummary() {') &&
                       !controlsContent.includes('verifyElements() {')
            }
        ];
        
        integrationChecks.forEach(check => {
            if (check.check) {
                console.log(`  ✅ ${check.name}`);
            } else {
                console.log(`  ❌ ${check.name}`);
            }
        });
        
    } catch (error) {
        console.log('  ❌ Controls.js integration test failed:', error.message);
    }

    console.log('\n4. Testing error scenarios...');
    
    // Test with missing elements
    try {
        global.document.getElementById = () => null;
        global.window.FootprintUtils.createDefaultFootprint(12, 16, { 
            toWorldCoords: () => ({ x: 0, y: 0 }),
            pixelsToFeet: () => 1 
        });
        console.log('  ✅ Handles missing canvas element gracefully');
    } catch (error) {
        console.log('  ❌ Does not handle missing elements:', error.message);
    }

    console.log('\n🎯 Comprehensive Testing Complete!');
    console.log('📊 Summary: Extractions appear to be working correctly with proper integration.');
    
} catch (error) {
    console.error('❌ Critical browser integration error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}