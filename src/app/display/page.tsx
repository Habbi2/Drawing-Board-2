'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { ToolSettings } from '@/lib/types';

// Shared session - same as control page
const SHARED_SESSION = 'shared';

// Dynamic import to avoid SSR issues with Konva
const DrawingCanvas = dynamic(
  () => import('@/components/DrawingCanvas').then(mod => ({ default: mod.DrawingCanvas })),
  { ssr: false }
);

function DisplayPageContent() {
  // Fixed canvas size for OBS (1080p)
  const [canvasSize] = useState({
    width: 1920,
    height: 1080,
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
  } = useDrawingState();

  // Canvas sync for real-time updates - display is NOT controller
  const { isConnected, requestSync } = useCanvasSync({
    sessionId: SHARED_SESSION,
    onShapeAdded: syncAddShape,
    onShapeUpdated: syncUpdateShape,
    onShapeDeleted: syncDeleteShape,
    onClear: syncClear,
    onFullSync: syncFullSync,
    isController: false,
  });

  // Mark ready once connected
  useEffect(() => {
    if (isConnected) {
      setIsReady(true);
    }
  }, [isConnected]);

  // Periodically request sync as a fallback (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        requestSync();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, requestSync]);

  // Empty handlers for display mode (read-only)
  const handleShapeAdd = useCallback(() => {}, []);
  const handleShapeUpdate = useCallback(() => {}, []);
  const handleSelect = useCallback(() => {}, []);

  // Show nothing until ready (prevents flash)
  if (!isReady) {
    return null;
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

export default function DisplayPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: 'transparent' }} />}>
      <DisplayPageContent />
    </Suspense>
  );
}
