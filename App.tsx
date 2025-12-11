import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisResult, ArtStyle } from './types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { analyzeAudioSegment } from './services/geminiService';
import { STYLES } from './constants';
import MicrophoneButton from './components/MicrophoneButton';
import AnalysisPanel from './components/AnalysisPanel';
import ArtCanvas from './components/ArtCanvas';
import { Download, Share2, Undo2, Trash2, Moon, Sun, Monitor } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentStyle, setCurrentStyle] = useState<ArtStyle>('Watercolor');
  const [canUndo, setCanUndo] = useState(false);
  const [triggerClear, setTriggerClear] = useState(0);
  const [triggerUndo, setTriggerUndo] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio Handler
  const handleAudioData = useCallback(async (base64Audio: string) => {
    setIsProcessing(true);
    const result = await analyzeAudioSegment(base64Audio);
    setAnalysis(result);
    setIsProcessing(false);
  }, []);

  const { isRecording, startRecording, stopRecording, volume, permissionError } = useAudioRecorder({
    onAudioData: handleAudioData,
    analysisInterval: 2500 // Analyze every 2.5 seconds
  });

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && (document.activeElement?.tagName !== 'BUTTON')) {
        e.preventDefault();
        toggleRecording();
      }
      if (e.code === 'Escape' && isRecording) {
        stopRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, stopRecording, startRecording]);

  // Export
  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `voice-art-${new Date().toISOString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar / Controls */}
      <aside className="w-full md:w-80 lg:w-96 p-6 flex flex-col gap-6 border-r border-gray-800 bg-[#16161a] z-20 overflow-y-auto">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            VoiceCanvas
          </h1>
          <p className="text-gray-400 text-sm mt-1">Speak. Create. Express.</p>
        </div>

        {/* Mic Control */}
        <div className="flex flex-col items-center py-6">
          <MicrophoneButton 
            isRecording={isRecording} 
            onClick={toggleRecording} 
            volume={volume}
          />
          {permissionError && (
            <p className="text-red-400 text-xs mt-4 text-center">{permissionError}</p>
          )}
          {isProcessing && isRecording && (
             <p className="text-indigo-400 text-xs mt-2 animate-pulse">Analyzing voice...</p>
          )}
        </div>

        {/* AI Analysis */}
        <AnalysisPanel analysis={analysis} />

        {/* Style Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Art Style</label>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setCurrentStyle(style.id)}
                className={`p-3 rounded-lg text-sm text-left transition-all border ${
                  currentStyle === style.id
                    ? 'bg-indigo-900/40 border-indigo-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold">{style.name}</div>
                <div className="text-xs opacity-60 truncate">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-3">
           <button 
             onClick={() => setTriggerUndo(p => p + 1)}
             disabled={!canUndo}
             className="flex items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
           >
             <Undo2 className="w-4 h-4" />
             <span>Undo</span>
           </button>
           <button 
             onClick={() => setTriggerClear(p => p + 1)}
             className="flex items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors"
           >
             <Trash2 className="w-4 h-4" />
             <span>Clear</span>
           </button>
           <button 
             onClick={handleExport}
             className="col-span-2 flex items-center justify-center gap-2 p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 font-semibold shadow-lg transition-transform hover:scale-[1.02]"
           >
             <Download className="w-4 h-4" />
             <span>Download Art</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-black p-4 md:p-8 flex items-center justify-center">
        
        {/* Canvas Container */}
        <div className="w-full h-full max-w-7xl relative shadow-2xl rounded-2xl overflow-hidden border border-gray-800">
           <ArtCanvas 
             analysis={analysis} 
             volume={volume}
             artStyle={currentStyle}
             isRecording={isRecording}
             onUndoPossible={setCanUndo}
             triggerClear={triggerClear}
             triggerUndo={triggerUndo}
           />
           
           {/* Overlay status for accessibility */}
           <div className="sr-only" aria-live="polite">
             {isRecording ? "Recording active. Speak to draw." : "Recording stopped."}
           </div>
        </div>

        {/* Mobile Floating Action Button (Only visible on small screens) */}
        <div className="md:hidden absolute bottom-6 right-6">
            <button 
                onClick={toggleRecording}
                className={`p-4 rounded-full shadow-2xl ${isRecording ? 'bg-red-600' : 'bg-indigo-600'} text-white`}
            >
                {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <MicrophoneButton isRecording={false} onClick={()=>{}} volume={0}/>} 
                {/* Note: Simplified icon for FAB */}
            </button>
        </div>
      </main>
    </div>
  );
};

export default App;
