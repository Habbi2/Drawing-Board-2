'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { usePersistence } from '@/hooks/usePersistence';
import { ToolSettings } from '@/lib/types';

// Dynamic import to avoid SSR issues with Konva
const DrawingCanvas = dynamic(
  () => import('@/components/DrawingCanvas').then(mod => ({ default: mod.DrawingCanvas })),
  { ssr: false }
);

export default function DisplayPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || 'default';
  const urlWidth = searchParams.get('width');
  const urlHeight = searchParams.get('height');

  const [canvasSize, setCanvasSize] = useState({
    width: urlWidth ? parseInt(urlWidth) : 1920,
    height: urlHeight ? parseInt(urlHeight) : 1080,
  });

  const [isReady, setIsReady] = useState(false);

  // Default tool settings (not used in display mode, but required by canvas)
  const toolSettings: ToolSettings = {
    tool: 'select',
    strokeColor: '#ffffff',
    fillColor: 'transparent',
    strokeWidth: 5,
    opacity: 1,
    fontSize: 32,
    fontFamily: 'Arial',
  };

  const {
    shapes,
    syncAddShape,
    syncUpdateShape,
    syncDeleteShape,
    syncClear,
    syncFullSync,
    undo,
    redo,
    setShapes,
  } = useDrawingState();

  const { loadFromLocalStorage } = usePersistence(sessionId);

  // Canvas sync for real-time updates
  useCanvasSync({
    sessionId,
    onShapeAdded: syncAddShape,
    onShapeUpdated: syncUpdateShape,
    onShapeDeleted: syncDeleteShape,
    onClear: syncClear,
    onFullSync: syncFullSync,
    onUndo: undo,
    onRedo: redo,
  });

  // Update canvas size from URL params
  useEffect(() => {
    if (urlWidth && urlHeight) {
      setCanvasSize({
        width: parseInt(urlWidth),
        height: parseInt(urlHeight),
      });
    }
  }, [urlWidth, urlHeight]);

  // Load from localStorage on mount and poll for changes
  const lastSyncRef = useRef<string>('');
  
  useEffect(() => {
    const loadShapes = () => {
      const savedShapes = loadFromLocalStorage();
      if (savedShapes) {
        const shapesJson = JSON.stringify(savedShapes);
        // Only update if shapes have actually changed
        if (shapesJson !== lastSyncRef.current) {
          lastSyncRef.current = shapesJson;
          setShapes(savedShapes, false);
        }
      }
    };

    // Initial load
    loadShapes();
    setIsReady(true);

    // Poll localStorage every 500ms for changes (backup sync)
    const interval = setInterval(loadShapes, 500);

    return () => clearInterval(interval);
  }, [loadFromLocalStorage, setShapes]);

  // Empty handlers for display mode (read-only)
  const handleShapeAdd = useCallback(() => {}, []);
  const handleShapeUpdate = useCallback(() => {}, []);
  const handleSelect = useCallback(() => {}, []);

  if (!isReady) {
    return null; // Don't render until ready
  }

  return (
    <div 
      className="w-screen h-screen overflow-hidden"
      style={{ 
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
      }}
    >
      <DrawingCanvas
        shapes={shapes}
        selectedId={null}
        toolSettings={toolSettings}
        width={canvasSize.width}
        height={canvasSize.height}
        isDisplayMode={true}
        onShapeAdd={handleShapeAdd}
        onShapeUpdate={handleShapeUpdate}
        onSelect={handleSelect}
      />
    </div>
  );
}
