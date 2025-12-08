'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Stage } from 'konva/lib/Stage';
import { Toolbar } from '@/components/Toolbar';
import { LoadDrawingModal } from '@/components/LoadDrawingModal';
import { SaveDrawingModal } from '@/components/SaveDrawingModal';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { usePersistence } from '@/hooks/usePersistence';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Tool, ToolSettings, ImageShape } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Shared session - everyone draws on the same canvas
const SHARED_SESSION = 'shared';

// Dynamic import to avoid SSR issues with Konva
const DrawingCanvas = dynamic(
  () => import('@/components/DrawingCanvas').then(mod => ({ default: mod.DrawingCanvas })),
  { ssr: false }
);

// Admin password from environment variable (fallback for development)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Empedocles2';

function ControlPageContent() {
  const searchParams = useSearchParams();
  const adminParam = searchParams.get('admin');
  const isAdmin = adminParam === ADMIN_PASSWORD;

  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    tool: 'brush',
    strokeColor: '#ffffff',
    fillColor: 'transparent',
    strokeWidth: 5,
    opacity: 1,
    fontSize: 32,
    fontFamily: 'Arial',
  });

  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const stageRef = useRef<Stage>(null);
  const pendingUndoRedoRef = useRef(false);

  const {
    shapes,
    selectedId,
    setSelectedId,
    addShape,
    updateShape,
    deleteShape,
    clearAll,
    setShapes,
    undo,
    redo,
    canUndo,
    canRedo,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    syncAddShape,
    syncUpdateShape,
    syncDeleteShape,
    syncClear,
    syncFullSync,
  } = useDrawingState();

  const {
    drawings,
    currentDrawingId,
    saving,
    loadDrawing,
    saveDrawing,
    deleteDrawing,
    scheduleAutosave,
    createNewDrawing,
    saveToLocalStorage,
    loadFromLocalStorage,
  } = usePersistence(SHARED_SESSION);

  const { uploadImage, uploading } = useImageUpload();

  // Canvas sync for real-time collaboration - control is the controller/broadcaster
  const {
    broadcastAddShape,
    broadcastUpdateShape,
    broadcastDeleteShape,
    broadcastClear,
    broadcastFullSync,
  } = useCanvasSync({
    sessionId: SHARED_SESSION,
    onShapeAdded: syncAddShape,
    onShapeUpdated: syncUpdateShape,
    onShapeDeleted: syncDeleteShape,
    onClear: syncClear,
    onFullSync: syncFullSync,
    isController: true,
    currentShapes: shapes,
  });

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        const maxWidth = container.clientWidth;
        const maxHeight = window.innerHeight - 48; // Account for header
        const aspectRatio = 16 / 9;

        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedShapes = loadFromLocalStorage();
    if (savedShapes && savedShapes.length > 0) {
      setShapes(savedShapes, false);
    }
  }, [loadFromLocalStorage, setShapes]);

  // Save to localStorage and schedule autosave on shape changes
  useEffect(() => {
    saveToLocalStorage(shapes);
    scheduleAutosave(shapes);
  }, [shapes, saveToLocalStorage, scheduleAutosave]);

  // Broadcast full sync after undo/redo
  useEffect(() => {
    if (pendingUndoRedoRef.current) {
      pendingUndoRedoRef.current = false;
      broadcastFullSync(shapes);
    }
  }, [shapes, broadcastFullSync]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            setShowSaveModal(true);
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Handlers with broadcast
  const handleShapeAdd = useCallback((shape: typeof shapes[0]) => {
    addShape(shape);
    broadcastAddShape(shape);
  }, [addShape, broadcastAddShape]);

  const handleShapeUpdate = useCallback((shape: typeof shapes[0]) => {
    updateShape(shape);
    broadcastUpdateShape(shape);
  }, [updateShape, broadcastUpdateShape]);

  const handleUndo = useCallback(() => {
    pendingUndoRedoRef.current = true;
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    pendingUndoRedoRef.current = true;
    redo();
  }, [redo]);

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      clearAll();
      broadcastClear();
    }
  }, [clearAll, broadcastClear]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      deleteShape(selectedId);
      broadcastDeleteShape(selectedId);
    }
  }, [selectedId, deleteShape, broadcastDeleteShape]);

  // Export canvas as PNG
  const handleExport = useCallback(() => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = uri;
      link.click();
    }
  }, []);

  // Save/Load handlers
  const handleSave = useCallback(async (name: string) => {
    await saveDrawing(shapes, name, currentDrawingId || undefined);
    setShowSaveModal(false);
  }, [shapes, currentDrawingId, saveDrawing]);

  const handleLoad = useCallback(async (id: string) => {
    const loadedShapes = await loadDrawing(id);
    if (loadedShapes) {
      setShapes(loadedShapes, false);
      broadcastFullSync(loadedShapes);
    }
    setShowLoadModal(false);
  }, [loadDrawing, setShapes, broadcastFullSync]);

  const handleNew = useCallback(() => {
    if (shapes.length > 0 && !confirm('Start a new drawing? Unsaved changes will be lost.')) {
      return;
    }
    createNewDrawing();
    clearAll();
    broadcastClear();
  }, [shapes.length, createNewDrawing, clearAll, broadcastClear]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      // Create image element to get dimensions
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        // Scale down if too large
        let width = img.width;
        let height = img.height;
        const maxSize = 400;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        const imageShape: ImageShape = {
          id: uuidv4(),
          type: 'image',
          x: canvasSize.width / 2 - width / 2,
          y: canvasSize.height / 2 - height / 2,
          src: url,
          width,
          height,
          draggable: true,
        };

        handleShapeAdd(imageShape);
        setToolSettings(prev => ({ ...prev, tool: 'select' }));
      };
    }
  }, [uploadImage, canvasSize, handleShapeAdd]);

  // Copy display URL
  const handleCopyDisplayUrl = useCallback(() => {
    const url = `${window.location.origin}/display`;
    navigator.clipboard.writeText(url);
    alert('Display URL copied to clipboard!\n\nAdd this as a Browser Source in OBS.');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4">
        <h1 className="text-white font-semibold">Drawing Board</h1>
        <span className="ml-auto text-gray-400 text-sm flex items-center gap-3">
          {isAdmin && <span className="text-green-400 font-medium">🔐 Admin</span>}
          {saving && <span className="text-yellow-400">Saving...</span>}
          {uploading && <span className="text-yellow-400">Uploading...</span>}
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
          <Toolbar
            toolSettings={toolSettings}
            onToolChange={(tool) => setToolSettings(prev => ({ ...prev, tool }))}
            onStrokeColorChange={(color) => setToolSettings(prev => ({ ...prev, strokeColor: color }))}
            onFillColorChange={(color) => setToolSettings(prev => ({ ...prev, fillColor: color }))}
            onStrokeWidthChange={(width) => setToolSettings(prev => ({ ...prev, strokeWidth: width }))}
            onOpacityChange={(opacity) => setToolSettings(prev => ({ ...prev, opacity }))}
            onFontSizeChange={(size) => setToolSettings(prev => ({ ...prev, fontSize: size }))}
            onFontFamilyChange={(family) => setToolSettings(prev => ({ ...prev, fontFamily: family }))}
            canUndo={canUndo}
            canRedo={canRedo}
            hasSelection={!!selectedId}
            isAdmin={isAdmin}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onExport={handleExport}
            onSave={() => setShowSaveModal(true)}
            onLoad={() => setShowLoadModal(true)}
            onNew={handleNew}
            onDelete={handleDeleteSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onImageUpload={handleImageUpload}
            onCopyDisplayUrl={handleCopyDisplayUrl}
            saving={saving}
          />
        </aside>

        {/* Canvas Area */}
        <main id="canvas-container" className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="shadow-2xl rounded-lg overflow-hidden">
            <DrawingCanvas
              shapes={shapes}
              selectedId={selectedId}
              toolSettings={toolSettings}
              width={canvasSize.width}
              height={canvasSize.height}
              onShapeAdd={handleShapeAdd}
              onShapeUpdate={handleShapeUpdate}
              onSelect={setSelectedId}
              stageRef={stageRef}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <LoadDrawingModal
        isOpen={showLoadModal}
        drawings={drawings}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoad}
        onDelete={deleteDrawing}
      />

      <SaveDrawingModal
        isOpen={showSaveModal}
        currentName={drawings.find(d => d.id === currentDrawingId)?.name}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
      />
    </div>
  );
}

export default function ControlPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <ControlPageContent />
    </Suspense>
  );
}
