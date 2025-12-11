import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onClick: () => void;
  volume: number;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isRecording, onClick, volume }) => {
  // Visual pulse based on volume
  const pulseScale = 1 + (volume * 0.5); // 1.0 to 1.5

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple Effect Ring */}
      {isRecording && (
        <div 
          className="absolute rounded-full bg-red-500 opacity-20 animate-ping"
          style={{ 
            width: '120%', 
            height: '120%',
            animationDuration: '1.5s' 
          }} 
        />
      )}
      
      {/* Volume Reactive Ring */}
      {isRecording && (
        <div 
          className="absolute rounded-full border-4 border-red-500/50 transition-transform duration-75"
          style={{ 
            width: '100%', 
            height: '100%', 
            transform: `scale(${pulseScale})`
          }} 
        />
      )}

      <button
        onClick={onClick}
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        className={`
          relative z-10 flex items-center justify-center w-24 h-24 rounded-full 
          shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-black
          ${isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
          }
        `}
      >
        {isRecording ? (
          <Square className="w-10 h-10 fill-current" />
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </button>
      
      {!isRecording && (
        <span className="absolute -bottom-10 text-sm font-medium text-gray-400 whitespace-nowrap">
          Click or Space to Start
        </span>
      )}
    </div>
  );
};

export default MicrophoneButton;
