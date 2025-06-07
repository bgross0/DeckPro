import { useState, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import toast from 'react-hot-toast'

export function useHistory(initialState) {
  const [history, setHistory] = useState([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const pushState = useCallback((newState) => {
    setHistory(prev => {
      // Remove any states after current index
      const newHistory = prev.slice(0, currentIndex + 1)
      // Add new state
      newHistory.push(newState)
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift()
      }
      return newHistory
    })
    setCurrentIndex(prev => Math.min(prev + 1, 49))
  }, [currentIndex])

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1)
      toast.success('Undo')
    }
  }, [canUndo])

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1)
      toast.success('Redo')
    }
  }, [canRedo])

  // Keyboard shortcuts
  useHotkeys('ctrl+z, cmd+z', undo, [undo])
  useHotkeys('ctrl+y, cmd+y', redo, [redo])

  const currentState = history[currentIndex]

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  }
}