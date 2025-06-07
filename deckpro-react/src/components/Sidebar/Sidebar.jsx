import { useState, useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import useDeckStore from '../../store/deckStore'
import { ConfigPanel } from './ConfigPanel'
import { FramingPanel } from './FramingPanel'
import { MaterialsPanel } from './MaterialsPanel'
import { EstimatesPanel } from './EstimatesPanel'

export function Sidebar() {
  const { project, selectedSectionId, sidebarOpen, setSidebarOpen } = useDeckStore()
  const [isMobile, setIsMobile] = useState(false)
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-collapse on mobile when switching from desktop
      if (mobile && !isMobile && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobile, sidebarOpen, setSidebarOpen])
  
  // Trigger canvas resize when sidebar state changes
  useEffect(() => {
    // Trigger resize immediately when state changes
    window.dispatchEvent(new Event('resize'))
    
    // Single mid-transition update
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [sidebarOpen])
  
  // Check if the selected section has a structure
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const hasStructure = selectedSection?.structure?.engineOut != null
  
  if (isMobile) {
    return (
      <>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <aside className={`
          fixed right-0 top-0 h-full z-30 w-full max-w-sm
          bg-white shadow-lg transition-transform duration-300 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Mobile Toggle */}
          <div className="p-2 border-b border-gray-200 flex-shrink-0">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs.Root defaultValue="config" className="h-full flex flex-col">
              <Tabs.List className="flex border-b border-gray-200 flex-shrink-0">
                <Tabs.Trigger value="config" className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
                  Config
                </Tabs.Trigger>
                <Tabs.Trigger value="framing" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                  Framing
                </Tabs.Trigger>
                <Tabs.Trigger value="materials" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                  Materials
                </Tabs.Trigger>
                <Tabs.Trigger value="estimates" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                  Estimates
                </Tabs.Trigger>
              </Tabs.List>
              
              <div className="flex-1 overflow-y-auto">
                <Tabs.Content value="config" className="p-4"><ConfigPanel /></Tabs.Content>
                <Tabs.Content value="framing" className="p-4"><FramingPanel /></Tabs.Content>
                <Tabs.Content value="materials" className="p-4"><MaterialsPanel /></Tabs.Content>
                <Tabs.Content value="estimates" className="p-4"><EstimatesPanel /></Tabs.Content>
              </div>
            </Tabs.Root>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside className={`
      absolute right-0 top-0 bottom-0 bg-white shadow-lg flex flex-col z-20
      transition-[width] duration-150 ease-out
      ${sidebarOpen ? 'w-80' : 'w-12'}
    `}>
      {/* Desktop Toggle */}
      <div className="p-2 border-b border-gray-200 flex-shrink-0">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Desktop Content */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        transition-opacity duration-100 ease-out
        ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {sidebarOpen && (
          <Tabs.Root defaultValue="config" className="h-full flex flex-col">
            <Tabs.List className="flex border-b border-gray-200 flex-shrink-0">
              <Tabs.Trigger value="config" className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
                Config
              </Tabs.Trigger>
              <Tabs.Trigger value="framing" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                Framing
              </Tabs.Trigger>
              <Tabs.Trigger value="materials" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                Materials
              </Tabs.Trigger>
              <Tabs.Trigger value="estimates" disabled={!hasStructure} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50">
                Estimates
              </Tabs.Trigger>
            </Tabs.List>
            
            <div className="flex-1 overflow-y-auto">
              <Tabs.Content value="config" className="p-4"><ConfigPanel /></Tabs.Content>
              <Tabs.Content value="framing" className="p-4"><FramingPanel /></Tabs.Content>
              <Tabs.Content value="materials" className="p-4"><MaterialsPanel /></Tabs.Content>
              <Tabs.Content value="estimates" className="p-4"><EstimatesPanel /></Tabs.Content>
            </div>
          </Tabs.Root>
        )}
      </div>
    </aside>
  )
}