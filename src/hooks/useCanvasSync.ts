'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase, CANVAS_CHANNEL } from '@/lib/supabase';
import { Shape, CanvasSyncMessage } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseCanvasSyncProps {
  sessionId: string;
  onShapeAdded: (shape: Shape) => void;
  onShapeUpdated: (shape: Shape) => void;
  onShapeDeleted: (shapeId: string) => void;
  onClear: () => void;
  onFullSync: (shapes: Shape[]) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useCanvasSync({
  sessionId,
  onShapeAdded,
  onShapeUpdated,
  onShapeDeleted,
  onClear,
  onFullSync,
  onUndo,
  onRedo,
}: UseCanvasSyncProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `${CANVAS_CHANNEL}:${sessionId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // Don't receive own messages
        },
      },
    });

    channel
      .on('broadcast', { event: 'canvas_update' }, ({ payload }) => {
        const message = payload as CanvasSyncMessage;
        
        switch (message.type) {
          case 'add_shape':
            onShapeAdded(message.payload as Shape);
            break;
          case 'update_shape':
            onShapeUpdated(message.payload as Shape);
            break;
          case 'delete_shape':
            onShapeDeleted(message.payload as string);
            break;
          case 'clear':
            onClear();
            break;
          case 'full_sync':
            onFullSync(message.payload as Shape[]);
            break;
          case 'undo':
            onUndo();
            break;
          case 'redo':
            onRedo();
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, onShapeAdded, onShapeUpdated, onShapeDeleted, onClear, onFullSync, onUndo, onRedo]);

  const broadcast = useCallback((type: CanvasSyncMessage['type'], payload: CanvasSyncMessage['payload']) => {
    if (channelRef.current) {
      const message: CanvasSyncMessage = {
        type,
        payload,
        sessionId,
        timestamp: Date.now(),
      };
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'canvas_update',
        payload: message,
      });
    }
  }, [sessionId]);

  const broadcastAddShape = useCallback((shape: Shape) => {
    broadcast('add_shape', shape);
  }, [broadcast]);

  const broadcastUpdateShape = useCallback((shape: Shape) => {
    broadcast('update_shape', shape);
  }, [broadcast]);

  const broadcastDeleteShape = useCallback((shapeId: string) => {
    broadcast('delete_shape', shapeId);
  }, [broadcast]);

  const broadcastClear = useCallback(() => {
    broadcast('clear', null);
  }, [broadcast]);

  const broadcastFullSync = useCallback((shapes: Shape[]) => {
    broadcast('full_sync', shapes);
  }, [broadcast]);

  const broadcastUndo = useCallback(() => {
    broadcast('undo', null);
  }, [broadcast]);

  const broadcastRedo = useCallback(() => {
    broadcast('redo', null);
  }, [broadcast]);

  return {
    broadcastAddShape,
    broadcastUpdateShape,
    broadcastDeleteShape,
    broadcastClear,
    broadcastFullSync,
    broadcastUndo,
    broadcastRedo,
  };
}
