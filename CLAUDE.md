# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeckPro is a professional deck design application with two implementations:
- **Legacy** (`/src`): Vanilla JavaScript implementation (original)
- **Modern** (`/deckpro-react`): React/Vite implementation with Konva canvas (active development)

The React version (`deckpro-react/`) is the primary codebase for all new development.

## Development Commands

### React Application (deckpro-react/)
```bash
cd deckpro-react
npm install              # Install dependencies
npm run dev              # Start dev server on port 3000
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

## Architecture

### State Management (Zustand)
- **deckStore.js** - Main application state including project data, drawing state, UI state, and history management
- **priceStore.js** - Material pricing data with localStorage persistence

The store manages:
- Multi-section deck projects with independent structures
- Polygon-based deck sections (custom shapes + rectangles)
- Stair placement and attachment logic
- Undo/redo history (50 steps)
- Auto-save to localStorage every 30 seconds

### Core Engine (`/deckpro-react/src/engine/`)

The structural calculation engine is **shared between both implementations** and implements IRC 2021 code compliance:

- **index.js** - Main API: `computeStructure(payload)` returns structural design
- **joist.js** - Joist size/spacing selection from IRC R507.6 span tables
- **beam.js** - Beam sizing and post spacing from IRC R507.5 tables
- **post.js** - Post positioning under beams (critical: posts at `deckWidth - cantilever`)
- **cantilever-optimizer.js** - Optimizes cantilever within IRC 1/4 rule
- **materials.js** - Material takeoff generation with quantities
- **validation.js** - Input validation and hardware compliance checks
- **utils.js** - Shared calculation utilities

**Critical Implementation Details:**
- Joists always span the shorter dimension
- Beam selection uses back-span (not full width) for IRC table lookup
- Posts must be positioned under beams at `deckWidth - cantilever`
- Cantilever must be ≤ 1/4 × back-span per IRC

### Geometry Generation (`/deckpro-react/src/utils/`)

Three geometry systems handle different polygon types:

- **ircCompliantGeometry.js** - Main geometry generator for arbitrary polygons
  - Projects IRC-compliant structures onto custom polygon shapes
  - Handles line-polygon intersections and clipping
  - Used for freeform deck sections

- **polygonStructureGeometry.js** - Simplified polygon geometry
  - Faster for simple cases
  - Limited to basic polygon operations

- **structureGeometry.js** - Legacy rectangular geometry
  - Original implementation for rectangular decks
  - Maintains backward compatibility

Choose geometry system based on polygon complexity and performance needs.

### Canvas System (Konva)

**Layer Architecture:**
- GridLayer - Background grid with adaptive spacing (6", 12", 16", 24")
- FootprintLayer - Deck outline and polygon drawing
- JoistLayer - Joist visualization with correct orientation
- BeamLayer - Beam and post rendering
- DeckingLayer - Deck board visualization
- DimensionLayer - Real-time dimension annotations

**Coordinate System:**
- World coordinates are in feet
- Grid snapping based on `gridCfg.spacing_in`
- Viewport transformations in `src/utils/viewport.js`

**Main Canvas Components:**
- **PolygonCanvas.jsx** - Primary canvas with multi-section support
- **KonvaCanvas.jsx** - Original Konva implementation (legacy)
- **DeckCanvas.jsx** - Legacy canvas (deprecated)

### Project Data Model (`/deckpro-react/src/models/deckProject.js`)

```javascript
DeckProject {
  sections: DeckSection[]  // Multiple deck sections
  stairs: Stair[]          // Attached stairs
  settings: {              // Global project settings
    species, deckingType, footingType, optimizationGoal, etc.
  }
}

DeckSection {
  polygon: {x, y}[]       // Custom polygon points in feet
  elevation: number       // Height in inches
  connection: {           // How section attaches
    type: 'ledger' | 'freestanding'
  }
  structure: {            // Generated IRC-compliant structure
    engineOut,            // Result from computeStructure()
    geometry              // Drawable geometry
  }
}
```

## Code Quality Requirements

### TypeScript Usage
- **NEVER use `as any` type casts** - this is strictly prohibited per user's global .claude/CLAUDE.md
- Use proper type definitions or inference instead

### File Creation
- **ALWAYS prefer editing existing files** over creating new ones
- Do not create documentation files (*.md) unless explicitly requested
- Do not create README files proactively

### Component Patterns
- Lazy load heavy components (PriceBookModal, PolygonCanvas)
- Use Suspense boundaries for code splitting
- Implement ErrorBoundary for graceful degradation
- Extract reusable logic into custom hooks

## Common Development Tasks

### Adding New Material Types
1. Update `src/data/materials.js` with pricing
2. Add to span tables in `src/data/span-tables.js`
3. Update validation in `src/engine/validation.js`

### Modifying Structure Generation
1. Engine calculations in `/src/engine/`
2. Geometry projection in `/src/utils/*Geometry.js`
3. Canvas rendering in layer components
4. Test with verification scripts in `/tests/verification/`

### Adding UI Features
1. Update deckStore for state management
2. Create/modify components in `/src/components/`
3. Add keyboard shortcuts in KeyboardShortcuts.jsx
4. Ensure mobile responsiveness (touch support)

## Important Constraints

### IRC 2021 Compliance
All structural calculations MUST follow IRC 2021 tables:
- Joist spans: IRC R507.6(1)
- Beam spans: IRC R507.5(1)
- Cantilever rule: ≤ 1/4 back-span
- Load assumptions: 40 psf live + 10 psf dead

### Performance Requirements
- Canvas rendering at 60fps
- Lazy loading for components >50KB
- Auto-save throttled to 30-second intervals
- Debounce expensive calculations

### Browser Support
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile: iOS 14+, Android 8+

## Keyboard Shortcuts
- `S` - Select tool
- `R` - Rectangle tool
- `P` - Polygon tool
- `M` - Measure tool
- `T` - Stair tool
- `G` - Toggle grid
- `Shift+G` - Toggle snap to grid
- `Ctrl+Z/Y` - Undo/Redo
- `Escape` - Cancel current action
- `Enter` - Complete polygon

## Data Persistence
- Projects saved to localStorage every 30 seconds via `useAutoSave` hook
- Custom material prices persist in `priceStore`
- Manual save/load via JSON file export/import
- Project version: "1.0" for compatibility checking

## Deployment
- Primary: Cloudflare Pages
- Build command: `cd deckpro-react && npm run build`
- Output: `deckpro-react/dist`
- Vite config handles React deduplication for Univer compatibility
