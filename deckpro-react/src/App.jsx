import { Toaster } from 'react-hot-toast'
import useDeckStore from './store/deckStore'
import { MainToolbar } from './components/Toolbar/MainToolbar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAutoSave } from './hooks/useAutoSave'
import { useEffect, useState, lazy, Suspense } from 'react'

// Lazy load heavy components
const PolygonCanvas = lazy(() => import('./components/Canvas/PolygonCanvas'))
const PriceBookModal = lazy(() => import('./components/PriceBook/PriceBookModal').then(module => ({ default: module.PriceBookModal })))

function App() {
  const { generateStructure, loading, sidebarOpen } = useDeckStore()
  const [isMobile, setIsMobile] = useState(false)
  
  // Enable auto-save
  useAutoSave()
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600">
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between z-50">
        <h1 className="text-xl font-semibold text-gray-900">DeckPro</h1>
      </header>
      
      {/* Main Content */}
      <main id="main-content" className={`flex-1 relative ${isMobile ? 'flex-col' : ''}`}>
        {!isMobile && <MainToolbar />}
        <div className={`
          absolute inset-0 overflow-hidden
          transition-[right] duration-150 ease-out
          ${!isMobile && sidebarOpen ? 'right-80' : !isMobile ? 'right-12' : 'right-0'}
        `}>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <PolygonCanvas />
            </Suspense>
          </ErrorBoundary>
          {isMobile && (
            <div className="absolute top-4 left-4 z-20">
              <MainToolbar />
            </div>
          )}
        </div>
        <Sidebar />
      </main>
      
      {/* Workflow Bar - Hide on mobile */}
      {!isMobile && (
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
      )}
      
      {/* Toast Notifications - Adjust position for mobile */}
      <Toaster 
        position={isMobile ? "top-center" : "bottom-right"}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            ...(isMobile && { fontSize: '14px', padding: '8px 12px' })
          },
        }}
      />
      
      {/* Price Book Modal */}
      <Suspense fallback={null}>
        <PriceBookModal />
      </Suspense>
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  )
}

export default App