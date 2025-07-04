import { useState } from 'react'
import { Download, FileImage, FileText } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import useDeckStore from '../store/deckStore'
import toast from 'react-hot-toast'

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { project, selectedSectionId } = useDeckStore()
  
  // Get the selected section's data
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const footprint = selectedSection?.polygon || null
  const engineOut = selectedSection?.structure?.engineOut || null

  useHotkeys('ctrl+e, cmd+e', () => {
    if (footprint && engineOut) {
      exportAsPNG()
    }
  })

  const exportAsPNG = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      toast.error('No canvas found')
      return
    }

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `deck-design-${new Date().toISOString().split('T')[0]}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported as PNG')
    })
  }

  const exportAsPDF = async () => {
    if (!footprint || !engineOut) {
      toast.error('No deck design to export')
      return
    }

    // Create a simple text-based report
    const report = generateReport(footprint, engineOut)
    
    // Convert to blob and download
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deck-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported report')
  }

  const generateReport = (footprint, engineOut) => {
    const date = new Date().toLocaleDateString()
    
    // Calculate polygon area using shoelace formula
    let area = 0
    if (footprint && footprint.length >= 3) {
      for (let i = 0; i < footprint.length; i++) {
        const j = (i + 1) % footprint.length
        area += footprint[i].x * footprint[j].y
        area -= footprint[j].x * footprint[i].y
      }
      area = Math.abs(area) / 2
    }
    
    // Calculate bounds
    const bounds = footprint ? {
      minX: Math.min(...footprint.map(p => p.x)),
      maxX: Math.max(...footprint.map(p => p.x)),
      minY: Math.min(...footprint.map(p => p.y)),
      maxY: Math.max(...footprint.map(p => p.y))
    } : { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    
    const width = bounds.maxX - bounds.minX
    const length = bounds.maxY - bounds.minY
    
    const report = `
DECK DESIGN REPORT
Generated: ${date}

DECK DIMENSIONS
===============
Width: ${width.toFixed(1)}' 
Length: ${length.toFixed(1)}'
Total Area: ${area.toFixed(0)} sq ft

STRUCTURAL SPECIFICATIONS
========================
Height: ${engineOut.input.height_ft}'
Attachment: ${engineOut.input.attachment}
Species/Grade: ${engineOut.input.species_grade}
Footing Type: ${engineOut.input.footing_type}

FRAMING
=======
Joists: ${engineOut.joists.size} @ ${engineOut.joists.spacing_in}" O.C.
Joist Span: ${engineOut.joists.span_ft}'
${engineOut.joists.cantilever_ft > 0 ? `Cantilever: ${engineOut.joists.cantilever_ft}'` : ''}

BEAMS
=====
${engineOut.beams.map(beam => 
  `${beam.position} beam: ${beam.size || 'Ledger'} ${beam.post_spacing_ft ? `(posts @ ${beam.post_spacing_ft}' O.C.)` : ''}`
).join('\n')}

POSTS
=====
Total Posts: ${engineOut.posts.length}
Post Locations:
${engineOut.posts.map((post, i) => `  Post ${i+1}: ${post.x}', ${post.y}'`).join('\n')}

MATERIAL TAKEOFF
================
${engineOut.material_takeoff.map(item => 
  `${item.item}: ${item.qty}${item.totalCost ? ` ($${item.totalCost.toFixed(2)})` : ''}`
).join('\n')}

COMPLIANCE
==========
Status: ${engineOut.compliance.passes ? 'PASSES' : 'WARNINGS'}
${engineOut.compliance.warnings.length > 0 ? 
  '\nWarnings:\n' + engineOut.compliance.warnings.map(w => `- ${w}`).join('\n') : ''}

Tables Referenced:
- ${engineOut.compliance.joist_table}
- ${engineOut.compliance.beam_table}
`
    return report
  }

  if (!footprint || !engineOut) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={() => {
                exportAsPNG()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
            >
              <FileImage className="w-4 h-4" />
              Export as PNG
            </button>
            <button
              onClick={() => {
                exportAsPDF()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
            >
              <FileText className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </>
      )}
    </div>
  )
}