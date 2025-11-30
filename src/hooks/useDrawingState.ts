'use client';

import { useState, useCallback, useRef } from 'react';
import { Shape, HistoryState } from '@/lib/types';

const MAX_HISTORY = 50;

export function useDrawingState(initialShapes: Shape[] = []) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialShapes,
    future: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Ref to track if we should skip history for external updates
  const skipHistoryRef = useRef(false);

  const shapes = history.present;

  const pushToHistory = useCallback((newShapes: Shape[]) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      setHistory(prev => ({
        ...prev,
        present: newShapes,
      }));
      return;
    }

    setHistory(prev => ({
      past: [...prev.past, prev.present].slice(-MAX_HISTORY),
      present: newShapes,
      future: [],
    }));
  }, []);

  const addShape = useCallback((shape: Shape) => {
    pushToHistory([...history.present, shape]);
  }, [history.present, pushToHistory]);

  const updateShape = useCallback((updatedShape: Shape) => {
    const newShapes = history.present.map(shape =>
      shape.id === updatedShape.id ? updatedShape : shape
    );
    pushToHistory(newShapes);
  }, [history.present, pushToHistory]);

  const deleteShape = useCallback((shapeId: string) => {
    const newShapes = history.present.filter(shape => shape.id !== shapeId);
    pushToHistory(newShapes);
    if (selectedId === shapeId) {
      setSelectedId(null);
    }
  }, [history.present, pushToHistory, selectedId]);

  const clearAll = useCallback(() => {
    pushToHistory([]);
    setSelectedId(null);
  }, [pushToHistory]);

  const setShapes = useCallback((newShapes: Shape[], addToHistory = true) => {
    if (!addToHistory) {
      skipHistoryRef.current = true;
    }
    pushToHistory(newShapes);
  }, [pushToHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
    setSelectedId(null);
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Move shape in z-order
  const bringForward = useCallback(() => {
    if (!selectedId) return;
    
    const index = history.present.findIndex(s => s.id === selectedId);
    if (index === -1 || index === history.present.length - 1) return;
    
    const newShapes = [...history.present];
    [newShapes[index], newShapes[index + 1]] = [newShapes[index + 1], newShapes[index]];
    pushToHistory(newShapes);
  }, [selectedId, history.present, pushToHistory]);

  const sendBackward = useCallback(() => {
    if (!selectedId) return;
    
    const index = history.present.findIndex(s => s.id === selectedId);
    if (index <= 0) return;
    
    const newShapes = [...history.present];
    [newShapes[index], newShapes[index - 1]] = [newShapes[index - 1], newShapes[index]];
    pushToHistory(newShapes);
  }, [selectedId, history.present, pushToHistory]);

  const bringToFront = useCallback(() => {
    if (!selectedId) return;
    
    const shape = history.present.find(s => s.id === selectedId);
    if (!shape) return;
    
    const newShapes = history.present.filter(s => s.id !== selectedId);
    newShapes.push(shape);
    pushToHistory(newShapes);
  }, [selectedId, history.present, pushToHistory]);

  const sendToBack = useCallback(() => {
    if (!selectedId) return;
    
    const shape = history.present.find(s => s.id === selectedId);
    if (!shape) return;
    
    const newShapes = history.present.filter(s => s.id !== selectedId);
    newShapes.unshift(shape);
    pushToHistory(newShapes);
  }, [selectedId, history.present, pushToHistory]);

  // For external updates (from sync) that shouldn't create history
  const syncAddShape = useCallback((shape: Shape) => {
    setHistory(prev => ({
      ...prev,
      present: [...prev.present, shape],
    }));
  }, []);

  const syncUpdateShape = useCallback((updatedShape: Shape) => {
    setHistory(prev => ({
      ...prev,
      present: prev.present.map(shape =>
        shape.id === updatedShape.id ? updatedShape : shape
      ),
    }));
  }, []);

  const syncDeleteShape = useCallback((shapeId: string) => {
    setHistory(prev => ({
      ...prev,
      present: prev.present.filter(shape => shape.id !== shapeId),
    }));
    if (selectedId === shapeId) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const syncClear = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      present: [],
    }));
    setSelectedId(null);
  }, []);

  const syncFullSync = useCallback((newShapes: Shape[]) => {
    setHistory(prev => ({
      ...prev,
      present: newShapes,
    }));
  }, []);

  return {
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
    // Sync methods (no history)
    syncAddShape,
    syncUpdateShape,
    syncDeleteShape,
    syncClear,
    syncFullSync,
  };
}
