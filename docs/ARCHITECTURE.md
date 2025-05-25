# DeckPro Architecture Documentation

## System Overview

DeckPro is a web-based deck design application built with a modular, event-driven architecture. The system consists of three main layers: the **Structure Calculation Engine**, the **User Interface Layer**, and **Utility Modules**.

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Canvas    │  │     UI      │  │    Utility Modules  │ │
│  │  Drawing    │  │ Controls    │  │   (6 modules)       │ │
│  │   System    │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                Structure Calculation Engine                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Joist    │  │    Beam     │  │       Post          │ │
│  │  Selection  │  │   Sizing    │  │   Positioning       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Cantilever  │  │ Materials   │  │    Validation       │ │
│  │Optimization │  │  Takeoff    │  │   & Compliance      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│     IRC 2021 Span Tables     │      Material Database      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Data Layer

**Purpose**: Provides foundational data for all calculations

**Components**:
- `data/span-tables.js` - IRC 2021 span tables for joists and beams
- `data/materials.js` - Material costs, properties, and hardware specifications

**Key Features**:
- Immutable reference data
- IRC 2021 compliance
- Structured for fast lookup

### 2. Structure Calculation Engine

**Purpose**: Core structural engineering calculations and code compliance

**Location**: `/js/engine/`

#### Engine Components

##### `index.js` - Main Engine API
- **Entry Point**: `computeStructure(inputPayload)`
- **Responsibilities**: Orchestrates all calculations, validates inputs
- **Returns**: Complete frame structure with joists, beams, posts, and material takeoff

##### `joist.js` - Joist Selection Logic
- **Function**: `selectJoist(width, species, spacing, deckingType, beamStyle, deckLength, optimizationGoal, footingType)`
- **Algorithm**: Iterates through valid spacings and sizes to find optimal configuration
- **Constraints**: IRC span limits, decking spacing requirements

##### `beam.js` - Beam Sizing and Post Spacing
- **Function**: `selectBeam(beamSpan, joistSpan, species, footingType)`
- **Algorithm**: Selects minimum beam size that can span distance with proper post spacing
- **Features**: Handles beam splicing for long spans, optimizes post count

##### `post.js` - Post Positioning
- **Function**: `generatePostList(beams, deckHeight, footingType, deckWidth, cantilever)`
- **Algorithm**: Calculates exact post coordinates based on beam positions
- **Critical Fix**: Posts positioned at `deckWidth - cantilever` to align under beams

##### `cantilever-optimizer.js` - Cantilever Optimization
- **Function**: `findOptimalCantilever(deckWidth, species, deckingType, deckLength, footingType)`
- **Algorithm**: Tests cantilever lengths from 0-3ft in 0.5ft increments
- **Constraint**: Enforces IRC rule: `cantilever ≤ 1/4 × backSpan`

##### `materials.js` - Material Takeoff Generation
- **Function**: `generateMaterialTakeoff(frame, speciesGrade, footingType)`
- **Output**: Complete bill of materials with quantities and costs
- **Features**: Detailed hardware calculations, stock length optimization

##### `validation.js` - Input Validation and Compliance
- **Function**: `validatePayload(payload)`, `checkCompliance(input, frame)`
- **Features**: Input sanitization, business rule validation, IRC compliance checking

##### `utils.js` - Engine Utilities
- **Functions**: `feetInchesToDecimal()`, formatting utilities
- **Purpose**: Helper functions for data transformation

#### Engine Data Flow

```
Input Payload → Validation → Joist Selection → Beam Selection → Post Generation → Material Takeoff → Output
     ↓              ↓              ↓               ↓               ↓                ↓            ↓
   User Input   Business Rules  IRC Tables     IRC Tables    Geometry Calc    Cost Calc    Complete BOM
```

### 3. User Interface Layer

**Purpose**: Provides interactive interface for deck design

**Location**: `/js/ui/`

#### UI Components

##### `controls.js` - Main UI Controller (Refactored)
- **Class**: `UIControls`
- **Responsibilities**: Event handling, state updates, UI coordination
- **Size**: Reduced from 999 to 807 lines (19% reduction)
- **Architecture**: Uses utility modules for specific functionality

##### `drawing.js` - Canvas Drawing System
- **Purpose**: Manages HTML5 canvas rendering and interactions
- **Features**: Layered rendering, zoom/pan, real-time updates

##### `store.js` - State Management
- **Pattern**: Observer pattern with event emission
- **Features**: Centralized state, change notifications

##### `export.js` - Export Functionality
- **Functions**: PNG export, CSV generation, file downloads
- **Formats**: Image files, material lists

#### State Management Flow

```
User Input → UI Controls → Store Update → Engine Calculation → UI Update → Canvas Render
     ↓           ↓            ↓              ↓                 ↓           ↓
  Click/Type  Event Handler  State Change  Structure Gen    Data Binding  Visual Update
```

### 4. Utility Modules (NEW)

**Purpose**: Reusable, focused utility functions extracted from monolithic code

**Location**: `/js/utils/`

#### Utility Module Details

##### `logger.js` - Production-Safe Logging
```javascript
class Logger {
  constructor() {
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('debug=true');
  }
  log(...args) { if (this.isDevelopment) console.log(...args); }
  error(...args) { console.error(...args); } // Always log errors
}
```

##### `footprintUtils.js` - Footprint Utilities
```javascript
window.FootprintUtils = {
  createDefaultFootprint(width_ft, length_ft, drawingSurface),
  verifyElements(elements = {...})
}
```

##### `materialCostUtils.js` - Cost Calculation Utils
```javascript
window.MaterialCostUtils = {
  updateCostSummary(store) // Updates DOM with cost breakdown
}
```

##### `uiVisibilityUtils.js` - UI Visibility Management
```javascript
window.UIVisibilityUtils = {
  updateUIVisibility(state) // Shows/hides UI elements based on state
}
```

##### `tabSwitchingUtils.js` - Tab Switching Behavior
```javascript
window.TabSwitchingUtils = {
  setupTabSwitching(addListenerCallback) // Generic tab panel switching
}
```

##### `modalUtils.js` - Modal Management
```javascript
window.ModalUtils = {
  setupModal(modalId, openBtnId, closeBtnId, addListenerCallback)
}
```

## Modular Refactoring Strategy

### Before Refactoring
- **Single File**: 999-line `controls.js` (god object antipattern)
- **Issues**: Hard to maintain, test, and extend
- **Coupling**: High coupling between unrelated functionality

### After Refactoring
- **Main Controller**: 807 lines (19% reduction)
- **Utility Modules**: 6 focused modules with single responsibilities
- **Benefits**: Better testability, reusability, maintainability

### Extraction Strategy
1. **Identify Self-Contained Functions**: Functions with minimal `this` dependencies
2. **Create Focused Modules**: Group related functionality together
3. **Maintain API Contracts**: Ensure existing functionality unchanged
4. **Incremental Testing**: Test each extraction thoroughly
5. **Update Dependencies**: Update HTML script tags and references

## Event System

### Event Bus Architecture
```javascript
// Central event bus for loose coupling
eventBus.emit('footprint:change', footprintData);
eventBus.on('structure:generated', handleStructureUpdate);
```

### Key Events
- `footprint:change` - Deck shape modified
- `structure:generated` - New structure calculated
- `cost:updated` - Material costs changed
- `tool:changed` - Drawing tool switched

## Performance Considerations

### Canvas Rendering
- **Layered Approach**: Separate layers for grid, footprint, structure
- **Selective Updates**: Only redraw changed layers
- **Efficient Algorithms**: Optimized drawing routines

### Calculation Engine
- **Lazy Evaluation**: Calculate only when inputs change
- **Memoization**: Cache expensive calculations
- **Early Exit**: Stop calculations when constraints violated

### Memory Management
- **Event Listener Cleanup**: Proper removal of event listeners
- **Canvas Buffer Management**: Efficient use of canvas resources
- **State Cleanup**: Clear unused state objects

## Security Considerations

### Input Validation
- **Engine Level**: Strict validation of all structural parameters
- **UI Level**: Input sanitization and bounds checking
- **Business Rules**: IRC compliance and safety constraints

### Production Safety
- **Logging**: Development-only console logging
- **Error Handling**: Graceful degradation on calculation errors
- **Data Validation**: Comprehensive input validation

## Testing Architecture

### Test Categories
1. **Engine Tests**: Structural calculations and IRC compliance
2. **Integration Tests**: Module loading and interaction
3. **UI Tests**: User interface component functionality
4. **Verification Tests**: Overall system integrity

### Test Files
- `verify-engine-functionality.js` - File integrity and engine status
- `test-app-load.js` - Module loading verification
- `verify-ui-functionality.js` - UI component testing
- `test-*-extraction.js` - Individual utility module tests

## Deployment Architecture

### File Structure
```
deckpro/src/
├── index.html              # Single page application entry
├── css/                    # Stylesheets (self-contained)
├── js/
│   ├── engine/            # Calculation engine (pure functions)
│   ├── ui/                # UI components (DOM manipulation)
│   └── utils/             # Utility modules (reusable functions)
└── data/                  # Static reference data
```

### Dependencies
- **Zero External Dependencies**: Pure vanilla JavaScript
- **Browser Requirements**: Modern browser with Canvas support
- **Performance**: Lightweight, fast loading

## Future Architecture Considerations

### Planned Improvements
1. **Complete Modularization**: Extract remaining UI components
2. **Immutable State**: Implement immutable state management
3. **Plugin System**: Extensible architecture for custom features
4. **Web Workers**: Move heavy calculations to background threads

### Scalability Considerations
- **Code Splitting**: Dynamic loading of modules
- **Service Workers**: Offline functionality
- **Progressive Enhancement**: Mobile-first responsive design

---

This architecture provides a solid foundation for professional deck design software with excellent maintainability, testability, and extensibility.