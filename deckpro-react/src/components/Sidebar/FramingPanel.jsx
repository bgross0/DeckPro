import useDeckStore from '../../store/deckStore'

export function FramingPanel() {
  const { project, selectedSectionId } = useDeckStore()
  
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const engineOut = selectedSection?.structure?.engineOut
  
  if (!engineOut) return null
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Framing Details</h3>
      
      {/* Joists */}
      {engineOut.joists && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Joist System</h4>
          <div className="text-sm space-y-1">
            <p>Size: {engineOut.joists.size}</p>
            <p>Spacing: {engineOut.joists.spacing_in}"</p>
            <p>Span: {engineOut.joists.span_ft.toFixed(1)}'</p>
            {engineOut.joists.cantilever_ft > 0 && (
              <p>Cantilever: {engineOut.joists.cantilever_ft.toFixed(1)}'</p>
            )}
            <p>Count: {engineOut.joists.count}</p>
          </div>
        </div>
      )}
      
      {/* Beams */}
      {engineOut.beams && engineOut.beams.map((beam, index) => (
        <div key={index} className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {beam.position.charAt(0).toUpperCase() + beam.position.slice(1)} Beam
          </h4>
          <div className="text-sm space-y-1">
            <p>Style: {beam.style}</p>
            {beam.size && <p>Size: {beam.size}</p>}
            {beam.post_spacing_ft && <p>Post Spacing: {beam.post_spacing_ft.toFixed(1)}'</p>}
            {beam.post_count && <p>Post Count: {beam.post_count}</p>}
          </div>
        </div>
      ))}
      
      {/* Posts */}
      {engineOut.posts && engineOut.posts.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Posts</h4>
          <div className="text-sm space-y-1">
            <p>Size: 6x6</p>
            <p>Count: {engineOut.posts.length}</p>
            <p>Footing: {engineOut.input?.footing_type}</p>
          </div>
        </div>
      )}
      
      {/* Compliance */}
      {engineOut.compliance && (
        <div className={`p-3 rounded-lg ${engineOut.compliance.passes ? 'bg-green-50' : 'bg-red-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${engineOut.compliance.passes ? 'text-green-700' : 'text-red-700'}`}>
            Code Compliance: {engineOut.compliance.passes ? 'PASSES' : 'FAILS'}
          </h4>
          {engineOut.compliance.warnings && engineOut.compliance.warnings.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {engineOut.compliance.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}