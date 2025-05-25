# DeckPro Development Guide

## Development Environment Setup

### Prerequisites

- **Web Browser**: Modern browser with HTML5 Canvas support (Chrome, Firefox, Safari, Edge)
- **Code Editor**: VS Code, Sublime Text, or similar with JavaScript support
- **Local Server**: Optional but recommended for development

### Project Setup

1. **Clone/Download Project**:
   ```bash
   git clone <repository-url>
   cd deckpro
   ```

2. **Development Server** (recommended):
   ```bash
   cd src
   python -m http.server 8080
   # OR
   npx serve .
   # OR
   php -S localhost:8080
   ```

3. **Access Application**:
   Open `http://localhost:8080` in browser

### Development vs Production

**Development Mode Detection**:
- `localhost` or `127.0.0.1` hostname
- `?debug=true` URL parameter

**Development Features**:
- Console logging enabled
- Detailed error messages
- Debug information in logs

## Code Organization

### Directory Structure

```
src/
├── index.html              # Main application entry point
├── css/                    # Stylesheets
│   ├── styles.css          # Main styles
│   └── components.css      # UI component styles
├── data/                   # Static reference data
│   ├── materials.js        # Material database
│   └── span-tables.js      # IRC 2021 span tables
├── js/
│   ├── engine/             # Calculation engine (pure functions)
│   │   ├── index.js        # Main API entry point
│   │   ├── joist.js        # Joist selection logic
│   │   ├── beam.js         # Beam sizing calculations
│   │   ├── post.js         # Post positioning
│   │   ├── cantilever-optimizer.js  # Cantilever optimization
│   │   ├── materials.js    # Material takeoff generation
│   │   ├── validation.js   # Input validation
│   │   └── utils.js        # Utility functions
│   ├── ui/                 # User interface layer
│   │   ├── controls.js     # Main UI controller
│   │   ├── drawing.js      # Canvas drawing system
│   │   ├── store.js        # State management
│   │   └── export.js       # Export functionality
│   └── utils/              # Utility modules
│       ├── logger.js       # Logging utility
│       ├── footprintUtils.js       # Footprint utilities
│       ├── materialCostUtils.js    # Cost utilities
│       ├── uiVisibilityUtils.js    # UI visibility
│       ├── tabSwitchingUtils.js    # Tab switching
│       └── modalUtils.js           # Modal management
└── tests/                  # Test files and verification scripts
    ├── verify-engine-functionality.js
    ├── test-app-load.js
    └── verify-ui-functionality.js
```

### Module Loading Order

**Critical**: Scripts must be loaded in dependency order in `index.html`:

```html
<!-- Data layer -->
<script src="data/materials.js"></script>
<script src="data/span-tables.js"></script>

<!-- Engine layer -->
<script src="js/engine/utils.js"></script>
<script src="js/engine/validation.js"></script>
<script src="js/engine/post.js"></script>
<script src="js/engine/joist.js"></script>
<script src="js/engine/beam.js"></script>
<script src="js/engine/cantilever-optimizer.js"></script>
<script src="js/engine/materials.js"></script>
<script src="js/engine/index.js"></script>

<!-- Utility modules -->
<script src="js/utils/logger.js"></script>
<script src="js/utils/footprintUtils.js"></script>
<script src="js/utils/materialCostUtils.js"></script>
<script src="js/utils/uiVisibilityUtils.js"></script>
<script src="js/utils/tabSwitchingUtils.js"></script>
<script src="js/utils/modalUtils.js"></script>

<!-- UI layer -->
<script src="js/ui/store.js"></script>
<script src="js/ui/drawing.js"></script>
<script src="js/ui/controls.js"></script>
<script src="js/ui/export.js"></script>
<script src="js/main.js"></script>
```

## Development Workflow

### Adding New Features

#### 1. Engine Changes (Structural Calculations)

**File Location**: `/js/engine/`

**Process**:
1. Identify which engine module needs modification
2. Update the appropriate engine file
3. Run engine verification tests
4. Update API documentation if needed

**Example - Adding New Joist Size**:
```javascript
// In js/engine/joist.js
const beamSizes = ['2x6', '2x8', '2x10', '2x12', '2x14']; // Add 2x14
```

#### 2. UI Features

**File Location**: `/js/ui/` or `/js/utils/`

**Process**:
1. For reusable functionality: Create utility module in `/js/utils/`
2. For UI-specific logic: Modify `/js/ui/controls.js` or related files
3. Update HTML script tags if new modules added
4. Test UI functionality

**Example - Adding New Utility Module**:
```javascript
// Create js/utils/newFeatureUtils.js
window.NewFeatureUtils = {
  someFunction(params) {
    // Implementation
  }
};

// Add to index.html
<script src="js/utils/newFeatureUtils.js"></script>

// Use in controls.js
NewFeatureUtils.someFunction(data);
```

#### 3. Data Updates

**File Location**: `/data/`

**Process**:
1. Update `materials.js` for new materials/costs
2. Update `span-tables.js` for code changes
3. Test with verification scripts

### Testing Strategy

#### 1. Development Testing

**Quick Verification**:
```bash
cd src
node verify-engine-functionality.js    # File integrity
node test-app-load.js                 # Module loading
node verify-ui-functionality.js       # UI components
```

#### 2. Manual Testing

**Critical Test Cases**:
1. **Basic Functionality**:
   - Draw 12x16 ledger deck
   - Generate structure
   - Verify post positioning
   - Check material takeoff

2. **Edge Cases**:
   - Very small decks (8x8)
   - Large decks (24x32)
   - Maximum cantilevers
   - Different species/grades

3. **UI Components**:
   - Tab switching
   - Modal functionality
   - Cost updates
   - Export features

#### 3. Regression Testing

**After Any Engine Changes**:
1. Run all verification scripts
2. Test known working configurations
3. Verify IRC compliance maintained
4. Check post positioning accuracy

### Code Style Guidelines

#### JavaScript Style

**General Principles**:
- Use clear, descriptive variable names
- Prefer `const` over `let`, avoid `var`
- Use modern JavaScript features (ES6+)
- Comment complex algorithms

**Example**:
```javascript
// Good
const maxCantileverDistance = backSpan / 4;
const isWithinIRCLimits = cantilever <= maxCantileverDistance;

// Avoid
var c = b / 4;
if (cant <= c) { ... }
```

**Function Organization**:
```javascript
// Pure functions (no side effects)
function calculateJoistSpan(width, cantilever) {
  return width - cantilever;
}

// Module exports
window.UtilityModule = {
  publicFunction(params) {
    return privateHelper(params);
  }
};

function privateHelper(params) {
  // Internal implementation
}
```

#### Utility Module Pattern

**Standard Structure**:
```javascript
// js/utils/exampleUtils.js
window.ExampleUtils = {
  /**
   * Function description
   * @param {type} param - Parameter description
   * @returns {type} Return value description
   */
  publicMethod(param) {
    // Implementation
  },
  
  anotherMethod(param1, param2) {
    // Implementation
  }
};
```

**Integration Pattern**:
```javascript
// In controls.js
ExampleUtils.publicMethod(data);

// With event listener management
ExampleUtils.setupSomething((element, eventType, handler) => {
  this.addListener(element, eventType, handler);
});
```

### Debugging

#### Development Logging

**Enable Debug Mode**:
- Use `localhost` for development
- Add `?debug=true` to URL for production debugging

**Logging Levels**:
```javascript
logger.log('Debug information');      // Development only
logger.warn('Warning message');       // Always shown
logger.error('Error occurred');       // Always shown
```

#### Common Issues

**Module Loading Errors**:
- Check script tag order in HTML
- Verify file paths are correct
- Check for syntax errors in JavaScript

**Engine Calculation Errors**:
- Verify input parameters are valid
- Check span table data integrity
- Ensure IRC constraints are met

**UI Issues**:
- Check DOM element IDs match code
- Verify event listeners are attached
- Test with browser dev tools

### Performance Optimization

#### Canvas Rendering

**Best Practices**:
- Use layered rendering (separate canvases for different elements)
- Minimize full redraws
- Use efficient drawing algorithms

**Example**:
```javascript
// Good - selective updates
if (structureChanged) {
  structureLayer.redraw();
}

// Avoid - unnecessary full redraws
canvas.clearRect(0, 0, width, height);
redrawEverything();
```

#### Calculation Engine

**Optimization Strategies**:
- Early exit from loops when solution found
- Cache expensive calculations
- Use appropriate data structures

**Example**:
```javascript
// Good - early exit
for (const size of joistSizes) {
  if (spanTable[size][spacing] >= requiredSpan) {
    return size; // Found solution, exit early
  }
}

// Avoid - unnecessary iterations
let bestSize = null;
for (const size of joistSizes) {
  if (spanTable[size][spacing] >= requiredSpan) {
    bestSize = size; // Continue checking all sizes
  }
}
```

### Architecture Guidelines

#### Separation of Concerns

**Engine Layer** (Pure Functions):
- No DOM manipulation
- No side effects
- Deterministic outputs
- Easy to test

**UI Layer** (DOM Interaction):
- Event handling
- DOM updates
- User feedback
- State management

**Utility Layer** (Reusable Logic):
- Focused single responsibility
- No global state dependencies
- Clear API contracts
- Easy to test in isolation

#### Event-Driven Architecture

**Event Bus Usage**:
```javascript
// Emit events for loose coupling
eventBus.emit('structure:generated', structureData);

// Listen for events
eventBus.on('structure:generated', (data) => {
  updateUI(data);
});
```

**Benefits**:
- Loose coupling between components
- Easy to add new features
- Better testability

### Deployment

#### Production Build

**Preparation Steps**:
1. Test all functionality thoroughly
2. Run verification scripts
3. Check for console errors
4. Verify performance

**File Organization**:
- All required files in `/src/` directory
- No external dependencies
- Self-contained deployment

#### Browser Compatibility

**Supported Browsers**:
- Chrome 60+
- Firefox 55+
- Safari 10+
- Edge 79+

**Required Features**:
- HTML5 Canvas
- ES6 JavaScript
- CSS Grid/Flexbox

### Contributing Guidelines

#### Code Review Checklist

**Functionality**:
- [ ] Feature works as intended
- [ ] No regressions introduced
- [ ] Edge cases handled
- [ ] Error handling implemented

**Code Quality**:
- [ ] Follows style guidelines
- [ ] Appropriate comments added
- [ ] No console.log statements in production code
- [ ] Efficient algorithms used

**Testing**:
- [ ] Verification scripts pass
- [ ] Manual testing completed
- [ ] Documentation updated

**Architecture**:
- [ ] Separation of concerns maintained
- [ ] Appropriate layer for changes
- [ ] Reusable code extracted to utilities
- [ ] Event-driven patterns followed

#### Pull Request Process

1. **Create Feature Branch**: Work on feature branches, not main
2. **Test Thoroughly**: Run all verification scripts
3. **Update Documentation**: Update relevant docs
4. **Submit PR**: Include description of changes and testing performed

---

This development guide provides the foundation for maintaining and extending DeckPro's professional-grade deck design capabilities.