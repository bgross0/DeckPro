import { useState, useEffect } from 'react'
import { Ruler } from 'lucide-react'

export function MeasurementTool() {
  const [isActive, setIsActive] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [endPoint, setEndPoint] = useState(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      setStartPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setEndPoint(null)
      setDistance(0)
    }

    const handleMouseMove = (e) => {
      if (!startPoint) return
      
      const rect = canvas.getBoundingClientRect()
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      setEndPoint(currentPoint)

      // Calculate distance in pixels
      const dx = currentPoint.x - startPoint.x
      const dy = currentPoint.y - startPoint.y
      const pixelDistance = Math.sqrt(dx * dx + dy * dy)
      
      // Convert to feet (assuming 20 pixels per foot)
      const feetDistance = pixelDistance / 20
      setDistance(feetDistance)
    }

    const handleMouseUp = () => {
      if (startPoint && endPoint) {
        // Measurement complete
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isActive, startPoint, endPoint])

  return (
    <>
      <button
        onClick={() => setIsActive(!isActive)}
        className={`tool-button ${isActive ? 'active' : ''}`}
        title="Measure distance"
      >
        <Ruler className="w-5 h-5" />
      </button>

      {isActive && distance > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Distance: {distance.toFixed(1)}'
        </div>
      )}

      {isActive && startPoint && endPoint && (
        <svg 
          className="fixed inset-0 pointer-events-none z-40" 
          style={{ width: '100%', height: '100%' }}
        >
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="red"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <circle cx={startPoint.x} cy={startPoint.y} r="4" fill="red" />
          <circle cx={endPoint.x} cy={endPoint.y} r="4" fill="red" />
        </svg>
      )}
    </>
  )
}