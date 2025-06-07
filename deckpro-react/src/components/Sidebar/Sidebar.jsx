import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Tabs from '@radix-ui/react-tabs'
import useDeckStore from '../../store/deckStore'
import { ConfigPanel } from './ConfigPanel'
import { FramingPanel } from './FramingPanel'
import { MaterialsPanel } from './MaterialsPanel'
import { EstimatesPanel } from './EstimatesPanel'

export function Sidebar() {
  const [open, setOpen] = useState(true)
  const { project, selectedSectionId } = useDeckStore()
  
  // Check if the selected section has a structure
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const hasStructure = selectedSection?.structure?.engineOut != null
  
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <aside className={`
        bg-white shadow-lg transition-all duration-300 flex flex-col
        ${open ? 'w-80' : 'w-12'}
      `}>
        {/* Collapse Toggle */}
        <div className="p-2 border-b border-gray-200">
          <Collapsible.Trigger className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded">
            <svg 
              className={`w-5 h-5 transition-transform ${open ? '' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Collapsible.Trigger>
        </div>
        
        <Collapsible.Content className="flex-1 overflow-hidden">
          <Tabs.Root defaultValue="config" className="h-full flex flex-col">
            {/* Tab List */}
            <Tabs.List className="flex border-b border-gray-200">
              <Tabs.Trigger 
                value="config" 
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
              >
                Config
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="framing"
                disabled={!hasStructure} 
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Framing
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="materials"
                disabled={!hasStructure}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Materials
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="estimates"
                disabled={!hasStructure}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Estimates
              </Tabs.Trigger>
            </Tabs.List>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs.Content value="config" className="p-4">
                <ConfigPanel />
              </Tabs.Content>
              
              <Tabs.Content value="framing" className="p-4">
                <FramingPanel />
              </Tabs.Content>
              
              <Tabs.Content value="materials" className="p-4">
                <MaterialsPanel />
              </Tabs.Content>
              
              <Tabs.Content value="estimates" className="p-4">
                <EstimatesPanel />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Collapsible.Content>
      </aside>
    </Collapsible.Root>
  )
}