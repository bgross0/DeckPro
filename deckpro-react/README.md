# DeckPro React

A professional deck design and structural engineering application built with React, Vite, and Tailwind CSS. Features modern UI/UX design with a sleek gradient interface, optimized performance through lazy loading and code splitting, and comprehensive deck planning tools with real-time visualization using Konva.

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
- **Undo/Redo** - Full project history management (Ctrl+Z/Y) with 50-step history
- **Auto-Save** - Automatic project persistence to browser storage every 30 seconds
- **Project Management** - Save/load projects as JSON files
- **PWA Support** - Installable as a progressive web app with offline capabilities
- **Accessibility** - ARIA labels, keyboard navigation, skip links, and screen reader support
- **Responsive Design** - Fully mobile-optimized with touch controls and adaptive UI

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
- **Multi-Section Support** - Multiple deck sections with independent structures
- **Stair Management** - Integrated stair placement with attachment logic

### Canvas System
- **Konva Integration** - High-performance 2D canvas with hardware acceleration
- **Responsive Sizing** - Dynamic canvas sizing with ResizeObserver
- **Layer System** - Composable rendering layers with selective updates
- **Coordinate Transform** - World to screen mapping with grid snapping
- **Touch Support** - Multi-touch zoom and pan for mobile devices
- **Viewport Management** - Smooth zoom constraints and fit-to-content
- **Adaptive Grid** - Grid spacing adjusts with zoom level (6", 12", 16", 24")
- **Multi-Selection** - Select and manage multiple deck sections

### Engineering Engine
- **Modular Design** - Separate modules for joists, beams, posts
- **IRC Compliance** - Built-in span tables from IRC 2021
- **Optimization** - Cost and strength optimization algorithms

## Components

### UI Components
- **MainToolbar** - Tool selection with modern design (floating on mobile)
- **Sidebar** - Collapsible tabbed configuration panels with smooth transitions
- **ViewportControls** - Floating zoom and navigation controls
- **PriceBookModal** - Advanced price management with import/export (lazy loaded)
- **KeyboardShortcuts** - Interactive shortcut reference with visual display
- **ExportMenu** - PNG and report export options for selected sections
- **ErrorBoundary** - Graceful error handling and recovery
- **HelpModal** - Comprehensive help documentation
- **SettingsModal** - Project and application settings management

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
- **React 19.1** - Latest UI framework with Suspense and lazy loading
- **Vite 6.3** - Build tool with optimized production builds
- **Tailwind CSS 3.4** - Utility-first styling with custom design tokens
- **JavaScript** - ES6+ with modern syntax

### State & Data
- **Zustand 5.0** - Lightweight state management with hooks
- **React Hot Toast 2.5** - Toast notifications with custom styling
- **Local Storage** - Project and settings persistence with version control

### UI & Graphics
- **Konva 9.3** / **React-Konva 19.0** - 2D canvas library for high-performance rendering
- **Radix UI** - Headless accessible components (Dialog, Tabs, Tooltip, etc.)
- **Lucide React 0.511** - Feather-based icon library
- **React Hotkeys Hook 5.1** - Keyboard shortcut management

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
The development server runs on port 3000 by default.

### Build Production
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production with optimizations
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

## License

Private - All rights reserved