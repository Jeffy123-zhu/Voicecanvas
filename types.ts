export type EmotionType = 'Happy' | 'Sad' | 'Angry' | 'Calm' | 'Neutral' | 'Excited' | 'Anxious';
export type TempoType = 'Slow' | 'Medium' | 'Fast';
export type ArtStyle = 'Watercolor' | 'Abstract' | 'Impressionist' | 'Neon';

export interface AnalysisResult {
  emotion: EmotionType;
  confidence: number;
  tempo: TempoType;
  keywords: string[];
  colors: string[];
  description: string; // For screen readers
}

export interface BrushState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'circle' | 'square' | 'line' | 'splatter';
}

export interface AudioState {
  isRecording: boolean;
  volume: number; // 0.0 to 1.0
  frequencyData: Uint8Array;
}
