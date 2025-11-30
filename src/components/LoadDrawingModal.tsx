'use client';

import React, { useState } from 'react';
import { SavedDrawing } from '@/lib/types';
import { Trash2, X } from 'lucide-react';

interface LoadDrawingModalProps {
  isOpen: boolean;
  drawings: SavedDrawing[];
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LoadDrawingModal: React.FC<LoadDrawingModalProps> = ({
  isOpen,
  drawings,
  onClose,
  onLoad,
  onDelete,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Load Drawing</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {drawings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No saved drawings found.</p>
          ) : (
            <div className="space-y-2">
              {drawings.map((drawing) => (
                <div
                  key={drawing.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <button
                    onClick={() => onLoad(drawing.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-white font-medium">{drawing.name}</div>
                    <div className="text-xs text-gray-400">
                      Updated: {new Date(drawing.updated_at).toLocaleString()}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(drawing.id)}
                    className={`p-2 rounded transition-colors ${
                      deleteConfirm === drawing.id
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={deleteConfirm === drawing.id ? 'Click again to confirm' : 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
