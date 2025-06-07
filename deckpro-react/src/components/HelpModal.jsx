import { useState } from 'react'
import { X, Keyboard, MousePointer, Square, Ruler, ChevronUp, Info } from 'lucide-react'

export function HelpModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tools')
  
  if (!isOpen) return null
  
  const tabs = [
    { id: 'tools', label: 'Drawing Tools' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts' },
    { id: 'tips', label: 'Tips & Tricks' },
    { id: 'about', label: 'About' }
  ]
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Help & Documentation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'tools' && <ToolsHelp />}
          {activeTab === 'shortcuts' && <ShortcutsHelp />}
          {activeTab === 'tips' && <TipsHelp />}
          {activeTab === 'about' && <AboutHelp />}
        </div>
      </div>
    </div>
  )
}

function ToolsHelp() {
  const tools = [
    {
      icon: MousePointer,
      name: 'Select Tool',
      description: 'Click on deck sections to select them. View and edit properties in the sidebar.',
      usage: 'Click on any deck section or stair to select it.'
    },
    {
      icon: Square,
      name: 'Rectangle Tool',
      description: 'Draw rectangular deck sections quickly.',
      usage: 'Click and drag to create a rectangle. Release to complete.'
    },
    {
      icon: null,
      name: 'Polygon Tool',
      description: 'Draw custom-shaped deck sections with multiple points.',
      usage: 'Click to add points. Click near the first point or press Enter to close the shape.',
      tips: ['Hold Shift for 45° angle snapping (coming soon)', 'Press Esc to cancel']
    },
    {
      icon: ChevronUp,
      name: 'Stair Tool',
      description: 'Add stairs connecting deck sections or to ground.',
      usage: 'Click and drag from deck edge to destination. Stairs auto-calculate rise and run.',
      tips: ['Stairs automatically attach to the nearest deck edge', 'Configure riser height and tread depth in settings']
    },
    {
      icon: Ruler,
      name: 'Measure Tool',
      description: 'Measure distances between points.',
      usage: 'Click two points to measure the distance between them.'
    }
  ]
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Drawing Tools Guide</h3>
      
      {tools.map((tool, idx) => (
        <div key={idx} className="border-l-4 border-blue-500 pl-4 space-y-2">
          <div className="flex items-center gap-3">
            {tool.icon && <tool.icon className="w-5 h-5 text-gray-600" />}
            <h4 className="font-medium text-gray-900">{tool.name}</h4>
          </div>
          <p className="text-sm text-gray-600">{tool.description}</p>
          <p className="text-sm">
            <span className="font-medium">How to use:</span> {tool.usage}
          </p>
          {tool.tips && (
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {tool.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function ShortcutsHelp() {
  const shortcuts = [
    { category: 'Tools', items: [
      { keys: 'S', action: 'Select tool' },
      { keys: 'R', action: 'Rectangle tool' },
      { keys: 'D', action: 'Polygon/Deck section tool' },
      { keys: 'T', action: 'Stair tool' },
      { keys: 'M', action: 'Measure tool' }
    ]},
    { category: 'Canvas', items: [
      { keys: 'G', action: 'Toggle grid visibility' },
      { keys: 'Shift + G', action: 'Toggle grid snap' },
      { keys: 'Mouse Wheel', action: 'Zoom in/out' },
      { keys: 'Click + Drag', action: 'Pan canvas (with Select tool)' }
    ]},
    { category: 'Editing', items: [
      { keys: 'Ctrl/Cmd + Z', action: 'Undo' },
      { keys: 'Ctrl/Cmd + Y', action: 'Redo' },
      { keys: 'Delete', action: 'Clear canvas (with confirmation)' },
      { keys: 'Escape', action: 'Cancel current drawing' },
      { keys: 'Enter', action: 'Complete polygon (when drawing)' }
    ]},
    { category: 'Project', items: [
      { keys: 'Ctrl/Cmd + S', action: 'Save project (coming soon)' },
      { keys: 'Ctrl/Cmd + O', action: 'Open project (coming soon)' },
      { keys: 'Ctrl/Cmd + N', action: 'New project (coming soon)' }
    ]}
  ]
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
      
      {shortcuts.map(category => (
        <div key={category.category}>
          <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <table className="w-full text-sm">
              <tbody>
                {category.items.map((shortcut, idx) => (
                  <tr key={idx} className="border-b border-gray-200 last:border-0">
                    <td className="py-2 pr-4">
                      <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                        {shortcut.keys}
                      </kbd>
                    </td>
                    <td className="py-2 text-gray-700">{shortcut.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function TipsHelp() {
  const tips = [
    {
      title: 'Grid Snapping',
      content: 'Enable grid snap (Shift+G) for precise alignment. Adjust grid size in the toolbar for different levels of precision.'
    },
    {
      title: 'Layer Management',
      content: 'Use the layers dropdown to show/hide different elements like joists, beams, and decking. This helps visualize specific aspects of your design.'
    },
    {
      title: 'Cost Optimization',
      content: 'Configure material prices in the Price Book to get accurate cost estimates. The system automatically calculates optimal beam and joist sizing.'
    },
    {
      title: 'Building Codes',
      content: 'All structural calculations follow IRC 2021 building codes. Check the Framing panel for compliance warnings.'
    },
    {
      title: 'Stair Design',
      content: 'Stairs automatically calculate rise and run based on deck height. The system ensures code-compliant riser heights.'
    },
    {
      title: 'Multiple Sections',
      content: 'Create complex deck designs with multiple sections. Each section can have different elevations and connection types.'
    },
    {
      title: 'Save Your Work',
      content: 'Use the Save button to download your project as a file or save to browser storage for quick access.'
    }
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Tips & Tricks</h3>
      
      {tips.map((tip, idx) => (
        <div key={idx} className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">{tip.title}</h4>
          <p className="text-sm text-blue-800">{tip.content}</p>
        </div>
      ))}
    </div>
  )
}

function AboutHelp() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">About DeckPro</h3>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700">
          DeckPro is a professional deck design and estimation tool that helps contractors and homeowners
          create code-compliant deck designs with accurate material takeoffs and cost estimates.
        </p>
        
        <h4 className="font-medium mt-4">Key Features:</h4>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>IRC 2021 compliant structural calculations</li>
          <li>Automatic joist, beam, and post sizing</li>
          <li>Material takeoff with cost estimation</li>
          <li>Support for complex deck shapes and multiple levels</li>
          <li>Stair design with automatic rise/run calculations</li>
          <li>Export capabilities for sharing and documentation</li>
        </ul>
        
        <h4 className="font-medium mt-4">Technical Details:</h4>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Built with React and Konva for smooth canvas interaction</li>
          <li>Engineering calculations based on IRC span tables</li>
          <li>Supports SPF, Hem-Fir, and Southern Pine lumber species</li>
          <li>Automatic cantilever optimization for cost savings</li>
        </ul>
        
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> While DeckPro follows IRC 2021 guidelines, always consult with
            local building authorities and licensed professionals for final approval of your deck design.
          </p>
        </div>
      </div>
    </div>
  )
}