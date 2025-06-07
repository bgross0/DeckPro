import { useState, useEffect } from 'react'
import useDeckStore from '../../store/deckStore'
import { cn } from '../../lib/utils'

export default function ViewportControls({ 
  stageScale, 
  onZoomIn, 
  onZoomOut, 
  onFitToContent,
  className 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const zoomPercentage = Math.round(stageScale * 100)
  
  return (
    <div className={cn("absolute", className)}>
      {/* Mobile: Expandable controls */}
      {isMobile ? (
        <div className="flex items-end gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg"
            title="View Controls"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="flex gap-2 animate-in slide-in-from-right">
              <button
                onClick={onZoomIn}
                className="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg"
                title="Zoom In"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={onZoomOut}
                className="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg"
                title="Zoom Out"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={onFitToContent}
                className="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg"
                title="Fit to Content"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        // Desktop: Always visible controls
        <div className="flex flex-col gap-2">
          <div className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded shadow text-center">
            {zoomPercentage}%
          </div>
          <button
            onClick={onZoomIn}
            className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded shadow"
            title="Zoom In (+)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={onZoomOut}
            className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded shadow"
            title="Zoom Out (-)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={onFitToContent}
            className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded shadow"
            title="Fit to Content (Ctrl+F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded shadow"
            title="Reset View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}