import { useState, useRef, useEffect } from "react";
import { Lipsync, VISEMES } from "wawa-lipsync";

export const lipsyncManager = new Lipsync({});

export const useLipSync = () => {
  const [viseme, setViseme] = useState("viseme_PP");
  const [features, setFeatures] = useState({ volume: 0, centroid: 0 });
  const [isConnected, setIsConnected] = useState(false);
  
  const animationFrameRef = useRef(null);
  const audioElementRef = useRef(null);

  // Connect audio element to lip sync manager
  const connectAudio = (audioElement) => {
    if (audioElement && audioElement !== audioElementRef.current) {
      console.log('🎵 Connecting audio element to wawa-lipsync');
      try {
        lipsyncManager.connectAudio(audioElement);
        audioElementRef.current = audioElement;
        setIsConnected(true);
        
        // Start the analysis loop
        if (!animationFrameRef.current) {
          startAnalysis();
        }
      } catch (error) {
        console.error('❌ Error connecting audio to lipsync:', error);
        setIsConnected(false);
      }
    }
  };

  // Disconnect audio
  const disconnectAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    audioElementRef.current = null;
    setIsConnected(false);
    setViseme("viseme_PP");
    setFeatures({ volume: 0, centroid: 0 });
  };

  // Start analysis loop
  const startAnalysis = () => {
    const analyzeAudio = () => {
      if (lipsyncManager && isConnected) {
        try {
          // Process audio with wawa-lipsync
          lipsyncManager.processAudio();
          
          // Get current viseme and features
          const currentViseme = lipsyncManager.viseme;
          const currentFeatures = lipsyncManager.features;
          
          if (currentViseme) {
            setViseme(currentViseme);
          }
          
          if (currentFeatures) {
            setFeatures(currentFeatures);
          }
        } catch (error) {
          console.error('❌ Error in lip sync analysis:', error);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };
    
    analyzeAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAudio();
    };
  }, []);

  return {
    viseme,
    features,
    isConnected,
    connectAudio,
    disconnectAudio,
    lipsyncManager,
    VISEMES
  };
};
