'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as StageType } from 'konva/lib/Stage';
import { v4 as uuidv4 } from 'uuid';
import { 
  Shape, 
  Tool, 
  ToolSettings, 
  FreeDrawShape, 
  RectangleShape, 
  CircleShape, 
  ArrowShape, 
  LineShape, 
  TextShape
} from '@/lib/types';

interface DrawingCanvasProps {
  shapes: Shape[];
  selectedId: string | null;
  toolSettings: ToolSettings;
  width: number;
  height: number;
  isDisplayMode?: boolean;
  onShapeAdd: (shape: Shape) => void;
  onShapeUpdate: (shape: Shape) => void;
  onSelect: (id: string | null) => void;
  stageRef?: React.RefObject<StageType | null>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  shapes,
  selectedId,
  toolSettings,
  width,
  height,
  isDisplayMode = false,
  onShapeAdd,
  onShapeUpdate,
  onSelect,
  stageRef: externalStageRef,
}) => {
  const internalStageRef = useRef<StageType>(null);
  const stageRef = externalStageRef || internalStageRef;
  const isDrawing = useRef(false);
  const currentShapeRef = useRef<Shape | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const transformerRef = useRef<any>(null);
  const selectedShapeRef = useRef<any>(null);
  
  // Throttle refs for performance optimization
  const lastMoveTimeRef = useRef(0);
  const pendingMoveRef = useRef<(() => void) | null>(null);
  const THROTTLE_MS = 16; // ~60fps

  // Handle transformer for selected shapes - avoid unnecessary redraws
  useEffect(() => {
    if (selectedId && transformerRef.current && selectedShapeRef.current) {
      transformerRef.current.nodes([selectedShapeRef.current]);
      // Konva will handle the redraw automatically, no need for manual batchDraw
    } else if (transformerRef.current) {
      // Clear transformer when nothing is selected
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    return pos || { x: 0, y: 0 };
  }, [stageRef]);

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDisplayMode) return;
    
    // If clicking on empty area with select tool, deselect
    if (toolSettings.tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        onSelect(null);
      }
      return;
    }

    // Don't start drawing if clicking on a shape
    if (e.target !== e.target.getStage()) {
      return;
    }

    isDrawing.current = true;
    const pos = getPointerPosition();
    const id = uuidv4();

    let newShape: Shape | null = null;

    switch (toolSettings.tool) {
      case 'brush':
      case 'pencil':
      case 'eraser':
        newShape = {
          id,
          type: toolSettings.tool,
          x: 0,
          y: 0,
          points: [pos.x, pos.y],
          stroke: toolSettings.tool === 'eraser' ? '#ffffff' : toolSettings.strokeColor,
          strokeWidth: toolSettings.strokeWidth,
          tension: toolSettings.tool === 'brush' ? 0.5 : 0,
          lineCap: 'round',
          lineJoin: 'round',
          opacity: toolSettings.opacity,
          globalCompositeOperation: toolSettings.tool === 'eraser' ? 'destination-out' : 'source-over',
          draggable: false,
        } as FreeDrawShape;
        break;

      case 'rectangle':
        newShape = {
          id,
          type: 'rectangle',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          fill: toolSettings.fillColor || 'transparent',
          stroke: toolSettings.strokeColor,
          strokeWidth: toolSettings.strokeWidth,
          opacity: toolSettings.opacity,
          draggable: true,
        } as RectangleShape;
        break;

      case 'circle':
        newShape = {
          id,
          type: 'circle',
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          fill: toolSettings.fillColor || 'transparent',
          stroke: toolSettings.strokeColor,
          strokeWidth: toolSettings.strokeWidth,
          opacity: toolSettings.opacity,
          draggable: true,
        } as CircleShape;
        break;

      case 'arrow':
        newShape = {
          id,
          type: 'arrow',
          x: 0,
          y: 0,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: toolSettings.strokeColor,
          strokeWidth: toolSettings.strokeWidth,
          fill: toolSettings.strokeColor,
          pointerLength: 15,
          pointerWidth: 15,
          opacity: toolSettings.opacity,
          draggable: true,
        } as ArrowShape;
        break;

      case 'line':
        newShape = {
          id,
          type: 'line',
          x: 0,
          y: 0,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: toolSettings.strokeColor,
          strokeWidth: toolSettings.strokeWidth,
          lineCap: 'round',
          opacity: toolSettings.opacity,
          draggable: true,
        } as LineShape;
        break;

      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          newShape = {
            id,
            type: 'text',
            x: pos.x,
            y: pos.y,
            text,
            fontSize: toolSettings.fontSize,
            fontFamily: toolSettings.fontFamily,
            fill: toolSettings.strokeColor,
            opacity: toolSettings.opacity,
            draggable: true,
          } as TextShape;
          onShapeAdd(newShape);
        }
        isDrawing.current = false;
        return;
    }

    if (newShape) {
      currentShapeRef.current = newShape;
      setCurrentShape(newShape);
    }
  }, [isDisplayMode, toolSettings, getPointerPosition, onSelect, onShapeAdd]);

  // Core move handler logic (separated for throttling)
  const processMouseMove = useCallback(() => {
    if (!isDrawing.current || !currentShapeRef.current || isDisplayMode) return;

    const pos = getPointerPosition();
    const shape = currentShapeRef.current;

    let updatedShape: Shape | null = null;

    switch (shape.type) {
      case 'brush':
      case 'pencil':
      case 'eraser':
        updatedShape = {
          ...shape,
          points: [...(shape as FreeDrawShape).points, pos.x, pos.y],
        } as FreeDrawShape;
        break;

      case 'rectangle':
        const rectShape = shape as RectangleShape;
        updatedShape = {
          ...rectShape,
          width: pos.x - rectShape.x,
          height: pos.y - rectShape.y,
        } as RectangleShape;
        break;

      case 'circle':
        const circleShape = shape as CircleShape;
        updatedShape = {
          ...circleShape,
          radiusX: Math.abs(pos.x - circleShape.x),
          radiusY: Math.abs(pos.y - circleShape.y),
        } as CircleShape;
        break;

      case 'arrow':
      case 'line':
        const lineShape = shape as ArrowShape | LineShape;
        const startX = lineShape.points[0];
        const startY = lineShape.points[1];
        updatedShape = {
          ...lineShape,
          points: [startX, startY, pos.x, pos.y],
        } as ArrowShape | LineShape;
        break;
    }

    if (updatedShape) {
      currentShapeRef.current = updatedShape;
      setCurrentShape(updatedShape);
    }
  }, [isDisplayMode, getPointerPosition]);

  // Throttled mouse move handler for better performance
  const handleMouseMove = useCallback(() => {
    if (!isDrawing.current || isDisplayMode) return;

    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTimeRef.current;

    if (timeSinceLastMove >= THROTTLE_MS) {
      // Enough time has passed, process immediately
      lastMoveTimeRef.current = now;
      processMouseMove();
    } else {
      // Schedule for later if not already scheduled
      if (!pendingMoveRef.current) {
        pendingMoveRef.current = () => {
          lastMoveTimeRef.current = Date.now();
          processMouseMove();
          pendingMoveRef.current = null;
        };
        setTimeout(pendingMoveRef.current, THROTTLE_MS - timeSinceLastMove);
      }
    }
  }, [isDisplayMode, processMouseMove]);

  const handleMouseUp = useCallback(() => {
    // Process any pending move before finishing
    if (pendingMoveRef.current) {
      pendingMoveRef.current();
      pendingMoveRef.current = null;
    }
    
    if (!isDrawing.current || !currentShapeRef.current) return;
    
    isDrawing.current = false;
    
    // Only add shape if it has some size
    const shape = currentShapeRef.current;
    let shouldAdd = true;

    if (shape.type === 'rectangle') {
      const rect = shape as RectangleShape;
      shouldAdd = Math.abs(rect.width) > 2 && Math.abs(rect.height) > 2;
    } else if (shape.type === 'circle') {
      const circle = shape as CircleShape;
      shouldAdd = circle.radiusX > 2 || circle.radiusY > 2;
    } else if (shape.type === 'arrow' || shape.type === 'line') {
      const line = shape as ArrowShape | LineShape;
      const dx = line.points[2] - line.points[0];
      const dy = line.points[3] - line.points[1];
      shouldAdd = Math.sqrt(dx * dx + dy * dy) > 2;
    } else if (shape.type === 'brush' || shape.type === 'pencil' || shape.type === 'eraser') {
      const freeShape = shape as FreeDrawShape;
      shouldAdd = freeShape.points.length > 2;
    }

    if (shouldAdd) {
      onShapeAdd(shape);
    }

    currentShapeRef.current = null;
    setCurrentShape(null);
  }, [onShapeAdd]);

  const handleShapeClick = useCallback((e: KonvaEventObject<MouseEvent>, shapeId: string) => {
    if (isDisplayMode) return;
    if (toolSettings.tool === 'select') {
      e.cancelBubble = true;
      onSelect(shapeId);
    }
  }, [isDisplayMode, toolSettings.tool, onSelect]);

  const handleShapeDragEnd = useCallback((shape: Shape, e: KonvaEventObject<DragEvent>) => {
    if (isDisplayMode) return;
    onShapeUpdate({
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [isDisplayMode, onShapeUpdate]);

  const handleTransformEnd = useCallback((shape: Shape, e: any) => {
    if (isDisplayMode) return;
    const node = e.target;
    
    onShapeUpdate({
      ...shape,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  }, [isDisplayMode, onShapeUpdate]);

  const renderShape = (shape: Shape, isCurrentlyDrawing = false) => {
    const isSelected = selectedId === shape.id && !isCurrentlyDrawing;
    const commonProps = {
      onClick: (e: KonvaEventObject<MouseEvent>) => handleShapeClick(e, shape.id),
      onTap: () => handleShapeClick({ cancelBubble: true } as any, shape.id),
    };

    switch (shape.type) {
      case 'brush':
      case 'pencil':
      case 'eraser':
        const freeShape = shape as FreeDrawShape;
        return (
          <Line
            key={shape.id}
            {...commonProps}
            points={freeShape.points}
            stroke={freeShape.stroke}
            strokeWidth={freeShape.strokeWidth}
            tension={freeShape.tension}
            lineCap={freeShape.lineCap}
            lineJoin={freeShape.lineJoin}
            opacity={freeShape.opacity}
            globalCompositeOperation={freeShape.globalCompositeOperation as any}
          />
        );

      case 'rectangle':
        const rectShape = shape as RectangleShape;
        return (
          <React.Fragment key={shape.id}>
            <Rect
              ref={isSelected ? selectedShapeRef : undefined}
              {...commonProps}
              x={rectShape.x}
              y={rectShape.y}
              width={rectShape.width}
              height={rectShape.height}
              fill={rectShape.fill}
              stroke={rectShape.stroke}
              strokeWidth={rectShape.strokeWidth}
              cornerRadius={rectShape.cornerRadius}
              opacity={rectShape.opacity}
              rotation={rectShape.rotation}
              scaleX={rectShape.scaleX}
              scaleY={rectShape.scaleY}
              draggable={!isDisplayMode && rectShape.draggable !== false}
              onDragEnd={(e) => handleShapeDragEnd(shape, e)}
              onTransformEnd={(e) => handleTransformEnd(shape, e)}
            />
          </React.Fragment>
        );

      case 'circle':
        const circleShape = shape as CircleShape;
        return (
          <React.Fragment key={shape.id}>
            <Ellipse
              ref={isSelected ? selectedShapeRef : undefined}
              {...commonProps}
              x={circleShape.x}
              y={circleShape.y}
              radiusX={circleShape.radiusX}
              radiusY={circleShape.radiusY}
              fill={circleShape.fill}
              stroke={circleShape.stroke}
              strokeWidth={circleShape.strokeWidth}
              opacity={circleShape.opacity}
              rotation={circleShape.rotation}
              scaleX={circleShape.scaleX}
              scaleY={circleShape.scaleY}
              draggable={!isDisplayMode && circleShape.draggable !== false}
              onDragEnd={(e) => handleShapeDragEnd(shape, e)}
              onTransformEnd={(e) => handleTransformEnd(shape, e)}
            />
          </React.Fragment>
        );

      case 'arrow':
        const arrowShape = shape as ArrowShape;
        return (
          <React.Fragment key={shape.id}>
            <Arrow
              ref={isSelected ? selectedShapeRef : undefined}
              {...commonProps}
              points={arrowShape.points}
              stroke={arrowShape.stroke}
              strokeWidth={arrowShape.strokeWidth}
              fill={arrowShape.fill}
              pointerLength={arrowShape.pointerLength}
              pointerWidth={arrowShape.pointerWidth}
              opacity={arrowShape.opacity}
              draggable={!isDisplayMode && arrowShape.draggable !== false}
              onDragEnd={(e) => handleShapeDragEnd(shape, e)}
              onTransformEnd={(e) => handleTransformEnd(shape, e)}
            />
          </React.Fragment>
        );

      case 'line':
        const lineShape = shape as LineShape;
        return (
          <React.Fragment key={shape.id}>
            <Line
              ref={isSelected ? selectedShapeRef : undefined}
              {...commonProps}
              points={lineShape.points}
              stroke={lineShape.stroke}
              strokeWidth={lineShape.strokeWidth}
              lineCap={lineShape.lineCap}
              opacity={lineShape.opacity}
              draggable={!isDisplayMode && lineShape.draggable !== false}
              onDragEnd={(e) => handleShapeDragEnd(shape, e)}
              onTransformEnd={(e) => handleTransformEnd(shape, e)}
            />
          </React.Fragment>
        );

      case 'text':
        const textShape = shape as TextShape;
        return (
          <React.Fragment key={shape.id}>
            <Text
              ref={isSelected ? selectedShapeRef : undefined}
              {...commonProps}
              x={textShape.x}
              y={textShape.y}
              text={textShape.text}
              fontSize={textShape.fontSize}
              fontFamily={textShape.fontFamily}
              fill={textShape.fill}
              opacity={textShape.opacity}
              rotation={textShape.rotation}
              scaleX={textShape.scaleX}
              scaleY={textShape.scaleY}
              draggable={!isDisplayMode && textShape.draggable !== false}
              onDragEnd={(e) => handleShapeDragEnd(shape, e)}
              onTransformEnd={(e) => handleTransformEnd(shape, e)}
            />
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef as any}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={{ 
        backgroundColor: isDisplayMode ? 'transparent' : '#1a1a2e',
        cursor: toolSettings.tool === 'select' ? 'default' : 'crosshair',
      }}
    >
      <Layer>
        {shapes.map(shape => renderShape(shape))}
        {currentShape && renderShape(currentShape, true)}
        {selectedId && !isDisplayMode && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};
