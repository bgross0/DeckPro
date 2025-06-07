import { useEffect, useRef } from 'react'
import useDeckStore from '../../store/deckStore'
import { DrawingSurface } from './DrawingSurface'
import { GridLayer } from './layers/GridLayer'
import { FootprintLayer } from './layers/FootprintLayer'
import { JoistLayer } from './layers/JoistLayer'
import { BeamLayer } from './layers/BeamLayer'
import { DimensionLayer } from './layers/DimensionLayer'
import { DeckingLayer } from './layers/DeckingLayer'
import { CostDisplay } from '../CostDisplay'

export function DeckCanvas() {
  const canvasRef = useRef(null)
  const surfaceRef = useRef(null)
  const layersRef = useRef({})
  
  const { 
    footprint, 
    tool, 
    gridCfg, 
    engineOut,
    setFootprint 
  } = useDeckStore()
  
  // Initialize canvas and layers
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Create drawing surface
    const surface = new DrawingSurface(canvasRef.current, {
      pixelsPerFoot: 20
    })
    surfaceRef.current = surface
    
    // Create layers
    const gridLayer = new GridLayer({
      spacing_in: gridCfg.spacing_in,
      snap: gridCfg.snap,
      visible: gridCfg.visible
    })
    
    const footprintLayer = new FootprintLayer()
    const joistLayer = new JoistLayer()
    const beamLayer = new BeamLayer()
    const deckingLayer = new DeckingLayer()
    const dimensionLayer = new DimensionLayer()
    
    // Store layer references
    layersRef.current = {
      grid: gridLayer,
      footprint: footprintLayer,
      joist: joistLayer,
      beam: beamLayer,
      decking: deckingLayer,
      dimension: dimensionLayer
    }
    
    // Add layers to surface
    surface.addLayer(gridLayer)
    surface.addLayer(footprintLayer)
    surface.addLayer(joistLayer)
    surface.addLayer(beamLayer)
    surface.addLayer(deckingLayer)
    surface.addLayer(dimensionLayer)
    
    // Set initial tool
    footprintLayer.setTool(tool)
    
    // Set up footprint change listener
    footprintLayer.onFootprintChange = (newFootprint) => {
      setFootprint(newFootprint)
    }
    
    // Initial render
    surface.draw()
    
    // Handle canvas resize
    const resizeObserver = new ResizeObserver(() => {
      if (surfaceRef.current) {
        surfaceRef.current.setupCanvas();
        surfaceRef.current.draw();
      }
    });
    
    resizeObserver.observe(canvasRef.current);
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
      // TODO: Add proper cleanup for layers
    }
  }, [])
  
  // Update tool when it changes
  useEffect(() => {
    if (layersRef.current.footprint) {
      layersRef.current.footprint.setTool(tool)
    }
  }, [tool])
  
  // Update footprint in all layers when it changes
  useEffect(() => {
    if (footprint && surfaceRef.current) {
      // Update footprint in all layers
      Object.values(layersRef.current).forEach(layer => {
        if (layer.setFootprint) {
          layer.setFootprint(footprint)
        }
      })
      surfaceRef.current.draw()
    }
  }, [footprint])
  
  // Update grid config
  useEffect(() => {
    if (layersRef.current.grid) {
      layersRef.current.grid.setSpacing(gridCfg.spacing_in)
      layersRef.current.grid.setSnap(gridCfg.snap)
      layersRef.current.grid.visible = gridCfg.visible
      surfaceRef.current?.draw()
    }
  }, [gridCfg])
  
  // Update structure visualization when engine output changes
  useEffect(() => {
    if (engineOut && surfaceRef.current && footprint) {
      // Update layer data
      if (layersRef.current.joist) {
        layersRef.current.joist.setFootprint(footprint)
        layersRef.current.joist.setJoists(engineOut.joists)
      }
      if (layersRef.current.beam) {
        layersRef.current.beam.setFootprint(footprint)
        layersRef.current.beam.setBeams(engineOut.beams)
        layersRef.current.beam.setPosts(engineOut.posts)
        if (engineOut.joists) {
          layersRef.current.beam.setCantilever(engineOut.joists.cantilever_ft)
          layersRef.current.beam.setJoistOrientation(engineOut.joists.orientation)
        }
      }
      if (layersRef.current.decking) {
        layersRef.current.decking.setFootprint(footprint)
      }
      if (layersRef.current.dimension) {
        layersRef.current.dimension.setFootprint(footprint)
        layersRef.current.dimension.setEngineOutput(engineOut)
      }
      
      surfaceRef.current.draw()
    }
  }, [engineOut, footprint])
  
  return (
    <div className="flex-1 relative bg-gray-100">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ display: 'block' }}
      />
      
      {/* Floating dimension display */}
      {footprint && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
          <span className="text-sm text-gray-600">Dimensions:</span>
          <span className="ml-2 font-semibold">
            {footprint.width_ft}' × {footprint.length_ft}'
          </span>
        </div>
      )}
      
      {/* Drawing hints */}
      {!footprint && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-lg text-gray-400">Click and drag to draw deck footprint</p>
          <p className="text-sm text-gray-400 mt-2">Use the rectangle tool to get started</p>
        </div>
      )}
      
      {/* Cost Display */}
      <CostDisplay />
    </div>
  )
}