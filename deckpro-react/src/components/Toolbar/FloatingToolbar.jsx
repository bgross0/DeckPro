import useDeckStore from '../../store/deckStore'
import { useHotkeys } from 'react-hotkeys-hook'
import { MeasurementTool } from '../MeasurementTool'

export function FloatingToolbar() {
  const { tool, setTool } = useDeckStore()
  
  // Keyboard shortcuts
  useHotkeys('s', () => setTool('select'))
  useHotkeys('r', () => setTool('rectangle'))
  useHotkeys('escape', () => setTool('select'))
  
  return (
    <div className="absolute left-4 top-4 z-20 bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1">
      <button 
        className={`tool-button ${tool === 'select' ? 'active' : ''}`}
        onClick={() => setTool('select')}
        title="Select (S)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
        </svg>
      </button>
      
      <button 
        className={`tool-button ${tool === 'rectangle' ? 'active' : ''}`}
        onClick={() => setTool('rectangle')}
        title="Rectangle (R)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
        </svg>
      </button>
      
      <div className="h-px bg-gray-300 my-1" />
      
      <MeasurementTool />
    </div>
  )
}