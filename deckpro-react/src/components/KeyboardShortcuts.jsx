import { useState, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './UI/dialog'

const shortcuts = [
  { key: 'S', description: 'Select tool' },
  { key: 'R', description: 'Rectangle tool' },
  { key: 'Escape', description: 'Cancel current action' },
  { key: 'Delete', description: 'Delete selected' },
  { key: 'Ctrl+Z', description: 'Undo', mac: 'Cmd+Z' },
  { key: 'Ctrl+Y', description: 'Redo', mac: 'Cmd+Y' },
  { key: 'Ctrl+S', description: 'Save', mac: 'Cmd+S' },
  { key: 'Ctrl+E', description: 'Export', mac: 'Cmd+E' },
  { key: 'G', description: 'Toggle grid' },
  { key: 'Shift+G', description: 'Toggle snap' },
  { key: '?', description: 'Show keyboard shortcuts' },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  // Keyboard shortcut to open dialog
  useHotkeys('?', () => setOpen(true))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-5 h-5 text-gray-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick actions to speed up your workflow
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex justify-between py-2 px-3 rounded hover:bg-gray-100">
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                {isMac && shortcut.mac ? shortcut.mac : shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}