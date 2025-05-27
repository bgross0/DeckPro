# DeckPro React

A professional deck design and structural engineering application built with React, Vite, and Tailwind CSS.

## Features

### Design Tools
- **Rectangle Drawing Tool** - Draw deck footprints with mouse
- **Grid System** - Configurable grid with 6", 12", 16", 24" spacing
- **Snap to Grid** - Automatic alignment for precise designs
- **Live Dimensions** - Real-time dimension display while drawing
- **Measurement Tool** - Measure distances on the canvas

### Structural Engineering
- **Automatic Joist Sizing** - Calculates optimal joist size and spacing
- **Beam Calculations** - Determines beam sizes and post spacing
- **Post Placement** - Optimizes post locations based on loads
- **Cantilever Support** - Automatic cantilever optimization
- **Code Compliance** - Validates against IRC 2021 tables

### Visualization
- **Multi-layer Canvas** - Separate layers for grid, footprint, joists, beams, posts
- **Deck Board Rendering** - Visual representation of decking
- **Dimension Annotations** - Professional dimension lines and labels
- **Zoom and Pan** - Navigate large designs easily

### Cost Management
- **Dynamic Price Book** - Editable material prices
- **Live Cost Calculation** - Real-time cost updates
- **Price Persistence** - Saves custom prices locally
- **Import/Export Prices** - Share pricing between projects

### Professional Features
- **Export to PNG** - High-quality image export
- **Export Reports** - Detailed text reports with material lists
- **Keyboard Shortcuts** - Professional workflow acceleration
- **Undo/Redo** - Full history management (Ctrl+Z/Y)
- **Material Takeoff** - Complete bill of materials

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Select tool |
| `R` | Rectangle tool |
| `G` | Toggle grid visibility |
| `Shift+G` | Toggle snap to grid |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+E` | Export |
| `Escape` | Cancel current action |
| `?` | Show keyboard shortcuts |

## Architecture

### State Management
- **Zustand** - Global state management
- **Price Store** - Persistent pricing data
- **Deck Store** - Drawing and configuration state

### Canvas System
- **DrawingSurface** - Main canvas controller
- **Layer System** - Composable rendering layers
- **Coordinate Transform** - World to screen mapping

### Engineering Engine
- **Modular Design** - Separate modules for joists, beams, posts
- **IRC Compliance** - Built-in span tables from IRC 2021
- **Optimization** - Cost and strength optimization algorithms

## Components

### UI Components
- **FloatingToolbar** - Tool selection
- **GridControls** - Grid configuration
- **Sidebar** - Configuration panels
- **PriceBookModal** - Price management
- **KeyboardShortcuts** - Shortcut reference
- **ExportMenu** - Export options

### Canvas Layers
- **GridLayer** - Background grid
- **FootprintLayer** - Deck outline drawing
- **JoistLayer** - Joist visualization
- **BeamLayer** - Beam and post rendering
- **DeckingLayer** - Deck board visualization
- **DimensionLayer** - Dimension annotations

## Configuration Options

### Deck Parameters
- Width and Length (feet)
- Height (1-30 feet)
- Attachment (ledger/freestanding)
- Species/Grade (SPF, SYP, HF, etc.)
- Footing Type (helical/concrete/surface)
- Decking Type (various composites and wood)

### Optimization Goals
- **Cost** - Minimize material cost
- **Strength** - Maximize reserve capacity

## Material Support

### Lumber Species
- SPF (Spruce-Pine-Fir) #2
- SYP (Southern Yellow Pine) #2
- HF (Hem-Fir) #2
- DFL (Douglas Fir-Larch) #2
- SPF Select Structural
- SYP Select Structural
- HF Select Structural
- DFL Select Structural

### Decking Options
- 5/4" Wood Perpendicular
- 2" Wood Perpendicular
- Composite 1" Perpendicular
- Composite 1" Diagonal
- And more...

## Technical Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Radix UI** - Headless components
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## License

Private - All rights reserved