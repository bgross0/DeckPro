import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import useDeckStore from '../../store/deckStore';
import { logger } from '../../utils/logger';

const PIXELS_PER_FOOT = 20; // Increased for better visibility

export default function KonvaCanvas() {
  const {
    footprint,
    structureGeometry,
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
    showDecking,
    gridCfg
  } = useDeckStore();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [measureLine, setMeasureLine] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  
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

  // Handle zoom events from toolbar
  useEffect(() => {
    const handleZoomEvent = (e) => {
      const scaleBy = 1.2;
      const stage = stageRef.current;
      if (!stage) return;
      
      const oldScale = stage.scaleX();
      const center = {
        x: stage.width() / 2,
        y: stage.height() / 2
      };
      
      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };
      
      const newScale = e.detail.direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
      
      setStageScale(newScale);
      setStagePos({
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      });
    };

    window.addEventListener('canvas-zoom', handleZoomEvent);
    return () => window.removeEventListener('canvas-zoom', handleZoomEvent);
  }, []);

  // Auto-generate structure when footprint changes
  useEffect(() => {
    if (footprint && footprint.length >= 3 && !loading) {
      generateStructure();
    }
  }, [footprint, config, generateStructure, loading]);

  // Grid coordinates helper
  const snapToGrid = (value) => {
    if (!gridCfg.snap) return value;
    return Math.round(value / gridCfg.spacing_in) * gridCfg.spacing_in;
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
    if (tool === 'select') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const worldPos = screenToWorld(point.x, point.y);
    
    setIsDrawing(true);
    setStartPoint(worldPos);
    
    if (tool === 'rectangle') {
      setPreviewRect({ x: worldPos.x, y: worldPos.y, width: 0, height: 0 });
    } else if (tool === 'measure') {
      setMeasureLine({ start: worldPos, end: worldPos });
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCursorPos(point);
    
    if (!isDrawing || !startPoint) return;
    
    const worldPos = screenToWorld(point.x, point.y);
    
    if (tool === 'rectangle') {
      setPreviewRect({
        x: Math.min(startPoint.x, worldPos.x),
        y: Math.min(startPoint.y, worldPos.y),
        width: Math.abs(worldPos.x - startPoint.x),
        height: Math.abs(worldPos.y - startPoint.y)
      });
    } else if (tool === 'measure') {
      setMeasureLine({ start: startPoint, end: worldPos });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (tool === 'rectangle' && previewRect) {
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
    } else if (tool === 'measure') {
      // Keep the measurement visible until next click
      setTimeout(() => setMeasureLine(null), 3000);
    }
    
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
    if (!showGrid || !gridCfg.visible) return null;
    
    const lines = [];
    const gridSizeInches = gridCfg.spacing_in;
    const gridSizeFeet = gridSizeInches / 12;
    const gridSizePixels = gridSizeFeet * PIXELS_PER_FOOT;
    
    // Calculate grid bounds with some padding
    const startX = Math.floor(-stagePos.x / stageScale / gridSizePixels) * gridSizePixels;
    const endX = startX + (dimensions.width / stageScale) + gridSizePixels * 2;
    const startY = Math.floor(-stagePos.y / stageScale / gridSizePixels) * gridSizePixels;
    const endY = startY + (dimensions.height / stageScale) + gridSizePixels * 2;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSizePixels) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#d0d0d0"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSizePixels) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#d0d0d0"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    
    // Add major grid lines every foot if grid size is less than 12"
    if (gridSizeInches < 12) {
      const majorGridSize = PIXELS_PER_FOOT; // 1 foot
      
      for (let x = startX; x <= endX; x += majorGridSize) {
        if (Math.abs(x % majorGridSize) < 0.01) {
          lines.push(
            <Line
              key={`mv-${x}`}
              points={[x, startY, x, endY]}
              stroke="#b0b0b0"
              strokeWidth={1 / stageScale}
              listening={false}
            />
          );
        }
      }
      
      for (let y = startY; y <= endY; y += majorGridSize) {
        if (Math.abs(y % majorGridSize) < 0.01) {
          lines.push(
            <Line
              key={`mh-${y}`}
              points={[startX, y, endX, y]}
              stroke="#b0b0b0"
              strokeWidth={1 / stageScale}
              listening={false}
            />
          );
        }
      }
    }
    
    return lines;
  };

  // Render footprint
  const renderFootprint = () => {
    if (!footprint || footprint.length < 3) return null;
    
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

  // Render preview rectangle with dimensions
  const renderPreview = () => {
    if (!previewRect) return null;
    
    const x = previewRect.x * PIXELS_PER_FOOT;
    const y = previewRect.y * PIXELS_PER_FOOT;
    const width = previewRect.width * PIXELS_PER_FOOT;
    const height = previewRect.height * PIXELS_PER_FOOT;
    
    return (
      <Group>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[5, 5]}
        />
        
        {/* Width dimension */}
        {previewRect.width > 0 && (
          <Group>
            <Line
              points={[x, y - 10, x + width, y - 10]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Line
              points={[x, y - 15, x, y - 5]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Line
              points={[x + width, y - 15, x + width, y - 5]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Text
              x={x + width / 2}
              y={y - 25}
              text={`${previewRect.width.toFixed(1)}'`}
              fontSize={12}
              fontStyle="bold"
              fill="#3B82F6"
              align="center"
            />
          </Group>
        )}
        
        {/* Height dimension */}
        {previewRect.height > 0 && (
          <Group>
            <Line
              points={[x - 10, y, x - 10, y + height]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Line
              points={[x - 15, y, x - 5, y]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Line
              points={[x - 15, y + height, x - 5, y + height]}
              stroke="#3B82F6"
              strokeWidth={1}
            />
            <Text
              x={x - 35}
              y={y + height / 2}
              text={`${previewRect.height.toFixed(1)}'`}
              fontSize={12}
              fontStyle="bold"
              fill="#3B82F6"
              align="center"
              rotation={-90}
            />
          </Group>
        )}
        
        {/* Area display - bottom right corner */}
        {previewRect.width > 0 && previewRect.height > 0 && (
          <Group>
            <Rect
              x={x + width - 90}
              y={y + height + 5}
              width={85}
              height={20}
              fill="white"
              stroke="#3B82F6"
              strokeWidth={1}
              cornerRadius={3}
              opacity={0.95}
            />
            <Text
              x={x + width - 90}
              y={y + height + 5}
              text={`${(previewRect.width * previewRect.height).toFixed(1)} sq ft`}
              fontSize={11}
              fontStyle="bold"
              fill="#3B82F6"
              align="center"
              verticalAlign="middle"
              width={85}
              height={20}
            />
          </Group>
        )}
      </Group>
    );
  };

  // Render joists
  const renderJoists = () => {
    if (!showJoists || !structureGeometry?.joists) return null;
    
    return structureGeometry.joists.map((joist, index) => (
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
    if (!showBeams || !structureGeometry?.beams) return null;
    
    return structureGeometry.beams.map((beam, index) => (
      <Group key={`beam-${index}`}>
        {/* Draw beam as a line with proper orientation */}
        <Line
          points={[
            beam.start.x * PIXELS_PER_FOOT,
            beam.start.y * PIXELS_PER_FOOT,
            beam.end.x * PIXELS_PER_FOOT,
            beam.end.y * PIXELS_PER_FOOT
          ]}
          stroke="#8B4513"
          strokeWidth={4}
          lineCap="square"
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
    if (!showDecking || !structureGeometry?.decking_boards) return null;
    
    return structureGeometry.decking_boards.map((board, index) => (
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
    if (!showDimensions || !footprint || footprint.length < 3) return null;
    
    const dims = [];
    
    for (let i = 0; footprint && i < footprint.length; i++) {
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

  // Render measure line
  const renderMeasureLine = () => {
    if (!measureLine) return null;
    
    const distance = Math.sqrt(
      Math.pow(measureLine.end.x - measureLine.start.x, 2) +
      Math.pow(measureLine.end.y - measureLine.start.y, 2)
    );
    
    const midX = (measureLine.start.x + measureLine.end.x) / 2 * PIXELS_PER_FOOT;
    const midY = (measureLine.start.y + measureLine.end.y) / 2 * PIXELS_PER_FOOT;
    
    return (
      <Group>
        <Line
          points={[
            measureLine.start.x * PIXELS_PER_FOOT,
            measureLine.start.y * PIXELS_PER_FOOT,
            measureLine.end.x * PIXELS_PER_FOOT,
            measureLine.end.y * PIXELS_PER_FOOT
          ]}
          stroke="#FF6B6B"
          strokeWidth={2}
          dash={[5, 5]}
        />
        <Rect
          x={midX - 30}
          y={midY - 12}
          width={60}
          height={24}
          fill="white"
          stroke="#FF6B6B"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Text
          x={midX}
          y={midY}
          text={`${distance.toFixed(1)}'`}
          fontSize={14}
          fontStyle="bold"
          fill="#FF6B6B"
          align="center"
          verticalAlign="middle"
          offsetX={0}
          offsetY={0}
          width={60}
        />
      </Group>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-gray-100"
      style={{ cursor: tool === 'rectangle' ? 'crosshair' : tool === 'measure' ? 'crosshair' : 'grab' }}
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
          {renderMeasureLine()}
        </Layer>
      </Stage>
      
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow">
          Generating structure...
        </div>
      )}
      
      {/* Cursor dimension tooltip */}
      {isDrawing && tool === 'rectangle' && previewRect && previewRect.width > 0 && previewRect.height > 0 && (
        <div 
          className="absolute bg-gray-900 text-white text-xs rounded-md px-3 py-2 pointer-events-none z-50 shadow-lg"
          style={{
            left: cursorPos.x + 15,
            top: cursorPos.y - 45,
          }}
        >
          <div className="font-semibold">{previewRect.width.toFixed(1)}' × {previewRect.height.toFixed(1)}'</div>
          <div className="text-gray-300 text-[10px]">{(previewRect.width * previewRect.height).toFixed(1)} sq ft</div>
        </div>
      )}
    </div>
  );
}