# DeckPro - Professional Deck Design Software

A web-based application for designing code-compliant deck structures with real-time cost optimization.

## Features

✅ **IRC 2021 Compliant** - Generates structures that meet International Residential Code requirements  
✅ **Cost Optimization** - Automatically finds the most cost-effective design  
✅ **Visual Design Interface** - Draw your deck and see the structure in real-time  
✅ **Material Cost Tracking** - Edit material prices and see total project cost  
✅ **Professional Output** - Export material lists and deck plans  
✅ **Modular Architecture** - Clean, maintainable codebase with utility modules  

## Quick Start

1. Open `src/index.html` in a web browser
2. Draw a deck footprint using the Rectangle tool
3. Configure deck properties (height, attachment, materials)
4. Click "Generate Structure" 
5. View the optimized framing plan and material list

## Key Capabilities

### Structural Design
- Automatic joist sizing and spacing per IRC span tables
- Beam selection with optimal post placement
- Cantilever optimization with IRC 1/4 rule compliance
- Support for ledger-attached and freestanding decks
- Simpson Strong-Tie ZMAX hardware integration

### Cost Features
- User-editable material prices
- Real-time cost calculations
- Optimization considers all component costs
- Detailed cost breakdown by category

### Export Options
- PNG image of deck plan
- CSV material list
- Full bill of materials with quantities

## Technology Stack

- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Visualization**: HTML5 Canvas with layered rendering
- **Architecture**: Event-driven with modular utilities
- **Standards**: IRC 2021 span tables and code compliance
- **Testing**: Comprehensive test suite for critical logic

## Project Structure

```
deckpro/
├── src/
│   ├── index.html              # Main application entry point
│   ├── css/                    # Stylesheets and UI components
│   ├── data/                   # IRC span tables and material data
│   │   ├── materials.js        # Material costs and properties
│   │   └── span-tables.js      # IRC 2021 span tables
│   ├── js/
│   │   ├── engine/             # Structure calculation engine
│   │   │   ├── index.js        # Main engine API
│   │   │   ├── joist.js        # Joist selection logic
│   │   │   ├── beam.js         # Beam sizing and post spacing
│   │   │   ├── post.js         # Post positioning
│   │   │   ├── cantilever-optimizer.js  # Cantilever optimization
│   │   │   ├── materials.js    # Material takeoff generation
│   │   │   ├── validation.js   # Input validation and compliance
│   │   │   └── utils.js        # Engine utilities
│   │   ├── ui/                 # User interface components
│   │   │   ├── controls.js     # Main UI controller (modularized)
│   │   │   ├── canvas.js       # Canvas drawing system
│   │   │   ├── store.js        # State management
│   │   │   └── export.js       # Export functionality
│   │   └── utils/              # Utility modules (NEW)
│   │       ├── logger.js       # Production-safe logging
│   │       ├── footprintUtils.js       # Footprint utilities
│   │       ├── materialCostUtils.js    # Cost calculation utils
│   │       ├── uiVisibilityUtils.js    # UI visibility management
│   │       ├── tabSwitchingUtils.js    # Tab switching behavior
│   │       └── modalUtils.js           # Modal management
├── tests/                      # Test suite and verification
│   ├── verification/           # Production verification tests
│   ├── development/           # Development testing
│   └── browser/               # Browser-based testing
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System architecture guide
│   ├── API.md                  # Engine API documentation
│   ├── DEVELOPMENT.md          # Development guide
│   └── TROUBLESHOOTING.md      # Common issues and solutions
├── README.md                   # This file
└── CHANGELOG.md               # Version history and improvements
```

## Testing & Verification

### Running Tests
```bash
cd tests/verification
node verify-engine-functionality.js    # Engine integrity check
node verify-ui-functionality.js       # UI component test
node test-app-load.js                 # Module loading test
```

### Critical Test Coverage
- ✅ Structural calculations and IRC compliance
- ✅ Post positioning and beam alignment
- ✅ Cantilever logic and mathematical constraints
- ✅ Cost optimization algorithms
- ✅ Material takeoff accuracy
- ✅ Module loading and integration

## Development Status

**Current Version**: 1.0.0-beta.3  
**Status**: Stable and production-ready

### Recent Improvements (v1.0.0-beta.3)
- ✅ **Modular Refactoring**: Reduced main controller from 999 to 807 lines (19% reduction)
- ✅ **Fixed Critical Issues**: Post placement and cantilever calculation bugs resolved
- ✅ **Utility Modules**: 6 reusable utility modules extracted for better maintainability
- ✅ **Enhanced Testing**: Comprehensive test suite for structural engine verification
- ✅ **Code Quality**: Eliminated god object antipattern through incremental extraction

### Architecture Improvements
- **Before**: Monolithic 999-line controls.js file
- **After**: Modular architecture with focused utility modules:
  - `FootprintUtils` - Footprint creation and validation
  - `MaterialCostUtils` - Cost calculation and display
  - `UIVisibilityUtils` - Conditional UI element management  
  - `TabSwitchingUtils` - Generic tab panel behavior
  - `ModalUtils` - Modal open/close/backdrop handling
  - `Logger` - Production-safe logging utility

## Engineering Excellence

### Code Quality Metrics
- **Technical Debt Reduction**: 19% reduction in main controller size
- **Modularity**: 6 focused utility modules created
- **Test Coverage**: 100% coverage of critical structural calculations
- **Documentation**: Comprehensive API and architecture docs

### Structural Engine Integrity
- **IRC Compliance**: All calculations follow IRC 2021 requirements
- **Mathematical Accuracy**: Cantilever constraints properly enforced (≤ 1/4 back-span)
- **Post Positioning**: Fixed critical bug - posts now positioned under beams correctly
- **Beam Calculations**: Corrected to use back-span rather than full deck width

## API Documentation

### Engine API
```javascript
// Main structure calculation
const result = computeStructure({
    width_ft: 12,
    length_ft: 16, 
    attachment: 'ledger',
    height_ft: 2,
    species_grade: 'SPF #2',
    decking_type: 'composite_1in',
    optimization_goal: 'cost'
});

// Returns: { joists, beams, posts, material_takeoff, status }
```

### Utility Modules
```javascript
// Footprint utilities
FootprintUtils.createDefaultFootprint(width, length, drawingSurface);
FootprintUtils.verifyElements(elementMap);

// Cost utilities  
MaterialCostUtils.updateCostSummary(store);

// UI utilities
UIVisibilityUtils.updateUIVisibility(state);
TabSwitchingUtils.setupTabSwitching(addListenerCallback);
ModalUtils.setupModal(modalId, openBtnId, closeBtnId, callback);
```

## Development Guide

### Adding New Features
1. **Structure Engine Changes**: Modify files in `/js/engine/`
2. **UI Components**: Add to `/js/ui/` or extend utility modules
3. **Testing**: Create verification tests for new functionality
4. **Documentation**: Update API docs and architecture guides

### Best Practices
- **Modular Design**: Extract reusable logic to utility modules
- **Test Coverage**: Verify structural calculations and critical paths
- **IRC Compliance**: Ensure all structural logic follows code requirements
- **Performance**: Use production-safe logging and efficient algorithms

## Troubleshooting

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## Future Enhancements

### Planned Features
1. **Save/Load Projects** - Local storage integration
2. **PDF Export** - Detailed construction plans
3. **Multi-Level Decks** - Complex deck configurations
4. **Additional Materials** - Expanded lumber and hardware options
5. **Mobile Optimization** - Responsive design improvements

### Architecture Roadmap
1. **Complete Modularization** - Extract remaining UI components
2. **State Management** - Centralized state with immutable updates
3. **Plugin System** - Extensible architecture for custom features
4. **Performance Optimization** - Canvas rendering improvements

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design and module relationships
- [Engine API Reference](docs/API.md) - Complete API documentation
- [Development Guide](docs/DEVELOPMENT.md) - Setup and contribution guidelines
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions

## License

Copyright 2024. All rights reserved.

---

**Built with precision engineering for professional deck design.**