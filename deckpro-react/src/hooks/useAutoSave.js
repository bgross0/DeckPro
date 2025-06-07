import { useEffect, useRef } from 'react'
import useDeckStore from '../store/deckStore'
import toast from 'react-hot-toast'

export function useAutoSave() {
  const { project, saveToLocalStorage } = useDeckStore()
  const lastSavedRef = useRef(JSON.stringify(project))
  const toastIdRef = useRef(null)
  
  useEffect(() => {
    const autoSaveEnabled = localStorage.getItem('deckpro-autosave') === 'true'
    if (!autoSaveEnabled) return
    
    const interval = parseInt(localStorage.getItem('deckpro-autosave-interval') || '300') * 1000
    
    const autoSave = () => {
      const currentProject = JSON.stringify(project)
      
      // Only save if there are changes
      if (currentProject !== lastSavedRef.current) {
        saveToLocalStorage()
        lastSavedRef.current = currentProject
        
        // Show a subtle notification
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }
        toastIdRef.current = toast.success('Auto-saved', {
          duration: 2000,
          position: 'bottom-right',
          style: {
            background: '#1f2937',
            color: '#fff',
            fontSize: '12px',
            padding: '8px 12px'
          }
        })
      }
    }
    
    const intervalId = setInterval(autoSave, interval)
    
    return () => {
      clearInterval(intervalId)
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [project, saveToLocalStorage])
}