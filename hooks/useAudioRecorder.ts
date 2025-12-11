import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioRecorderProps {
  onAudioData: (base64Audio: string) => void;
  analysisInterval?: number; // ms
}

export const useAudioRecorder = ({ onAudioData, analysisInterval = 3000 }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio Context for Visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // MediaRecorder for sending chunks to Gemini
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Chrome supports webm
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(); 
      setIsRecording(true);
      setPermissionError(null);

      // Start visualization loop
      updateVolume();

      // Start chunk processing interval
      intervalRef.current = window.setInterval(processAudioChunk, analysisInterval);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionError("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Process final chunk
    processAudioChunk();
  }, []);

  const updateVolume = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    // Normalize to 0-1 (approximate max 128 for speech usually)
    setVolume(Math.min(average / 100, 1)); 

    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const processAudioChunk = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        // We need to restart the recorder to get a clean "slice" quickly without stopping the stream
        mediaRecorderRef.current.stop();
        // The onstop event isn't reliable for "slicing" in loop without lag, 
        // but 'requestData()' is better. 
        // Actually, requestData() triggers ondataavailable but doesn't clear internal buffer well for WAV headers if we were doing that.
        // For WebM, straightforward concatenation can be tricky for headers, but Gemini usually handles loose containers well.
        // EASIER STRATEGY: 
        // Just call requestData(). It flushes current buffer to ondataavailable.
        // mediaRecorderRef.current.requestData();
        // Wait... requestData() just flushes. We handle chunks in ondataavailable.
    }
  };

  // Re-implementing chunk logic to be robust:
  // We want to send the *last X seconds*.
  // Since requestData() just gives us what happened since last time, that's perfect.
  
  useEffect(() => {
    if (isRecording && mediaRecorderRef.current) {
       // Override the interval logic inside useEffect to use requestData
       if (intervalRef.current) clearInterval(intervalRef.current);
       
       intervalRef.current = window.setInterval(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.requestData();
          }
       }, analysisInterval);
       
       const recorder = mediaRecorderRef.current;
       const handleData = async (e: BlobEvent) => {
         if (e.data.size > 0) {
           const blob = new Blob([e.data], { type: 'audio/webm' });
           const reader = new FileReader();
           reader.readAsDataURL(blob);
           reader.onloadend = () => {
             const base64data = reader.result as string;
             // Remove header "data:audio/webm;base64,"
             const base64Content = base64data.split(',')[1];
             onAudioData(base64Content);
           };
         }
       };
       
       recorder.addEventListener('dataavailable', handleData);
       
       return () => {
         recorder.removeEventListener('dataavailable', handleData);
       };
    }
  }, [isRecording, analysisInterval, onAudioData]);

  return { isRecording, startRecording, stopRecording, volume, permissionError };
};
