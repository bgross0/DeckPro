import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva';
import useDeckStore from '../../store/deckStore';
import { logger } from '../../utils/logger';

const PIXELS_PER_FOOT = 20;

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export default function PolygonCanvas() {
  const {
    project,
    selectedSectionId,
    tool,
    drawingMode,
    currentPolygon,
    rectangleStart,
    measureStart,
    measureEnd,
    gridCfg,
    showGrid,
    showDimensions,
    showJoists,
    showBeams,
    showDecking,
    showPosts,
    activeLayer,
    loading,
    startDrawingSection,
    startDrawingRectangle,
    completeRectangle,
    addPointToPolygon,
    completeSection,
    cancelDrawing,
    selectSection,
    startMeasure,
    updateMeasure,
    completeMeasure
  } = useDeckStore();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [localPreviewPoint, setLocalPreviewPoint] = useState(null);
  
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (drawingMode === 'drawing' || drawingMode === 'measuring')) {
        cancelDrawing();
        setLocalPreviewPoint(null);
      }
      if (e.key === 'Enter' && drawingMode === 'drawing' && currentPolygon.length >= 3) {
        completeSection();
        setLocalPreviewPoint(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode, currentPolygon, cancelDrawing, completeSection]);

  // Grid snap helper
  const snapToGrid = useCallback((value) => {
    if (!gridCfg.snap) return value;
    const gridSizeFt = gridCfg.spacing_in / 12;
    return Math.round(value / gridSizeFt) * gridSizeFt;
  }, [gridCfg.snap, gridCfg.spacing_in]);

  // Convert screen to world coordinates
  const screenToWorld = (screenX, screenY) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point({ x: screenX, y: screenY });
    
    return {
      x: snapToGrid(pos.x / PIXELS_PER_FOOT),
      y: snapToGrid(pos.y / PIXELS_PER_FOOT)
    };
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    if (tool === 'section') {
      if (drawingMode !== 'drawing') {
        startDrawingSection();
        addPointToPolygon(worldPos);
      } else {
        // Check if clicking near first point to close polygon
        if (currentPolygon.length >= 3) {
          const firstPoint = currentPolygon[0];
          const distance = Math.sqrt(
            Math.pow(worldPos.x - firstPoint.x, 2) + 
            Math.pow(worldPos.y - firstPoint.y, 2)
          );
          
          if (distance < 1) { // Within 1 foot
            completeSection();
            setLocalPreviewPoint(null);
            return;
          }
        }
        
        addPointToPolygon(worldPos);
      }
    } else if (tool === 'rectangle') {
      if (drawingMode !== 'drawing') {
        startDrawingRectangle(worldPos);
      }
    } else if (tool === 'select') {
      // Check if clicking on a section
      const clickedSection = project.sections.find(section => {
        // Simple point-in-polygon test
        return isPointInPolygon(worldPos, section.polygon);
      });
      
      if (clickedSection) {
        selectSection(clickedSection.id);
      } else {
        selectSection(null);
      }
    } else if (tool === 'measure') {
      if (!measureStart) {
        startMeasure(worldPos);
      } else {
        completeMeasure();
      }
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    setMousePos(point);
    
    if (drawingMode === 'drawing') {
      setLocalPreviewPoint(worldPos);
    } else if (drawingMode === 'measuring' && measureStart) {
      updateMeasure(worldPos);
    }
  };
  
  const handleMouseUp = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    if (tool === 'rectangle' && drawingMode === 'drawing' && rectangleStart) {
      // Don't create rectangle if dimensions are too small
      const width = Math.abs(worldPos.x - rectangleStart.x);
      const height = Math.abs(worldPos.y - rectangleStart.y);
      
      if (width > 0.5 && height > 0.5) { // Minimum 6 inches
        completeRectangle(worldPos);
      } else {
        cancelDrawing();
      }
    }
  };

  // Zoom handling
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Render grid - memoized for performance
  const renderGrid = useMemo(() => {
    if (!showGrid || !gridCfg.visible) return null;
    
    const lines = [];
    const gridSizeInches = gridCfg.spacing_in;
    const gridSizeFeet = gridSizeInches / 12;
    const gridSizePixels = gridSizeFeet * PIXELS_PER_FOOT;
    
    // Calculate visible area
    const startX = Math.floor(-stagePos.x / stageScale / gridSizePixels) * gridSizePixels;
    const endX = startX + (dimensions.width / stageScale) + gridSizePixels * 2;
    const startY = Math.floor(-stagePos.y / stageScale / gridSizePixels) * gridSizePixels;
    const endY = startY + (dimensions.height / stageScale) + gridSizePixels * 2;
    
    // Grid lines
    for (let x = startX; x <= endX; x += gridSizePixels) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e0e0e0"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    
    for (let y = startY; y <= endY; y += gridSizePixels) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e0e0e0"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    
    return lines;
  }, [showGrid, gridCfg.visible, gridCfg.spacing_in, stagePos, stageScale, dimensions]);

  // Render deck sections
  const renderSections = () => {
    if (activeLayer === 'framing' || activeLayer === 'decking') return null;
    
    return project.sections.map((section) => {
      const points = section.polygon.flatMap(p => [
        p.x * PIXELS_PER_FOOT,
        p.y * PIXELS_PER_FOOT
      ]);
      
      const isSelected = section.id === selectedSectionId;
      
      return (
        <Group key={section.id}>
          <Line
            points={points}
            closed
            fill={isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(139, 69, 19, 0.2)"}
            stroke={isSelected ? "#3B82F6" : "#8B4513"}
            strokeWidth={isSelected ? 3 : 2}
          />
          
          {/* Section label */}
          {section.polygon.length > 0 && (
            <Text
              x={section.polygon[0].x * PIXELS_PER_FOOT + 5}
              y={section.polygon[0].y * PIXELS_PER_FOOT + 5}
              text={section.name}
              fontSize={12}
              fill={isSelected ? "#3B82F6" : "#666"}
            />
          )}
          
          {/* Dimensions */}
          {showDimensions && renderSectionDimensions(section)}
        </Group>
      );
    });
  };

  // Render section dimensions
  const renderSectionDimensions = (section) => {
    const dims = [];
    const edges = [];
    
    for (let i = 0; i < section.polygon.length; i++) {
      const p1 = section.polygon[i];
      const p2 = section.polygon[(i + 1) % section.polygon.length];
      edges.push({ p1, p2 });
    }
    
    edges.forEach((edge, i) => {
      const midX = (edge.p1.x + edge.p2.x) / 2 * PIXELS_PER_FOOT;
      const midY = (edge.p1.y + edge.p2.y) / 2 * PIXELS_PER_FOOT;
      const distance = Math.sqrt(
        Math.pow(edge.p2.x - edge.p1.x, 2) + 
        Math.pow(edge.p2.y - edge.p1.y, 2)
      );
      
      if (distance > 0.5) { // Only show for edges > 6"
        dims.push(
          <Text
            key={`dim-${i}`}
            x={midX}
            y={midY}
            text={`${distance.toFixed(1)}'`}
            fontSize={11}
            fill="#666"
            offsetX={15}
            offsetY={6}
          />
        );
      }
    });
    
    return dims;
  };

  // Render current drawing polygon
  const renderDrawingPolygon = () => {
    if (!drawingMode || currentPolygon.length === 0) return null;
    
    const allPoints = [...currentPolygon];
    if (localPreviewPoint) {
      allPoints.push(localPreviewPoint);
    }
    
    const points = allPoints.flatMap(p => [
      p.x * PIXELS_PER_FOOT,
      p.y * PIXELS_PER_FOOT
    ]);
    
    return (
      <Group>
        {/* Polygon outline */}
        <Line
          points={points}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
        />
        
        {/* Closing line preview */}
        {currentPolygon.length >= 3 && localPreviewPoint && (
          <Line
            points={[
              localPreviewPoint.x * PIXELS_PER_FOOT,
              localPreviewPoint.y * PIXELS_PER_FOOT,
              currentPolygon[0].x * PIXELS_PER_FOOT,
              currentPolygon[0].y * PIXELS_PER_FOOT
            ]}
            stroke="#3B82F6"
            strokeWidth={1}
            dash={[3, 3]}
            opacity={0.5}
          />
        )}
        
        {/* Vertices */}
        {currentPolygon.map((point, i) => (
          <Circle
            key={i}
            x={point.x * PIXELS_PER_FOOT}
            y={point.y * PIXELS_PER_FOOT}
            radius={4}
            fill={i === 0 ? "#10B981" : "#3B82F6"}
            stroke="white"
            strokeWidth={2}
          />
        ))}
        
        {/* First point highlight for closing */}
        {currentPolygon.length >= 3 && (
          <Circle
            x={currentPolygon[0].x * PIXELS_PER_FOOT}
            y={currentPolygon[0].y * PIXELS_PER_FOOT}
            radius={8}
            stroke="#10B981"
            strokeWidth={2}
            fill="transparent"
          />
        )}
      </Group>
    );
  };
  
  // Render rectangle preview during drawing
  const renderRectanglePreview = () => {
    if (!drawingMode || tool !== 'rectangle' || !rectangleStart || !localPreviewPoint) return null;
    
    const start = rectangleStart;
    const end = localPreviewPoint;
    
    // Calculate rectangle dimensions
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    
    return (
      <Group>
        {/* Rectangle preview */}
        <Rect
          x={left * PIXELS_PER_FOOT}
          y={top * PIXELS_PER_FOOT}
          width={width * PIXELS_PER_FOOT}
          height={height * PIXELS_PER_FOOT}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
          fill="rgba(59, 130, 246, 0.1)"
        />
        
        {/* Corner points */}
        <Circle x={start.x * PIXELS_PER_FOOT} y={start.y * PIXELS_PER_FOOT} radius={4} fill="#10B981" />
        <Circle x={end.x * PIXELS_PER_FOOT} y={start.y * PIXELS_PER_FOOT} radius={4} fill="#3B82F6" />
        <Circle x={end.x * PIXELS_PER_FOOT} y={end.y * PIXELS_PER_FOOT} radius={4} fill="#3B82F6" />
        <Circle x={start.x * PIXELS_PER_FOOT} y={end.y * PIXELS_PER_FOOT} radius={4} fill="#3B82F6" />
        
        {/* Dimension labels */}
        <Text
          x={(left + width/2) * PIXELS_PER_FOOT}
          y={(top - 0.5) * PIXELS_PER_FOOT}
          text={`${width.toFixed(1)}'`}
          fontSize={14}
          fill="#3B82F6"
          align="center"
        />
        <Text
          x={(left - 0.5) * PIXELS_PER_FOOT}
          y={(top + height/2) * PIXELS_PER_FOOT}
          text={`${height.toFixed(1)}'`}
          fontSize={14}
          fill="#3B82F6"
          rotation={-90}
          align="center"
        />
        
        {/* Area label */}
        <Text
          x={(left + width/2) * PIXELS_PER_FOOT}
          y={(top + height/2) * PIXELS_PER_FOOT}
          text={`${(width * height).toFixed(0)} sq ft`}
          fontSize={16}
          fill="#3B82F6"
          align="center"
          fontStyle="bold"
        />
      </Group>
    );
  };

  // Render structure for sections
  const renderStructures = () => {
    if (activeLayer === 'footprint') return null;
    
    logger.info('Rendering structures with visibility:', {
      activeLayer,
      showJoists,
      showBeams,
      showPosts,
      showDecking,
      showDimensions
    });
    
    return project.sections.map(section => {
      if (!section.structure?.geometry) return null;
      
      const geometry = section.structure.geometry;
      const elements = [];
      
      // Render based on active layer
      if ((activeLayer === 'all' || activeLayer === 'framing') && showJoists && geometry.joists) {
        elements.push(...renderJoists(geometry.joists, section.id));
      }
      
      if ((activeLayer === 'all' || activeLayer === 'framing') && showBeams && geometry.beams) {
        elements.push(...renderBeams(geometry.beams, section.id));
      }
      
      if ((activeLayer === 'all' || activeLayer === 'framing') && showPosts && geometry.posts) {
        elements.push(...renderPosts(geometry.posts, section.id));
      }
      
      if ((activeLayer === 'all' || activeLayer === 'decking') && showDecking && geometry.decking_boards) {
        elements.push(...renderDecking(geometry.decking_boards, section.id));
      }
      
      return <Group key={`structure-${section.id}`}>{elements}</Group>;
    });
  };

  const renderJoists = (joists, sectionId) => {
    return joists.map((joist, i) => (
      <Line
        key={`joist-${sectionId}-${i}`}
        points={[
          joist.start.x * PIXELS_PER_FOOT,
          joist.start.y * PIXELS_PER_FOOT,
          joist.end.x * PIXELS_PER_FOOT,
          joist.end.y * PIXELS_PER_FOOT
        ]}
        stroke="#8B6914"
        strokeWidth={joist.is_double ? 3 : 2}
        opacity={0.8}
      />
    ));
  };

  const renderBeams = (beams, sectionId) => {
    return beams.map((beam, i) => (
      <Group key={`beam-${sectionId}-${i}`}>
        <Line
          points={[
            beam.start.x * PIXELS_PER_FOOT,
            beam.start.y * PIXELS_PER_FOOT,
            beam.end.x * PIXELS_PER_FOOT,
            beam.end.y * PIXELS_PER_FOOT
          ]}
          stroke="#654321"
          strokeWidth={6}
          lineCap="square"
        />
      </Group>
    ));
  };

  const renderPosts = (posts, sectionId) => {
    logger.info(`Rendering ${posts.length} posts for section ${sectionId}`, posts);
    return posts.map((post, i) => (
      <Rect
        key={`post-${sectionId}-${i}`}
        x={post.x * PIXELS_PER_FOOT - 4}
        y={post.y * PIXELS_PER_FOOT - 4}
        width={8}
        height={8}
        fill="#444"
        stroke="#222"
        strokeWidth={1}
      />
    ));
  };

  const renderDecking = (boards, sectionId) => {
    return boards.map((board, i) => (
      <Line
        key={`deck-${sectionId}-${i}`}
        points={[
          board.start.x * PIXELS_PER_FOOT,
          board.start.y * PIXELS_PER_FOOT,
          board.end.x * PIXELS_PER_FOOT,
          board.end.y * PIXELS_PER_FOOT
        ]}
        stroke="rgba(160, 82, 45, 0.4)"
        strokeWidth={5}
      />
    ));
  };

  // Render measurement line
  const renderMeasurement = () => {
    if (!measureStart) return null;
    
    const endPoint = measureEnd || localPreviewPoint;
    if (!endPoint) return null;
    
    const distance = Math.sqrt(
      Math.pow(endPoint.x - measureStart.x, 2) + 
      Math.pow(endPoint.y - measureStart.y, 2)
    );
    
    const midX = (measureStart.x + endPoint.x) / 2 * PIXELS_PER_FOOT;
    const midY = (measureStart.y + endPoint.y) / 2 * PIXELS_PER_FOOT;
    
    return (
      <Group>
        {/* Measurement line */}
        <Line
          points={[
            measureStart.x * PIXELS_PER_FOOT,
            measureStart.y * PIXELS_PER_FOOT,
            endPoint.x * PIXELS_PER_FOOT,
            endPoint.y * PIXELS_PER_FOOT
          ]}
          stroke="#EF4444"
          strokeWidth={2}
          dash={[5, 5]}
        />
        
        {/* End points */}
        <Circle
          x={measureStart.x * PIXELS_PER_FOOT}
          y={measureStart.y * PIXELS_PER_FOOT}
          radius={4}
          fill="#EF4444"
        />
        <Circle
          x={endPoint.x * PIXELS_PER_FOOT}
          y={endPoint.y * PIXELS_PER_FOOT}
          radius={4}
          fill="#EF4444"
        />
        
        {/* Distance label */}
        <Group x={midX} y={midY}>
          <Rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            fill="white"
            stroke="#EF4444"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Text
            x={-28}
            y={-6}
            text={`${distance.toFixed(1)}'`}
            fontSize={14}
            fill="#EF4444"
            width={56}
            align="center"
          />
        </Group>
      </Group>
    );
  };
  
  // Create a key that changes when layer visibility changes
  const layerKey = `${showDimensions}-${showJoists}-${showBeams}-${showPosts}-${showDecking}-${activeLayer}`;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-gray-100"
      style={{ cursor: tool === 'section' || tool === 'rectangle' || tool === 'measure' ? 'crosshair' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={tool === 'select'}
      >
        <Layer key={layerKey}>
          {renderGrid}
          {renderSections()}
          {renderStructures()}
          {renderDrawingPolygon()}
          {renderRectanglePreview()}
          {renderMeasurement()}
        </Layer>
      </Stage>
      
      {/* Instructions */}
      {(drawingMode === 'drawing' || drawingMode === 'measuring') && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow">
          <div className="text-sm font-medium">
            {tool === 'rectangle' ? 'Drawing Rectangle' : 
             tool === 'measure' ? 'Measuring Distance' :
             'Drawing Deck Section'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {tool === 'rectangle' ? 
              'Click and drag to draw rectangle' : 
             tool === 'measure' ?
              'Click two points to measure distance' :
              'Click to add points • Click near start point to close'
            }
          </div>
          <div className="text-xs text-gray-600">
            {tool === 'measure' ?
              'Press Esc to cancel' :
             tool === 'rectangle' ? 
              'Press Esc to cancel' :
              'Press Enter to complete • Press Esc to cancel'
            }
          </div>
        </div>
      )}
      
      {loading && (
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow">
          Generating structure...
        </div>
      )}
      
      {/* Coordinate display */}
      {tool === 'section' && (
        <div className="absolute bottom-4 left-4 bg-gray-900 text-white text-xs rounded px-2 py-1">
          {snapToGrid(mousePos.x / PIXELS_PER_FOOT).toFixed(1)}', {snapToGrid(mousePos.y / PIXELS_PER_FOOT).toFixed(1)}'
        </div>
      )}
    </div>
  );
}