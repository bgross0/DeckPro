import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import useDeckStore from '../../store/deckStore';
import { logger } from '../../utils/logger';

const PIXELS_PER_FOOT = 10;
const GRID_SIZE = 6;

export default function KonvaCanvas() {
  const {
    footprint,
    structure,
    config,
    tool,
    previewRect,
    setPreviewRect,
    setFootprint,
    generateStructure,
    loading,
    showGrid,
    showDimensions,
    showJoists,
    showBeams,
    showDecking
  } = useDeckStore();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  
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

  // Auto-generate structure when footprint changes
  useEffect(() => {
    if (footprint.length >= 3 && !loading) {
      generateStructure();
    }
  }, [footprint, config, generateStructure, loading]);

  // Grid coordinates helper
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Convert screen to world coordinates
  const screenToWorld = (x, y) => {
    const stage = stageRef.current;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point({ x, y });
    return {
      x: snapToGrid(pos.x / PIXELS_PER_FOOT),
      y: snapToGrid(pos.y / PIXELS_PER_FOOT)
    };
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    if (tool !== 'rectangle') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    setIsDrawing(true);
    setStartPoint(worldPos);
    setPreviewRect({ x: worldPos.x, y: worldPos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    setPreviewRect({
      x: Math.min(startPoint.x, worldPos.x),
      y: Math.min(startPoint.y, worldPos.y),
      width: Math.abs(worldPos.x - startPoint.x),
      height: Math.abs(worldPos.y - startPoint.y)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !previewRect) return;
    
    setIsDrawing(false);
    
    if (previewRect.width >= 6 && previewRect.height >= 6) {
      const newFootprint = [
        { x: previewRect.x, y: previewRect.y },
        { x: previewRect.x + previewRect.width, y: previewRect.y },
        { x: previewRect.x + previewRect.width, y: previewRect.y + previewRect.height },
        { x: previewRect.x, y: previewRect.y + previewRect.height }
      ];
      setFootprint(newFootprint);
      logger.info('New footprint created', newFootprint);
    }
    
    setPreviewRect(null);
    setStartPoint(null);
  };

  // Zoom handling
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;
    
    const lines = [];
    const gridSizePixels = GRID_SIZE * PIXELS_PER_FOOT;
    
    // Vertical lines
    for (let x = 0; x <= dimensions.width / stageScale; x += gridSizePixels) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, dimensions.height / stageScale]}
          stroke="#333"
          strokeWidth={0.5}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= dimensions.height / stageScale; y += gridSizePixels) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, dimensions.width / stageScale, y]}
          stroke="#333"
          strokeWidth={0.5}
        />
      );
    }
    
    return lines;
  };

  // Render footprint
  const renderFootprint = () => {
    if (footprint.length < 3) return null;
    
    const points = footprint.flatMap(p => [
      p.x * PIXELS_PER_FOOT,
      p.y * PIXELS_PER_FOOT
    ]);
    
    return (
      <Line
        points={points}
        closed
        fill="rgba(139, 69, 19, 0.3)"
        stroke="#8B4513"
        strokeWidth={2}
      />
    );
  };

  // Render preview rectangle
  const renderPreview = () => {
    if (!previewRect) return null;
    
    return (
      <Rect
        x={previewRect.x * PIXELS_PER_FOOT}
        y={previewRect.y * PIXELS_PER_FOOT}
        width={previewRect.width * PIXELS_PER_FOOT}
        height={previewRect.height * PIXELS_PER_FOOT}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[5, 5]}
      />
    );
  };

  // Render joists
  const renderJoists = () => {
    if (!showJoists || !structure?.joists) return null;
    
    return structure.joists.map((joist, index) => (
      <Line
        key={`joist-${index}`}
        points={[
          joist.start.x * PIXELS_PER_FOOT,
          joist.start.y * PIXELS_PER_FOOT,
          joist.end.x * PIXELS_PER_FOOT,
          joist.end.y * PIXELS_PER_FOOT
        ]}
        stroke="#654321"
        strokeWidth={joist.is_double ? 3 : 1.5}
      />
    ));
  };

  // Render beams
  const renderBeams = () => {
    if (!showBeams || !structure?.beams) return null;
    
    return structure.beams.map((beam, index) => (
      <Group key={`beam-${index}`}>
        <Rect
          x={beam.start.x * PIXELS_PER_FOOT - 2}
          y={beam.start.y * PIXELS_PER_FOOT - 2}
          width={(beam.end.x - beam.start.x) * PIXELS_PER_FOOT + 4}
          height={4}
          fill="#8B4513"
        />
        {beam.posts?.map((post, postIndex) => (
          <Rect
            key={`post-${postIndex}`}
            x={post.x * PIXELS_PER_FOOT - 3}
            y={post.y * PIXELS_PER_FOOT - 3}
            width={6}
            height={6}
            fill="#666"
          />
        ))}
      </Group>
    ));
  };

  // Render decking
  const renderDecking = () => {
    if (!showDecking || !structure?.decking_boards) return null;
    
    return structure.decking_boards.map((board, index) => (
      <Line
        key={`deck-${index}`}
        points={[
          board.start.x * PIXELS_PER_FOOT,
          board.start.y * PIXELS_PER_FOOT,
          board.end.x * PIXELS_PER_FOOT,
          board.end.y * PIXELS_PER_FOOT
        ]}
        stroke="rgba(160, 82, 45, 0.6)"
        strokeWidth={5}
      />
    ));
  };

  // Render dimensions
  const renderDimensions = () => {
    if (!showDimensions || footprint.length < 3) return null;
    
    const dims = [];
    
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];
      const midX = (p1.x + p2.x) / 2 * PIXELS_PER_FOOT;
      const midY = (p1.y + p2.y) / 2 * PIXELS_PER_FOOT;
      const distance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      
      dims.push(
        <Text
          key={`dim-${i}`}
          x={midX}
          y={midY}
          text={`${distance.toFixed(1)}'`}
          fontSize={12}
          fill="#000"
          offsetX={15}
          offsetY={6}
        />
      );
    }
    
    return dims;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-gray-100"
      style={{ cursor: tool === 'rectangle' ? 'crosshair' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onWheel={handleWheel}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={tool === 'select'}
      >
        <Layer>
          {renderGrid()}
          {renderFootprint()}
          {renderBeams()}
          {renderJoists()}
          {renderDecking()}
          {renderDimensions()}
          {renderPreview()}
        </Layer>
      </Stage>
      
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow">
          Generating structure...
        </div>
      )}
    </div>
  );
}