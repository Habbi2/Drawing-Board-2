// Drawing tool types
export type Tool = 
  | 'brush' 
  | 'pencil' 
  | 'eraser' 
  | 'rectangle' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'text' 
  | 'image'
  | 'select';

// Base shape interface
export interface BaseShape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  draggable?: boolean;
}

// Free drawing (brush/pencil/eraser)
export interface FreeDrawShape extends BaseShape {
  type: 'brush' | 'pencil' | 'eraser';
  points: number[];
  stroke: string;
  strokeWidth: number;
  tension?: number;
  lineCap?: 'round' | 'butt' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
  globalCompositeOperation?: string;
}

// Rectangle shape
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

// Circle/Ellipse shape
export interface CircleShape extends BaseShape {
  type: 'circle';
  radiusX: number;
  radiusY: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// Arrow shape
export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: number[];
  stroke: string;
  strokeWidth: number;
  fill?: string;
  pointerLength?: number;
  pointerWidth?: number;
}

// Line shape
export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  lineCap?: 'round' | 'butt' | 'square';
}

// Text shape
export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

// Image shape
export interface ImageShape extends BaseShape {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

// Union type for all shapes
export type Shape = 
  | FreeDrawShape 
  | RectangleShape 
  | CircleShape 
  | ArrowShape 
  | LineShape 
  | TextShape 
  | ImageShape;

// Drawing state
export interface DrawingState {
  shapes: Shape[];
  selectedId: string | null;
}

// Tool settings
export interface ToolSettings {
  tool: Tool;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

// Canvas sync message types
export interface CanvasSyncMessage {
  type: 'add_shape' | 'update_shape' | 'delete_shape' | 'clear' | 'full_sync' | 'request_sync';
  payload: Shape | Shape[] | string | null;
  sessionId: string;
  timestamp: number;
}

// Saved drawing
export interface SavedDrawing {
  id: string;
  name: string;
  canvas_data: Shape[];
  created_at: string;
  updated_at: string;
}

// History for undo/redo
export interface HistoryState {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
}
