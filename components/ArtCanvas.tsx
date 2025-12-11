import React, { useRef, useEffect, useCallback } from 'react';
import { AnalysisResult, ArtStyle, BrushState } from '../types';

interface ArtCanvasProps {
  analysis: AnalysisResult | null;
  volume: number; // Real-time volume 0-1
  artStyle: ArtStyle;
  isRecording: boolean;
  onUndoPossible: (canUndo: boolean) => void;
  triggerClear: number; // Increment to trigger clear
  triggerUndo: number; // Increment to trigger undo
}

const ArtCanvas: React.FC<ArtCanvasProps> = ({ 
  analysis, 
  volume, 
  artStyle, 
  isRecording,
  onUndoPossible,
  triggerClear,
  triggerUndo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  // State for the generative art
  const brushesRef = useRef<BrushState[]>([]);
  const historyRef = useRef<ImageData[]>([]);
  
  // Configuration derived from analysis (cached for smooth transitions)
  const configRef = useRef({
    colors: ['#ffffff'],
    speedMult: 1,
    sizeMult: 1,
    type: 'circle'
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Save current content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvasRef.current, 0, 0);

        // Resize
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Restore
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.drawImage(tempCanvas, 0, 0, width, height); // Stretch to fit for now
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Config based on Analysis
  useEffect(() => {
    if (analysis) {
      configRef.current.colors = analysis.colors.length > 0 ? analysis.colors : ['#ffffff'];
      
      // Map Tempo to Speed
      switch(analysis.tempo) {
        case 'Fast': configRef.current.speedMult = 2.5; break;
        case 'Slow': configRef.current.speedMult = 0.5; break;
        default: configRef.current.speedMult = 1.0;
      }
      
      // Keywords mapping (simple heuristic)
      const keywords = analysis.keywords.join(' ').toLowerCase();
      if (keywords.includes('tech') || keywords.includes('code') || keywords.includes('sharp')) {
        configRef.current.type = 'square';
      } else if (keywords.includes('line') || keywords.includes('angry')) {
        configRef.current.type = 'line';
      } else {
        configRef.current.type = 'circle';
      }
    }
  }, [analysis]);

  // Handle Clear
  useEffect(() => {
    if (triggerClear > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = artStyle === 'Neon' ? '#0f0f11' : '#ffffff';
        if (artStyle === 'Neon') {
            ctx.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
        } else {
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      brushesRef.current = [];
      historyRef.current = [];
      onUndoPossible(false);
    }
  }, [triggerClear, artStyle, onUndoPossible]);

  // Handle Undo
  useEffect(() => {
    if (triggerUndo > 0 && canvasRef.current && historyRef.current.length > 0) {
      const lastState = historyRef.current.pop();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && lastState) {
        ctx.putImageData(lastState, 0, 0);
      }
      onUndoPossible(historyRef.current.length > 0);
    }
  }, [triggerUndo, onUndoPossible]);

  // Save State periodically (simple undo strategy)
  // We'll save state when user *stops* speaking for a bit, or manually
  // For now, let's save every 5 seconds if there's activity? 
  // Better: Save when recording toggles off, or just store a max of 5 snapshots
  useEffect(() => {
    // Save history when recording stops
    if (!isRecording && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            if (historyRef.current.length > 5) historyRef.current.shift();
            historyRef.current.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
            onUndoPossible(true);
        }
    }
  }, [isRecording, onUndoPossible]);


  // THE ANIMATION LOOP
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background handling based on style
    if (artStyle === 'Neon') {
      // Fade out effect for neon trails
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(15, 15, 17, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
    } else if (artStyle === 'Watercolor') {
      // No clear, just accumulating paint
      ctx.globalCompositeOperation = 'multiply';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // Spawn new brushes if volume is high enough
    if (isRecording && volume > 0.05) {
      const spawnCount = Math.floor(volume * 5); // Louder = more particles
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 * configRef.current.speedMult * (volume * 2);
        
        brushesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height, // Could be center-based or random
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (Math.random() * 20 + 5) * (volume * 3), // Volume affects size
          color: configRef.current.colors[Math.floor(Math.random() * configRef.current.colors.length)],
          life: 100,
          maxLife: 100,
          type: configRef.current.type as any
        });
      }
    }

    // Update and Draw Brushes
    for (let i = brushesRef.current.length - 1; i >= 0; i--) {
      const b = brushesRef.current[i];
      b.life--;
      b.x += b.vx;
      b.y += b.vy;
      b.size *= 0.98; // Shrink over time

      if (b.life <= 0 || b.size < 0.5) {
        brushesRef.current.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      const alpha = b.life / b.maxLife;

      if (artStyle === 'Watercolor') {
        ctx.fillStyle = `${b.color}${Math.floor(alpha * 50).toString(16).padStart(2, '0')}`; // Low opacity
        // Watercolor "bleed" effect simulation
        const bleed = Math.random() * 2;
        ctx.arc(b.x + bleed, b.y + bleed, b.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (artStyle === 'Abstract') {
        ctx.fillStyle = b.color;
        ctx.strokeStyle = b.color;
        if (b.type === 'square') {
          ctx.fillRect(b.x, b.y, b.size, b.size);
        } else if (b.type === 'line') {
          ctx.lineWidth = b.size / 2;
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 10, b.y - b.vy * 10);
          ctx.stroke();
        } else {
          ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      else if (artStyle === 'Neon') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.size / 3;
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      else { // Impressionist
        ctx.fillStyle = b.color;
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        ctx.fillRect(b.x + offsetX, b.y + offsetY, b.size, b.size / 2);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [artStyle, isRecording, volume]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-black transition-colors duration-500">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-none"
      />
      
      {/* Overlay text for accessibility if needed or empty state */}
      {!isRecording && brushesRef.current.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 text-lg opacity-50">Canvas is empty. Start speaking to create.</p>
        </div>
      )}
    </div>
  );
};

export default ArtCanvas;
