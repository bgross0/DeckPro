import { Toaster } from 'react-hot-toast'
import useDeckStore from './store/deckStore'
import { FloatingToolbar } from './components/Toolbar/FloatingToolbar'
import { GridControls } from './components/Toolbar/GridControls'
import KonvaCanvas from './components/Canvas/KonvaCanvas'
import { Sidebar } from './components/Sidebar/Sidebar'
import { PriceBookModal } from './components/PriceBook/PriceBookModal'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { ExportMenu } from './components/ExportMenu'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const { generateStructure, loading } = useDeckStore()
  
  console.log('App rendering...')

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between z-50">
        <h1 className="text-xl font-semibold text-gray-900">DeckPro</h1>
        <div className="flex items-center gap-3">
          <ExportMenu />
          <button 
            onClick={generateStructure}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Structure'
            )}
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex relative overflow-hidden">
        <FloatingToolbar />
        <GridControls />
        
        <KonvaCanvas />
        <Sidebar />
      </main>
      
      {/* Workflow Bar */}
      <footer className="h-12 bg-white border-t border-gray-200 px-6 flex items-center">
        <div className="flex items-center space-x-6">
          <span className="text-sm font-medium text-blue-600">1. Draw</span>
          <span className="text-sm text-gray-400">→</span>
          <span className="text-sm text-gray-400">2. Configure</span>
          <span className="text-sm text-gray-400">→</span>
          <span className="text-sm text-gray-400">3. Generate</span>
          <span className="text-sm text-gray-400">→</span>
          <span className="text-sm text-gray-400">4. Review</span>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* Price Book Modal */}
      <PriceBookModal />
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App