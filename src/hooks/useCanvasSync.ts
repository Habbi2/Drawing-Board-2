'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
  // Current shapes for responding to sync requests (only needed for control)
  currentShapes?: Shape[];
  // Is this the control panel (broadcaster) or display (receiver)?
  isController?: boolean;
}

export function useCanvasSync({
  sessionId,
  onShapeAdded,
  onShapeUpdated,
  onShapeDeleted,
  onClear,
  onFullSync,
  currentShapes,
  isController = false,
}: UseCanvasSyncProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentShapesRef = useRef<Shape[]>(currentShapes || []);

  // Keep ref updated with current shapes
  useEffect(() => {
    currentShapesRef.current = currentShapes || [];
  }, [currentShapes]);

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
          case 'request_sync':
            // Only controller responds to sync requests - broadcast current shapes
            if (isController && currentShapesRef.current) {
              // Use setTimeout to ensure we're not in the middle of the message handler
              setTimeout(() => {
                channel.send({
                  type: 'broadcast',
                  event: 'canvas_update',
                  payload: {
                    type: 'full_sync',
                    payload: currentShapesRef.current,
                    sessionId,
                    timestamp: Date.now(),
                  } as CanvasSyncMessage,
                });
              }, 10);
            }
            break;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // If this is a display client, request sync from controller
          if (!isController) {
            setTimeout(() => {
              channel.send({
                type: 'broadcast',
                event: 'canvas_update',
                payload: {
                  type: 'request_sync',
                  payload: null,
                  sessionId,
                  timestamp: Date.now(),
                } as CanvasSyncMessage,
              });
            }, 100); // Small delay to ensure controller is ready
          }
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, onShapeAdded, onShapeUpdated, onShapeDeleted, onClear, onFullSync, isController]);

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

  const requestSync = useCallback(() => {
    broadcast('request_sync', null);
  }, [broadcast]);

  return {
    broadcastAddShape,
    broadcastUpdateShape,
    broadcastDeleteShape,
    broadcastClear,
    broadcastFullSync,
    requestSync,
    isConnected,
  };
}
