import { Toaster } from 'react-hot-toast'
import useDeckStore from './store/deckStore'
import { MainToolbar } from './components/Toolbar/MainToolbar'
import PolygonCanvas from './components/Canvas/PolygonCanvas'
import { Sidebar } from './components/Sidebar/Sidebar'
import { PriceBookModal } from './components/PriceBook/PriceBookModal'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAutoSave } from './hooks/useAutoSave'

function App() {
  const { generateStructure, loading } = useDeckStore()
  
  // Enable auto-save
  useAutoSave()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between z-50">
        <h1 className="text-xl font-semibold text-gray-900">DeckPro</h1>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex relative overflow-hidden">
        <MainToolbar />
        <PolygonCanvas />
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