'use client';

import React from 'react';
import { Tool, ToolSettings } from '@/lib/types';
import { 
  Paintbrush, 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Type, 
  MousePointer2,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  FolderOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
} from 'lucide-react';

interface ToolbarProps {
  toolSettings: ToolSettings;
  onToolChange: (tool: Tool) => void;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isAdmin: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onCopyDisplayUrl: () => void;
  saving?: boolean;
}

const tools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
  { tool: 'brush', icon: <Paintbrush size={20} />, label: 'Brush' },
  { tool: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
  { tool: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  { tool: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
  { tool: 'circle', icon: <Circle size={20} />, label: 'Circle' },
  { tool: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
  { tool: 'line', icon: <Minus size={20} />, label: 'Line' },
  { tool: 'text', icon: <Type size={20} />, label: 'Text' },
];

const colors = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
  '#00ff88', '#ff0088', '#88ff00', '#0088ff', '#ff8888',
];

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Courier New',
];

export const Toolbar: React.FC<ToolbarProps> = ({
  toolSettings,
  onToolChange,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onFontSizeChange,
  onFontFamilyChange,
  canUndo,
  canRedo,
  hasSelection,
  isAdmin,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onSave,
  onLoad,
  onNew,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onCopyDisplayUrl,
  saving,
}) => {
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 flex flex-col gap-4 h-full overflow-y-auto">
      {/* File Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File</h3>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              onClick={onNew}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="New Drawing (Admin Only)"
            >
              <Plus size={20} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onSave}
              disabled={saving}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Save Drawing (Admin Only)"
            >
              <Save size={20} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onLoad}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Load Drawing (Admin Only)"
            >
              <FolderOpen size={20} />
            </button>
          )}
          <button
            onClick={onExport}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Export PNG"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* History Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
          {isAdmin && (
            <button
              onClick={onClear}
              className="p-2 rounded bg-red-800 hover:bg-red-700 transition-colors"
              title="Clear All (Admin Only)"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tools */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tools</h3>
        <div className="grid grid-cols-5 gap-1">
          {tools.map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              className={`p-2 rounded transition-colors ${
                toolSettings.tool === tool
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Order (when selection exists) */}
      {hasSelection && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layer</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBringToFront}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Bring to Front"
            >
              <ChevronsUp size={20} />
            </button>
            <button
              onClick={onBringForward}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Bring Forward"
            >
              <ArrowUp size={20} />
            </button>
            <button
              onClick={onSendBackward}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Send Backward"
            >
              <ArrowDown size={20} />
            </button>
            <button
              onClick={onSendToBack}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Send to Back"
            >
              <ChevronsDown size={20} />
            </button>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="p-2 rounded bg-red-800 hover:bg-red-700 transition-colors"
                title="Delete Selected (Admin Only)"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stroke Color */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stroke Color</h3>
        <div className="grid grid-cols-5 gap-1">
          {colors.map((color) => (
            <button
              key={`stroke-${color}`}
              onClick={() => onStrokeColorChange(color)}
              className={`w-8 h-8 rounded border-2 transition-all ${
                toolSettings.strokeColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={toolSettings.strokeColor}
          onChange={(e) => onStrokeColorChange(e.target.value)}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>

      {/* Fill Color (for shapes) */}
      {['rectangle', 'circle'].includes(toolSettings.tool) && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fill Color</h3>
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() => onFillColorChange('transparent')}
              className={`w-8 h-8 rounded border-2 transition-all bg-gray-800 ${
                toolSettings.fillColor === 'transparent'
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              title="No Fill"
            >
              <span className="text-xs">∅</span>
            </button>
            {colors.slice(0, 4).map((color) => (
              <button
                key={`fill-${color}`}
                onClick={() => onFillColorChange(color)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  toolSettings.fillColor === color
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <input
            type="color"
            value={toolSettings.fillColor === 'transparent' ? '#ffffff' : toolSettings.fillColor}
            onChange={(e) => onFillColorChange(e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Stroke Width */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Stroke Width: {toolSettings.strokeWidth}px
        </h3>
        <input
          type="range"
          min="1"
          max="50"
          value={toolSettings.strokeWidth}
          onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Opacity: {Math.round(toolSettings.opacity * 100)}%
        </h3>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={toolSettings.opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Text Settings */}
      {toolSettings.tool === 'text' && (
        <>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Font Size: {toolSettings.fontSize}px
            </h3>
            <input
              type="range"
              min="12"
              max="120"
              value={toolSettings.fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Font Family</h3>
            <select
              value={toolSettings.fontFamily}
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="w-full bg-gray-800 rounded p-2 text-sm"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* OBS Integration */}
      <div className="space-y-2 mt-auto pt-4 border-t border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OBS Integration</h3>
        <button
          onClick={onCopyDisplayUrl}
          className="w-full p-2 rounded bg-purple-700 hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Copy size={16} />
          Copy Display URL
        </button>
        <p className="text-xs text-gray-500">
          Add this URL as a Browser Source in OBS to display the canvas.
        </p>
      </div>
    </div>
  );
};
