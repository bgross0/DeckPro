# DeckPro API Documentation

## Structure Calculation Engine API

### Main Engine Function

#### `computeStructure(inputPayload)`

The primary entry point for structural calculations.

**Parameters:**
```javascript
{
  width_ft: number,           // Deck width in feet (required)
  length_ft: number,          // Deck length in feet (required)  
  height_ft: number,          // Deck height in feet (required)
  attachment: string,         // 'ledger' or 'free' (required)
  footing_type: string,       // 'concrete', 'helical', or 'surface' (required)
  species_grade: string,      // 'SPF #2', 'DF #1', 'HF #2', or 'SP #2' (required)
  decking_type: string,       // 'composite_1in', 'wood_5/4', or 'wood_2x' (required)
  beam_style_outer: string,   // 'drop' or 'inline' (optional, auto-determined)
  beam_style_inner: string,   // 'drop' or 'inline' (optional, for freestanding)
  forced_joist_spacing_in: number, // 12, 16, or 24 (optional, overrides optimization)
  optimization_goal: string   // 'cost' or 'strength' (optional, defaults to 'cost')
}
```

**Returns:**
```javascript
{
  joists: {
    size: string,           // e.g., '2x8'
    spacing_in: number,     // e.g., 16
    count: number,          // Number of joists
    span_ft: number,        // Joist span (back-span)
    cantilever_ft: number,  // Cantilever distance
    total_length_ft: number,// Total joist length
    orientation: string     // 'width' or 'length'
  },
  beams: [{
    position: string,       // 'inner' or 'outer'
    style: string,          // 'drop', 'inline', or 'ledger'
    size: string,           // e.g., '(2)2x10'
    post_spacing_ft: number,// Distance between posts
    post_count: number,     // Number of posts for this beam
    span_ft: number,        // Beam span distance
    dimension: string,      // e.g., '2x10'
    plyCount: number,       // Number of beam plies
    spliced: boolean        // Whether beam requires splicing
  }],
  posts: [{
    x: number,              // X coordinate in feet
    y: number,              // Y coordinate in feet  
    height_ft: number,      // Post height
    size: string            // e.g., '6x6'
  }],
  material_takeoff: [{
    item: string,           // Material description
    qty: number,            // Quantity needed
    unit: string,           // Unit of measure
    category: string,       // 'lumber', 'hardware', 'fasteners', 'footings'
    totalCost: number       // Total cost for this item
  }],
  status: string,           // 'PASS' or 'FAIL'
  warnings: [string],       // Array of warning messages
  metrics: {
    total_board_ft: number, // Total lumber board feet
    reserve_capacity_min: number // Minimum reserve capacity percentage
  }
}
```

**Example Usage:**
```javascript
const deckConfig = {
  width_ft: 12,
  length_ft: 16,
  height_ft: 2,
  attachment: 'ledger',
  footing_type: 'concrete',
  species_grade: 'SPF #2',
  decking_type: 'composite_1in',
  optimization_goal: 'cost'
};

const result = computeStructure(deckConfig);

if (result.status === 'PASS') {
  console.log(`Structure uses ${result.joists.size} joists @ ${result.joists.spacing_in}" O.C.`);
  console.log(`Total cost: $${result.material_takeoff.reduce((sum, item) => sum + item.totalCost, 0)}`);
} else {
  console.error('Structure calculation failed:', result.warnings);
}
```

### Individual Engine Functions

#### Joist Selection

##### `selectJoist(width, species, spacing, deckingType, beamStyle, deckLength, optimizationGoal, footingType)`

**Purpose**: Determines optimal joist size and configuration

**Parameters**:
- `width` (number): Joist span distance in feet
- `species` (string): Wood species/grade key
- `spacing` (number): Forced spacing in inches (optional)
- `deckingType` (string): Decking material type
- `beamStyle` (string): 'drop' allows cantilever, 'inline' does not
- `deckLength` (number): Perpendicular dimension for joist count
- `optimizationGoal` (string): 'cost' or 'strength'
- `footingType` (string): Affects cost calculations

**Returns**: Joist configuration object

#### Beam Selection

##### `selectBeam(beamSpan, joistSpan, species, footingType)`

**Purpose**: Determines beam size and post spacing

**Parameters**:
- `beamSpan` (number): Distance beam must span
- `joistSpan` (number): Joist span for IRC table lookup
- `species` (string): Wood species/grade
- `footingType` (string): Affects post cost calculations

**Returns**: Beam configuration with post spacing

#### Post Generation

##### `generatePostList(beams, deckHeight, footingType, deckWidth, cantilever)`

**Purpose**: Calculates exact post positions

**Critical**: Posts positioned at `deckWidth - cantilever` to align under beams

**Parameters**:
- `beams` (array): Beam configuration array
- `deckHeight` (number): Deck height for post sizing
- `footingType` (string): Affects post height calculations
- `deckWidth` (number): Deck width for position calculations
- `cantilever` (number): Cantilever distance

**Returns**: Array of post objects with x,y coordinates

#### Cantilever Optimization

##### `findOptimalCantilever(deckWidth, species, deckingType, deckLength, footingType)`

**Purpose**: Finds cost-optimal cantilever length

**Algorithm**: Tests cantilevers 0-3ft in 0.5ft increments

**Constraint**: Enforces IRC rule: `cantilever ≤ 1/4 × backSpan`

**Parameters**:
- `deckWidth` (number): Total deck width
- `species` (string): Wood species/grade
- `deckingType` (string): Decking type
- `deckLength` (number): Deck length for beam calculations
- `footingType` (string): Footing type

**Returns**: Optimal cantilever configuration

## Utility Modules API

### Logger Utility

#### `window.logger`

**Purpose**: Production-safe logging utility

**Methods**:
```javascript
logger.log(...args)     // Logs only in development
logger.error(...args)   // Always logs errors
logger.warn(...args)    // Always logs warnings
```

**Development Detection**:
- `localhost` or `127.0.0.1` hostname
- `?debug=true` URL parameter

### Footprint Utilities

#### `window.FootprintUtils`

##### `createDefaultFootprint(width_ft, length_ft, drawingSurface)`

**Purpose**: Creates centered default footprint

**Parameters**:
- `width_ft` (number): Footprint width
- `length_ft` (number): Footprint length  
- `drawingSurface` (object): Drawing surface for coordinate calculation

**Returns**: Footprint object with origin and dimensions

##### `verifyElements(elements)`

**Purpose**: Validates DOM elements exist

**Parameters**:
- `elements` (object): Map of element IDs to descriptive names

**Side Effects**: Logs errors for missing elements

### Material Cost Utilities

#### `window.MaterialCostUtils`

##### `updateCostSummary(store)`

**Purpose**: Updates DOM with cost breakdown

**Parameters**:
- `store` (object): Application state store

**Side Effects**: Updates cost summary DOM elements

### UI Visibility Utilities

#### `window.UIVisibilityUtils`

##### `updateUIVisibility(state)`

**Purpose**: Shows/hides UI elements based on application state

**Parameters**:
- `state` (object): Application state object

**Logic**: Shows inner beam controls only for freestanding decks

### Tab Switching Utilities

#### `window.TabSwitchingUtils`

##### `setupTabSwitching(addListenerCallback)`

**Purpose**: Generic tab panel switching behavior

**Parameters**:
- `addListenerCallback` (function): Optional event listener registration function

**Behavior**: 
- Activates clicked tab button
- Shows corresponding tab panel
- Hides other panels

### Modal Utilities

#### `window.ModalUtils`

##### `setupModal(modalId, openButtonId, closeButtonId, addListenerCallback)`

**Purpose**: Complete modal management (open/close/backdrop)

**Parameters**:
- `modalId` (string): Modal element ID
- `openButtonId` (string): Open button element ID
- `closeButtonId` (string): Close button element ID
- `addListenerCallback` (function): Optional event listener registration

**Features**:
- Opens modal on button click
- Closes modal on close button or backdrop click
- Supports managed event listeners for cleanup

## Data Layer API

### Span Tables

#### `spanTables.joists[species][size][spacing]`

**Purpose**: IRC 2021 joist span lookup

**Structure**:
```javascript
spanTables.joists['SPF #2']['2x8'][16] // Returns allowable span in feet
```

#### `spanTables.beams[species][size][joistSpan]`

**Purpose**: IRC 2021 beam span lookup

**Structure**:
```javascript
spanTables.beams['SPF #2']['(2)2x10'][8] // Returns allowable beam span
```

#### `spanTables.deckingSpacing[deckingType]`

**Purpose**: Maximum joist spacing for decking types

**Structure**:
```javascript
spanTables.deckingSpacing['composite_1in'].perpendicular // Returns max spacing
```

### Materials Database

#### `materials.lumber[size]`

**Purpose**: Lumber properties and costs

**Structure**:
```javascript
materials.lumber['2x8'] = {
  costPerFoot: 3.25,
  widthIn: 7.25,
  depthIn: 1.5
}
```

#### `materials.hardware[item]`

**Purpose**: Hardware costs and specifications

**Structure**:
```javascript
materials.hardware['LUS28'] = {
  cost: 3.75,
  description: '2x8 joist hanger'
}
```

#### `materials.getStockLength(requiredLength, size)`

**Purpose**: Finds appropriate stock length for given requirement

**Returns**: Standard stock length that accommodates required length

## Error Handling

### Engine Errors

#### `EngineError` Class

**Purpose**: Structured error handling for calculation failures

**Structure**:
```javascript
class EngineError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'EngineError';
  }
}
```

**Common Error Codes**:
- `INVALID_INPUT` - Input validation failed
- `SPECIES_UNKNOWN` - Invalid species/grade specified
- `NO_SOLUTION` - No valid structural solution found
- `SPAN_EXCEEDED` - Required span exceeds allowable limits

### Error Response Format

**Calculation Failures**:
```javascript
{
  status: 'FAIL',
  warnings: ['Error message describing the issue'],
  joists: null,
  beams: [],
  posts: [],
  material_takeoff: []
}
```

## Validation Rules

### Input Validation

**Required Fields**: `width_ft`, `length_ft`, `height_ft`, `attachment`, `footing_type`, `species_grade`, `decking_type`

**Numeric Constraints**:
- `width_ft > 0`
- `length_ft > 0` 
- `height_ft >= 0`

**Enum Validation**:
- `attachment`: 'ledger' or 'free'
- `footing_type`: 'helical', 'concrete', or 'surface'
- `species_grade`: 'SPF #2', 'DF #1', 'HF #2', or 'SP #2'
- `decking_type`: 'composite_1in', 'wood_5/4', or 'wood_2x'

### Business Rules

**Safety Constraints**:
- Surface footings illegal if `height_ft >= 2.5` and `attachment = 'ledger'`
- Cantilever must be ≤ 1/4 of back-span per IRC
- All spans must be within IRC table limits

## Performance Notes

### Optimization Strategies

**Calculation Efficiency**:
- Early exit when constraints violated
- Cached span table lookups
- Optimized iteration patterns

**Memory Management**:
- Immutable data structures where possible
- Proper event listener cleanup
- Minimal DOM manipulations

### Best Practices

**API Usage**:
- Validate inputs before calling engine functions
- Handle error cases gracefully
- Use appropriate optimization goals
- Test with edge cases (very small/large decks)

**Performance**:
- Avoid frequent re-calculations
- Batch DOM updates
- Use development logging sparingly

---

This API provides comprehensive access to DeckPro's structural calculation capabilities with proper error handling and validation.