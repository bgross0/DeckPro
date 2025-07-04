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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600">
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="h-20 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-2xl border-b border-slate-600/50 px-6 flex items-center justify-between z-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="flex items-center space-x-4 relative z-10">
          {/* Modern Logo */}
          <div className="relative">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg border border-gray-800">
              <span className="font-bold text-lg bg-gradient-to-br from-blue-400 via-teal-500 to-green-500 bg-clip-text text-transparent">D</span>
            </div>
          </div>
          
          {/* Enhanced Brand Text */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white leading-none tracking-tight">
              <span className="text-white">Deck</span>
              <span className="bg-gradient-to-br from-blue-400 via-teal-500 to-green-500 bg-clip-text text-transparent">Pro</span>
            </h1>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-sm text-slate-300 font-semibold">Professional Deck Design Suite</p>
              <div className="w-1 h-1 bg-gradient-to-r from-blue-400 to-green-500 rounded-full"></div>
              <span className="text-xs text-slate-400 font-medium">CAD Edition</span>
            </div>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center space-x-6 relative z-10">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">Connected</span>
            </div>
          </div>
          
          {/* Version Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-400/30">
            <svg className="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-bold text-orange-200">v2.0.1</span>
            <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
            <span className="text-xs text-orange-300/80">Beta</span>
          </div>
          
          {/* User Menu Placeholder */}
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl border border-slate-500/50 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
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
        <footer className="h-12 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-medium text-blue-600">1. Draw</span>
            </div>
            <span className="text-sm text-gray-400">→</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">2. Configure</span>
            </div>
            <span className="text-sm text-gray-400">→</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">3. Generate</span>
            </div>
            <span className="text-sm text-gray-400">→</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">4. Review</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center text-xs text-gray-400">
            <span>© 2024 DeckPro</span>
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