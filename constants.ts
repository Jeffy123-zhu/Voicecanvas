import { ArtStyle } from "./types";

export const DEFAULT_STYLE: ArtStyle = 'Watercolor';

export const STYLES: { id: ArtStyle; name: string; description: string }[] = [
  { id: 'Watercolor', name: 'Watercolor', description: 'Soft, flowing, bleeding colors' },
  { id: 'Abstract', name: 'Abstract', description: 'Geometric, bold shapes' },
  { id: 'Impressionist', name: 'Impressionist', description: 'Textured, small strokes' },
  { id: 'Neon', name: 'Neon', description: 'Vibrant, glowing lines on dark' },
];

export const EMOTION_COLORS: Record<string, string[]> = {
  Happy: ['#FFD700', '#FFA500', '#FF69B4', '#00FF7F'],
  Sad: ['#4682B4', '#483D8B', '#708090', '#B0C4DE'],
  Angry: ['#FF4500', '#8B0000', '#2F4F4F', '#000000'],
  Calm: ['#E0FFFF', '#98FB98', '#87CEEB', '#F0F8FF'],
  Excited: ['#FF1493', '#FFFF00', '#00FFFF', '#FF4500'],
  Neutral: ['#D3D3D3', '#F5F5DC', '#FFE4E1', '#E6E6FA'],
  Anxious: ['#800080', '#4B0082', '#2F4F4F', '#778899'],
};

export const SYSTEM_INSTRUCTION = `
You are an expert art director and audio analyst. 
Analyze the user's speech audio to control a generative art display.
Extract the following:
1. Primary Emotion (Happy, Sad, Angry, Calm, Excited, Neutral, Anxious)
2. Confidence of emotion (0-100)
3. Speech Tempo (Slow, Medium, Fast)
4. Key visual words (nouns/adjectives that can be visualized, e.g., "ocean", "fire", "soft") - max 3
5. A color palette of 3 hex codes that perfectly matches the mood and content.

Output strict JSON.
`;
