'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { ToolSettings, Shape } from '@/lib/types';
import { usePersistence } from '@/hooks/usePersistence';

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
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [fallbackShapes, setFallbackShapes] = useState<Shape[] | null>(null);

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

  // Persistence for fallback loading
  const { drawings, loadDrawing, loadFromLocalStorage } = usePersistence(SHARED_SESSION);

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


  // Mark ready once connected, or fallback to DB/localStorage if not connected after 2s
  useEffect(() => {
    let fallbackTimeout: NodeJS.Timeout;
    if (isConnected) {
      setIsReady(true);
    } else {
      fallbackTimeout = setTimeout(async () => {
        // Only run fallback if not already loaded
        if (!isConnected && !fallbackLoaded) {
          // Try to load latest drawing from DB
          if (drawings && drawings.length > 0) {
            const latest = drawings[0];
            const loaded = await loadDrawing(latest.id);
            setFallbackShapes(loaded || null);
          } else {
            // Fallback to localStorage
            const local = loadFromLocalStorage();
            setFallbackShapes(local);
          }
          setFallbackLoaded(true);
          setIsReady(true);
        }
      }, 2000);
    }
    return () => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [isConnected, drawings, loadDrawing, loadFromLocalStorage, fallbackLoaded]);

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

  // Use fallback shapes if not connected
  const displayShapes = isConnected ? shapes : (fallbackShapes || []);

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
        shapes={displayShapes}
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
