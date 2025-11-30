'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Shape, SavedDrawing } from '@/lib/types';

const AUTOSAVE_DELAY = 5000; // 5 seconds

export function usePersistence(sessionId: string) {
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load all drawings list
  const loadDrawings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (err) {
      console.error('Failed to load drawings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drawings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load a specific drawing
  const loadDrawing = useCallback(async (id: string): Promise<Shape[] | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCurrentDrawingId(id);
      lastSavedRef.current = JSON.stringify(data.canvas_data);
      return data.canvas_data as Shape[];
    } catch (err) {
      console.error('Failed to load drawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drawing');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save drawing
  const saveDrawing = useCallback(async (
    shapes: Shape[],
    name?: string,
    id?: string
  ): Promise<string | null> => {
    setSaving(true);
    try {
      const canvasData = JSON.stringify(shapes);
      
      // Skip if nothing changed
      if (id && canvasData === lastSavedRef.current) {
        setSaving(false);
        return id;
      }

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('drawings')
          .update({
            canvas_data: shapes,
            updated_at: new Date().toISOString(),
            ...(name && { name }),
          })
          .eq('id', id);

        if (error) throw error;
        lastSavedRef.current = canvasData;
        await loadDrawings();
        return id;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('drawings')
          .insert({
            name: name || `Drawing ${new Date().toLocaleString()}`,
            canvas_data: shapes,
          })
          .select()
          .single();

        if (error) throw error;
        
        setCurrentDrawingId(data.id);
        lastSavedRef.current = canvasData;
        await loadDrawings();
        return data.id;
      }
    } catch (err) {
      console.error('Failed to save drawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to save drawing');
      return null;
    } finally {
      setSaving(false);
    }
  }, [loadDrawings]);

  // Delete drawing
  const deleteDrawing = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (currentDrawingId === id) {
        setCurrentDrawingId(null);
        lastSavedRef.current = '';
      }
      
      await loadDrawings();
      return true;
    } catch (err) {
      console.error('Failed to delete drawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete drawing');
      return false;
    }
  }, [currentDrawingId, loadDrawings]);

  // Autosave functionality
  const scheduleAutosave = useCallback((shapes: Shape[]) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (currentDrawingId) {
        await saveDrawing(shapes, undefined, currentDrawingId);
      }
    }, AUTOSAVE_DELAY);
  }, [currentDrawingId, saveDrawing]);

  // Create new drawing
  const createNewDrawing = useCallback(() => {
    setCurrentDrawingId(null);
    lastSavedRef.current = '';
  }, []);

  // Load drawings on mount
  useEffect(() => {
    loadDrawings();
  }, [loadDrawings]);

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Load from localStorage as fallback
  const saveToLocalStorage = useCallback((shapes: Shape[]) => {
    try {
      localStorage.setItem(`drawing-board-${sessionId}`, JSON.stringify(shapes));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [sessionId]);

  const loadFromLocalStorage = useCallback((): Shape[] | null => {
    try {
      const data = localStorage.getItem(`drawing-board-${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  }, [sessionId]);

  return {
    drawings,
    currentDrawingId,
    loading,
    saving,
    error,
    loadDrawings,
    loadDrawing,
    saveDrawing,
    deleteDrawing,
    scheduleAutosave,
    createNewDrawing,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}
