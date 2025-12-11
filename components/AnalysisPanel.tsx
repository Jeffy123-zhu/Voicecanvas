import React from 'react';
import { AnalysisResult } from '../types';
import { Activity, Music, Palette, Zap } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  className?: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, className }) => {
  if (!analysis) {
    return (
      <div className={`p-6 bg-gray-900 rounded-2xl border border-gray-800 text-gray-500 flex flex-col items-center justify-center text-center ${className}`}>
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <p>Start speaking to see AI analysis...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden transition-all duration-500 ${className}`}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <Activity className="w-5 h-5 text-indigo-400" />
        Voice Analysis
      </h2>

      <div className="space-y-6">
        {/* Emotion */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm uppercase tracking-wider">Detected Emotion</span>
            <span className="text-indigo-400 font-mono">{analysis.confidence}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-white">{analysis.emotion}</div>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${analysis.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
          <Music className="w-5 h-5 text-pink-400" />
          <div>
            <div className="text-xs text-gray-400">Tempo</div>
            <div className="font-semibold">{analysis.tempo}</div>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Keywords</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.length > 0 ? (
              analysis.keywords.map((word, i) => (
                <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-200">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-600 italic">Listening...</span>
            )}
          </div>
        </div>

        {/* Palette */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Palette className="w-4 h-4 text-green-400" />
            <span>Generated Palette</span>
          </div>
          <div className="flex gap-2 h-12">
            {analysis.colors.map((color, i) => (
              <div 
                key={i}
                className="flex-1 rounded-md shadow-inner transition-colors duration-1000"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Screen Reader Only Description */}
      <div className="sr-only" aria-live="polite">
        Current mood is {analysis.emotion} with {analysis.tempo} tempo. 
        Keywords detected: {analysis.keywords.join(', ')}. 
        Art style updating to match.
      </div>
    </div>
  );
};

export default AnalysisPanel;
