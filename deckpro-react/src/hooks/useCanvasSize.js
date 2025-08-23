import { useState, useEffect, useCallback } from 'react'
import { debounce } from '../lib/utils'

export function useCanvasSize(containerRef) {
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
    devicePixelRatio: window.devicePixelRatio || 1
  })
  
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    setDimensions({
      width: rect.width,
      height: rect.height,
      devicePixelRatio: dpr
    })
  }, [containerRef])
  
  // Immediate resize handler for critical updates
  const handleImmediateResize = useCallback(() => {
    updateDimensions()
  }, [updateDimensions])
  
  // Debounced resize handler to prevent excessive updates
  const handleResize = useCallback(
    debounce(() => {
      updateDimensions()
    }, 100),
    [updateDimensions]
  )
  
  useEffect(() => {
    // Initial size
    updateDimensions()
    
    // Listen for resize events (debounced to reduce churn)
    window.addEventListener('resize', handleResize)
    
    // Also listen for device pixel ratio changes (e.g., moving between monitors)
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    mediaQuery.addEventListener('change', updateDimensions)
    
    // ResizeObserver for container size changes
    let resizeObserver
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleImmediateResize)
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', updateDimensions)
      handleResize.cancel()
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [handleResize, handleImmediateResize, updateDimensions, containerRef])
  
  return dimensions
}
