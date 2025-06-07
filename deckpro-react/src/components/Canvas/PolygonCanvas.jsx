import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Rect, Arrow } from 'react-konva';
import useDeckStore from '../../store/deckStore';
import { logger } from '../../utils/logger';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { 
  PIXELS_PER_FOOT, 
  VIEWPORT_CONSTRAINTS,
  fitToContent,
  calculateZoom,
  getAdaptiveGridSpacing,
  getResponsiveScale
} from '../../utils/viewport';
import { throttle } from '../../lib/utils';
import ViewportControls from './ViewportControls';

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
    stairStart,
    stairEnd,
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
    completeMeasure,
    startDrawingStair,
    updateStairEnd,
    completeStair
  } = useDeckStore();

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  
  // Use responsive canvas sizing
  const dimensions = useCanvasSize(containerRef);
  
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [localPreviewPoint, setLocalPreviewPoint] = useState(null);
  const [lastCenter, setLastCenter] = useState(null);
  const [lastDist, setLastDist] = useState(0);
  
  // Apply responsive scale factor
  const responsiveScale = useMemo(() => 
    getResponsiveScale(dimensions.width),
    [dimensions.width]
  );
  
  // Fit to content when sections change
  useEffect(() => {
    if (project.sections.length > 0 && dimensions.width > 0) {
      const viewport = fitToContent(project.sections, dimensions);
      setStagePos({ x: viewport.x, y: viewport.y });
      setStageScale(viewport.scale * responsiveScale);
    }
  }, [project.sections.length, dimensions, responsiveScale]);

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

  // Touch/Mouse handlers
  const handlePointerDown = (e) => {
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
    } else if (tool === 'stair') {
      if (drawingMode !== 'drawing') {
        startDrawingStair(worldPos);
      }
    }
  };

  const handlePointerMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    // Only update mouse position if tool requires coordinate display
    if (tool === 'section') {
      setMousePos(point);
    }
    
    if (drawingMode === 'drawing') {
      setLocalPreviewPoint(worldPos);
      if (tool === 'stair' && stairStart) {
        updateStairEnd(worldPos);
      }
    } else if (drawingMode === 'measuring' && measureStart) {
      updateMeasure(worldPos);
    }
  };
  
  const handlePointerUp = (e) => {
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
    } else if (tool === 'stair' && drawingMode === 'drawing' && stairStart) {
      // Complete stair if we've dragged far enough
      const dx = worldPos.x - stairStart.x;
      const dy = worldPos.y - stairStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) { // Minimum 2 feet
        updateStairEnd(worldPos);
        completeStair();
      } else {
        cancelDrawing();
      }
    }
  };

  // Throttled zoom handling for better performance
  const handleWheel = useCallback(
    throttle((e) => {
      e.evt.preventDefault();
      
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();
      
      const { scale, position } = calculateZoom(
        stageScale,
        e.evt.deltaY,
        pointer,
        stagePos
      );
      
      setStageScale(scale);
      setStagePos(position);
    }, 16), // ~60fps
    [stageScale, stagePos]
  );
  
  // Touch event handlers for pinch zoom
  const handleTouchMove = useCallback((e) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    
    if (touch1 && touch2) {
      // Pinch zoom
      const stage = stageRef.current;
      if (!stage) return;
      
      // Calculate distance between touches
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastDist === 0) {
        setLastDist(dist);
        return;
      }
      
      // Calculate center point between touches
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      
      // Calculate new scale
      const scale = (dist / lastDist) * stageScale;
      const newScale = Math.max(
        VIEWPORT_CONSTRAINTS.minZoom,
        Math.min(VIEWPORT_CONSTRAINTS.maxZoom, scale)
      );
      
      // Calculate new position to zoom towards center
      const stageRect = stage.container().getBoundingClientRect();
      const pointer = {
        x: center.x - stageRect.left,
        y: center.y - stageRect.top
      };
      
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / stageScale,
        y: (pointer.y - stagePos.y) / stageScale,
      };
      
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      
      setStageScale(newScale);
      setStagePos(newPos);
      setLastDist(dist);
      setLastCenter(center);
    }
  }, [stageScale, stagePos, lastDist]);
  
  const handleTouchEnd = useCallback(() => {
    setLastDist(0);
    setLastCenter(null);
  }, []);
  
  // Keyboard shortcuts for viewport control
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Fit to content
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (project.sections.length > 0) {
          const viewport = fitToContent(project.sections, dimensions);
          setStagePos({ x: viewport.x, y: viewport.y });
          setStageScale(viewport.scale * responsiveScale);
        }
      }
      // Zoom in
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const newScale = Math.min(stageScale * 1.2, VIEWPORT_CONSTRAINTS.maxZoom);
        setStageScale(newScale);
      }
      // Zoom out
      else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const newScale = Math.max(stageScale / 1.2, VIEWPORT_CONSTRAINTS.minZoom);
        setStageScale(newScale);
      }
      // Reset zoom
      else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setStageScale(1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.sections, dimensions, responsiveScale, stageScale]);

  // Render grid - memoized for performance
  const renderGrid = useMemo(() => {
    if (!showGrid || !gridCfg.visible) return null;
    
    const lines = [];
    const adaptiveSpacing = getAdaptiveGridSpacing(gridCfg.spacing_in, stageScale);
    const gridSizeFeet = adaptiveSpacing / 12;
    const gridSizePixels = gridSizeFeet * PIXELS_PER_FOOT;
    
    // Calculate visible area with padding
    const padding = 100;
    const startX = Math.floor((-stagePos.x - padding) / stageScale / gridSizePixels) * gridSizePixels;
    const endX = startX + ((dimensions.width + padding * 2) / stageScale) + gridSizePixels * 2;
    const startY = Math.floor((-stagePos.y - padding) / stageScale / gridSizePixels) * gridSizePixels;
    const endY = startY + ((dimensions.height + padding * 2) / stageScale) + gridSizePixels * 2;
    
    // Determine grid opacity based on zoom level
    const gridOpacity = stageScale < 0.5 ? 0.3 : stageScale < 1 ? 0.5 : 0.7;
    const majorGridInterval = adaptiveSpacing >= 24 ? 1 : 5; // Major lines every foot or 5 feet
    
    // Grid lines with major/minor distinction
    let gridIndex = 0;
    for (let x = startX; x <= endX; x += gridSizePixels) {
      const isMajor = gridIndex % majorGridInterval === 0;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={isMajor ? "#d0d0d0" : "#e8e8e8"}
          strokeWidth={(isMajor ? 1 : 0.5) / stageScale}
          opacity={gridOpacity}
          listening={false}
        />
      );
      gridIndex++;
    }
    
    gridIndex = 0;
    for (let y = startY; y <= endY; y += gridSizePixels) {
      const isMajor = gridIndex % majorGridInterval === 0;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke={isMajor ? "#d0d0d0" : "#e8e8e8"}
          strokeWidth={(isMajor ? 1 : 0.5) / stageScale}
          opacity={gridOpacity}
          listening={false}
        />
      );
      gridIndex++;
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
  const renderStructures = useCallback(() => {
    if (activeLayer === 'footprint') return null;
    
    // Log only in development and throttled
    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      if (!window._lastStructureLog || now - window._lastStructureLog > 1000) {
        logger.info('Rendering structures with visibility:', {
          activeLayer,
          showJoists,
          showBeams,
          showPosts,
          showDecking,
          showDimensions
        });
        window._lastStructureLog = now;
      }
    }
    
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
  }, [activeLayer, showJoists, showBeams, showPosts, showDecking, showDimensions, project.sections]);

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

  // Render stairs
  const renderStairs = () => {
    if (!project.stairs || project.stairs.length === 0) return null;
    
    return project.stairs.map(stair => {
      const { topConnection, bottomConnection, dimensions } = stair;
      if (!topConnection.position || !bottomConnection.position) return null;
      
      const top = topConnection.position;
      const bottom = bottomConnection.position;
      const width = dimensions.width / 12; // Convert to feet
      
      // Calculate perpendicular direction for width
      const dx = bottom.x - top.x;
      const dy = bottom.y - top.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length * width / 2;
      const perpY = dx / length * width / 2;
      
      // Create stair outline
      const points = [
        (top.x - perpX) * PIXELS_PER_FOOT,
        (top.y - perpY) * PIXELS_PER_FOOT,
        (top.x + perpX) * PIXELS_PER_FOOT,
        (top.y + perpY) * PIXELS_PER_FOOT,
        (bottom.x + perpX) * PIXELS_PER_FOOT,
        (bottom.y + perpY) * PIXELS_PER_FOOT,
        (bottom.x - perpX) * PIXELS_PER_FOOT,
        (bottom.y - perpY) * PIXELS_PER_FOOT,
      ];
      
      return (
        <Group key={stair.id}>
          {/* Stair outline */}
          <Line
            points={points}
            closed
            fill="rgba(150, 150, 150, 0.3)"
            stroke="#666"
            strokeWidth={2}
          />
          
          {/* Step lines */}
          {Array.from({ length: dimensions.numberOfSteps }).map((_, i) => {
            const stepRatio = i / dimensions.numberOfSteps;
            const stepX = top.x + dx * stepRatio;
            const stepY = top.y + dy * stepRatio;
            
            return (
              <Line
                key={i}
                points={[
                  (stepX - perpX) * PIXELS_PER_FOOT,
                  (stepY - perpY) * PIXELS_PER_FOOT,
                  (stepX + perpX) * PIXELS_PER_FOOT,
                  (stepY + perpY) * PIXELS_PER_FOOT,
                ]}
                stroke="#999"
                strokeWidth={1}
              />
            );
          })}
          
          {/* Stair info */}
          <Text
            x={(top.x + bottom.x) / 2 * PIXELS_PER_FOOT}
            y={(top.y + bottom.y) / 2 * PIXELS_PER_FOOT}
            text={`${dimensions.numberOfSteps} steps`}
            fontSize={12}
            fill="#666"
            align="center"
            offsetX={30}
          />
        </Group>
      );
    });
  };
  
  // Render stair preview during drawing
  const renderStairPreview = () => {
    const endPoint = stairEnd || localPreviewPoint;
    if (!stairStart || !endPoint || tool !== 'stair' || drawingMode !== 'drawing') return null;
    
    const width = 3; // 3 feet width for preview
    const dx = endPoint.x - stairStart.x;
    const dy = endPoint.y - stairStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 0.1) return null;
    
    const perpX = -dy / length * width / 2;
    const perpY = dx / length * width / 2;
    
    const points = [
      (stairStart.x - perpX) * PIXELS_PER_FOOT,
      (stairStart.y - perpY) * PIXELS_PER_FOOT,
      (stairStart.x + perpX) * PIXELS_PER_FOOT,
      (stairStart.y + perpY) * PIXELS_PER_FOOT,
      (endPoint.x + perpX) * PIXELS_PER_FOOT,
      (endPoint.y + perpY) * PIXELS_PER_FOOT,
      (endPoint.x - perpX) * PIXELS_PER_FOOT,
      (endPoint.y - perpY) * PIXELS_PER_FOOT,
    ];
    
    // Calculate approximate steps
    const run = length * 12; // Convert to inches
    const estimatedSteps = Math.max(1, Math.floor(run / 11)); // Assume 11" tread depth
    
    return (
      <Group>
        <Line
          points={points}
          closed
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
        />
        
        {/* Direction arrow */}
        <Arrow
          points={[
            stairStart.x * PIXELS_PER_FOOT,
            stairStart.y * PIXELS_PER_FOOT,
            endPoint.x * PIXELS_PER_FOOT,
            endPoint.y * PIXELS_PER_FOOT,
          ]}
          pointerLength={10}
          pointerWidth={10}
          fill="#3B82F6"
          stroke="#3B82F6"
          strokeWidth={2}
        />
        
        <Text
          x={endPoint.x * PIXELS_PER_FOOT}
          y={endPoint.y * PIXELS_PER_FOOT + 10}
          text={`~${estimatedSteps} steps`}
          fontSize={14}
          fill="#3B82F6"
        />
      </Group>
    );
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
    
    // Check if measuring a section
    let measuredSection = null;
    let sectionArea = 0;
    
    if (measureEnd) {
      // Find if both points are in the same section
      measuredSection = project.sections.find(section => 
        isPointInPolygon(measureStart, section.polygon) && 
        isPointInPolygon(measureEnd, section.polygon)
      );
      
      if (measuredSection) {
        // Calculate area
        sectionArea = measuredSection.polygon.reduce((area, point, i) => {
          const nextPoint = measuredSection.polygon[(i + 1) % measuredSection.polygon.length];
          return area + (point.x * nextPoint.y - nextPoint.x * point.y);
        }, 0) / 2;
        sectionArea = Math.abs(sectionArea);
      }
    }
    
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
        
        {/* Distance/Area label */}
        <Group x={midX} y={midY}>
          <Rect
            x={-50}
            y={measuredSection ? -20 : -10}
            width={100}
            height={measuredSection ? 40 : 20}
            fill="white"
            stroke="#EF4444"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Text
            x={-48}
            y={measuredSection ? -16 : -6}
            text={`${distance.toFixed(1)}'`}
            fontSize={14}
            fill="#EF4444"
            width={96}
            align="center"
          />
          {measuredSection && (
            <Text
              x={-48}
              y={2}
              text={`${sectionArea.toFixed(0)} sq ft`}
              fontSize={12}
              fill="#EF4444"
              width={96}
              align="center"
            />
          )}
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
      style={{ cursor: tool === 'section' || tool === 'rectangle' || tool === 'measure' || tool === 'stair' ? 'crosshair' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handlePointerDown}
        onMousemove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handlePointerUp(e);
          handleTouchEnd();
        }}
        onWheel={handleWheel}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={tool === 'select'}
        onDragEnd={(e) => {
          const stage = e.target
          setStagePos({ x: stage.x(), y: stage.y() })
        }}
      >
        <Layer key={layerKey}>
          {renderGrid}
          {renderSections()}
          {renderStairs()}
          {renderStructures()}
          {renderDrawingPolygon()}
          {renderRectanglePreview()}
          {renderStairPreview()}
          {renderMeasurement()}
        </Layer>
      </Stage>
      
      {/* Instructions */}
      {(drawingMode === 'drawing' || drawingMode === 'measuring') && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow">
          <div className="text-sm font-medium">
            {tool === 'rectangle' ? 'Drawing Rectangle' : 
             tool === 'measure' ? 'Measuring Distance' :
             tool === 'stair' ? 'Drawing Stairs' :
             'Drawing Deck Section'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {tool === 'rectangle' ? 
              'Click and drag to draw rectangle' : 
             tool === 'measure' ?
              'Click two points to measure distance' :
             tool === 'stair' ?
              'Click start point near deck edge, then click end point' :
              'Click to add points • Click near start point to close'
            }
          </div>
          <div className="text-xs text-gray-600">
            {tool === 'measure' || tool === 'stair' ?
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
      
      {/* Viewport controls */}
      <ViewportControls
        stageScale={stageScale}
        onZoomIn={() => {
          const newScale = Math.min(stageScale * 1.2, VIEWPORT_CONSTRAINTS.maxZoom)
          setStageScale(newScale)
        }}
        onZoomOut={() => {
          const newScale = Math.max(stageScale / 1.2, VIEWPORT_CONSTRAINTS.minZoom)
          setStageScale(newScale)
        }}
        onFitToContent={() => {
          if (project.sections.length > 0) {
            const viewport = fitToContent(project.sections, dimensions)
            setStagePos({ x: viewport.x, y: viewport.y })
            setStageScale(viewport.scale * responsiveScale)
          }
        }}
        className="bottom-4 right-4"
      />
    </div>
  );
}