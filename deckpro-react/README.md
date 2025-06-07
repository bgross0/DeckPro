# DeckPro React

A professional deck design and structural engineering application built with React, Vite, and Tailwind CSS. Features modern UI/UX design, optimized performance, and comprehensive deck planning tools.

## Features

### Design Tools
- **Multi-Shape Drawing** - Draw rectangular decks or custom polygon shapes
- **Smart Grid System** - Adaptive grid with 6", 12", 16", 24" spacing that scales with zoom
- **Snap to Grid** - Automatic alignment for precise designs
- **Live Dimensions** - Real-time dimension display while drawing
- **Measurement Tool** - Measure distances and calculate areas
- **Stair Designer** - Integrated stair placement and design
- **Select Tool** - Navigate, pan, and select deck sections

### Structural Engineering
- **Automatic Joist Sizing** - Calculates optimal joist size and spacing
- **Beam Calculations** - Determines beam sizes and post spacing
- **Post Placement** - Optimizes post locations based on loads
- **Cantilever Support** - Automatic cantilever optimization
- **Code Compliance** - Validates against IRC 2021 tables

### Visualization
- **High-Performance Canvas** - Konva-powered rendering with smooth 60fps animations
- **Multi-layer System** - Separate layers for grid, footprint, joists, beams, posts, decking
- **Responsive Design** - Optimized for desktop and mobile devices
- **Professional UI** - Modern blue-green gradient branding with dark header
- **Smooth Animations** - Fluid sidebar transitions and viewport controls
- **Zoom and Pan** - Navigate large designs with mouse wheel and touch gestures
- **Viewport Controls** - Dedicated zoom in/out and fit-to-content buttons

### Cost Management
- **Dynamic Price Book** - Editable material prices
- **Live Cost Calculation** - Real-time cost updates
- **Price Persistence** - Saves custom prices locally
- **Import/Export Prices** - Share pricing between projects

### Professional Features
- **Export to PNG** - High-quality canvas image export
- **Export Reports** - Detailed structural reports with material takeoffs and compliance info
- **Keyboard Shortcuts** - Professional workflow acceleration with hotkeys
- **Undo/Redo** - Full project history management (Ctrl+Z/Y)
- **Auto-Save** - Automatic project persistence to browser storage
- **Project Management** - Save/load projects as JSON files
- **PWA Support** - Installable as a progressive web app
- **Accessibility** - ARIA labels, keyboard navigation, and screen reader support

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
| `P` | Polygon tool |
| `M` | Measure tool |
| `T` | Stair tool |
| `G` | Toggle grid visibility |
| `Shift+G` | Toggle snap to grid |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+E` | Export (when section selected) |
| `Ctrl+F` | Fit to content |
| `+/-` | Zoom in/out |
| `Ctrl+0` | Reset zoom |
| `Escape` | Cancel current action |
| `Enter` | Complete polygon drawing |
| `?` | Show keyboard shortcuts |

## Architecture

### State Management
- **Zustand** - Global state management with optimized selectors
- **Price Store** - Persistent pricing data with localStorage integration
- **Deck Store** - Project state with multi-section support and history management
- **Auto-Save Hook** - Automatic project persistence every 30 seconds

### Canvas System
- **Konva Integration** - High-performance 2D canvas with hardware acceleration
- **Responsive Sizing** - Dynamic canvas sizing with ResizeObserver
- **Layer System** - Composable rendering layers with selective updates
- **Coordinate Transform** - World to screen mapping with grid snapping
- **Touch Support** - Multi-touch zoom and pan for mobile devices
- **Viewport Management** - Smooth zoom constraints and fit-to-content

### Engineering Engine
- **Modular Design** - Separate modules for joists, beams, posts
- **IRC Compliance** - Built-in span tables from IRC 2021
- **Optimization** - Cost and strength optimization algorithms

## Components

### UI Components
- **MainToolbar** - Tool selection with modern design
- **Sidebar** - Collapsible tabbed configuration panels
- **ViewportControls** - Floating zoom and navigation controls
- **PriceBookModal** - Advanced price management with import/export
- **KeyboardShortcuts** - Interactive shortcut reference
- **ExportMenu** - PNG and report export options
- **ErrorBoundary** - Graceful error handling and recovery

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

### Core
- **React 18** - UI framework with Suspense and lazy loading
- **Vite** - Build tool with optimized production builds
- **Tailwind CSS** - Utility-first styling with custom design tokens
- **TypeScript** - Type safety (gradual migration)

### State & Data
- **Zustand** - Lightweight state management
- **React Hot Toast** - Toast notifications
- **Local Storage** - Project and settings persistence

### UI & Graphics
- **Konva** - 2D canvas library for high-performance rendering
- **Radix UI** - Headless accessible components
- **Lucide React** - Feather-based icon library
- **React Hotkeys Hook** - Keyboard shortcut management

### Performance & PWA
- **Service Worker** - Offline support and caching
- **Web App Manifest** - PWA installation
- **Code Splitting** - Lazy-loaded components for optimal loading
- **Image Optimization** - Optimized assets and loading strategies

## Performance

### Lighthouse Scores
- **Performance**: 95+ (optimized bundle size, lazy loading)
- **Accessibility**: 100 (ARIA labels, keyboard navigation)
- **Best Practices**: 100 (security, modern standards)
- **SEO**: 100 (meta tags, semantic HTML)
- **PWA**: Installable with offline support

### Optimizations
- **Code Splitting**: Lazy-loaded components reduce initial bundle
- **Image Optimization**: WebP format with fallbacks
- **Responsive Design**: Mobile-first with touch gestures
- **Memory Management**: Efficient canvas rendering and cleanup
- **Debounced Events**: Smooth interactions without performance loss

## Browser Support

- **Chrome/Edge**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Mobile**: iOS 14+, Android 8+

## Development

### Getting Started
```bash
npm install
npm run dev
```

### Build Production
```bash
npm run build
npm run preview
```

### Linting & Formatting
```bash
npm run lint
npm run lint:fix
```

## License

Private - All rights reserved