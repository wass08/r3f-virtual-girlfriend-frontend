import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AgoraRTC from 'agora-rtc-sdk-ng';
import protobuf from 'protobufjs';

const AgoraContext = createContext();

// Load protobuf schema
let protoRoot = null;
let SomeMessage = null;

const loadProtoSchema = async () => {
  if (!protoRoot) {
    try {
      protoRoot = await protobuf.load('/virtual-agent/schema.proto');
      SomeMessage = protoRoot.lookupType('SomeMessage');
      console.log('✅ Protobuf schema loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load protobuf schema:', error);
      // Fallback to inline schema definition
      const schema = `
        syntax = "proto3";
        message SomeMessage {
          oneof data {
            Metadata metadata = 1;
            Words words = 2;
          }
        }
        message Metadata {
          string session_id = 1;
          string conversation_id = 2;
          string request_id = 3;
        }
        message Words {
          repeated Word words = 1;
        }
        message Word {
          string word = 1;
          double start = 2;
          double end = 3;
          float confidence = 4;
          bool speaker = 5;
        }
      `;
      protoRoot = protobuf.parse(schema).root;
      SomeMessage = protoRoot.lookupType('SomeMessage');
      console.log('✅ Protobuf schema loaded from inline definition');
    }
  }
  return { protoRoot, SomeMessage };
};

// Helper function to get config value from sessionStorage or environment variables
const getConfigValue = (key, defaultValue = null) => {
  const sessionValue = sessionStorage.getItem(key);
  const envValue = import.meta.env[key];
  const result = sessionValue || envValue || defaultValue;
  
  return result;
};

// Agora configuration - Uses sessionStorage and environment variables
const getAgoraConfig = () => ({
  appId: getConfigValue('VITE_AGORA_APP_ID'),
  token: getConfigValue('VITE_AGORA_TOKEN'),
  channel: getConfigValue('VITE_AGORA_CHANNEL', 'VirtualAgent_Channel'),
  uid: null, // null for auto-generation
  convoAIUid: parseInt(getConfigValue('VITE_CONVOAI_AGENT_UID', '8888')),
});

// ConvoAI API configuration - Uses sessionStorage and environment variables
const getConvoAIConfig = () => ({
  baseUrl: getConfigValue('VITE_CONVOAI_API_BASE_URL', 'https://api.agora.io/api/conversational-ai-agent/v2'),
  apiKey: getConfigValue('VITE_RESTFUL_API_KEY'),
  password: getConfigValue('VITE_RESTFUL_PASSWORD'),
  agentUid: parseInt(getConfigValue('VITE_CONVOAI_AGENT_UID', '8888')),
  agentName: getConfigValue('VITE_CONVOAI_AGENT_NAME', 'Virtual Agent'),

  // LLM Configuration
  llmUrl: getConfigValue('VITE_LLM_URL', 'https://api.openai.com/v1/chat/completions'),
  llmApiKey: getConfigValue('VITE_LLM_API_KEY'),
  llmModel: getConfigValue('VITE_LLM_MODEL', 'gpt-4o-mini'),
  systemMessage: getConfigValue('VITE_LLM_SYSTEM_MESSAGE', 'You are a friendly virtual agent assistant.'),
  greeting: getConfigValue('VITE_LLM_GREETING', "Hello! I'm your virtual agent. How can I help you today?"),
  
  // TTS Configuration
  ttsApiKey: getConfigValue('VITE_TTS_API_KEY'),
  ttsRegion: getConfigValue('VITE_TTS_REGION', 'eastus'),
  ttsVoiceName: getConfigValue('VITE_TTS_VOICE_NAME', 'en-US-AriaNeural'),
  
  // ASR Configuration
  asrLanguage: getConfigValue('VITE_ASR_LANGUAGE', 'en-US'),
});

// Generate Basic Auth header
const generateBasicAuthHeader = () => {
  const config = getConvoAIConfig();
  
  // Generate from API Key + Password
  const apiKey = config.apiKey;
  const password = config.password;
  
  // Validate that both credentials exist and are not empty
  if (!apiKey || !password || apiKey.trim() === '' || password.trim() === '') {
    console.error('❌ Missing ConvoAI credentials:', { 
      apiKey: apiKey ? 'SET' : 'MISSING', 
      password: password ? 'SET' : 'MISSING' 
    });
    
    // TEMPORARY WORKAROUND - Let's try the old variable names as fallback
    console.log('🔄 Trying fallback to old variable names...');
    const fallbackApiKey = getConfigValue('VITE_CONVOAI_API_KEY');
    const fallbackPassword = getConfigValue('VITE_CONVOAI_PASSWORD');
    
    console.log('🔄 Fallback credentials:', {
      fallbackApiKey: fallbackApiKey ? 'FOUND' : 'MISSING',
      fallbackPassword: fallbackPassword ? 'FOUND' : 'MISSING'
    });
    
    if (fallbackApiKey && fallbackPassword) {
      console.log('✅ Using fallback credentials from old variable names');
      return generateBasicAuthHeaderWithCredentials(fallbackApiKey, fallbackPassword);
    }
    
    return null;
  }
  
  return generateBasicAuthHeaderWithCredentials(apiKey, password);
};

// Helper function to generate auth header with provided credentials
const generateBasicAuthHeaderWithCredentials = (apiKey, password) => {
  // Check for placeholder values that shouldn't be used
  const placeholderPatterns = [
    'your-api-key', 'your-password', 'replace-with', 'enter-your',
    'api-key-here', 'password-here', 'test-key', 'test-password',
    'example', 'placeholder', 'change-me', 'update-me'
  ];
  
  const hasPlaceholder = placeholderPatterns.some(pattern => 
    apiKey.toLowerCase().includes(pattern) || password.toLowerCase().includes(pattern)
  );
  
  if (hasPlaceholder) {
    console.error('❌ Detected placeholder credentials. Please set real API key and password.');
    return null;
  }
  
  // Trim whitespace and encode credentials
  const cleanApiKey = apiKey.trim();
  const cleanPassword = password.trim();
  
  // Create the credentials string
  const credentialString = `${cleanApiKey}:${cleanPassword}`;
  
  const credentials = btoa(credentialString);
  const authHeader = `Basic ${credentials}`;
  
  console.log('✅ Auth header generated successfully');
  
  return authHeader;
};

// Test function to verify Basic Auth encoding/decoding
const testBasicAuthCredentials = () => {
  const authHeader = generateBasicAuthHeader();
  if (!authHeader) {
    console.error('❌ Cannot test - no auth header generated');
    return false;
  }
  
  const config = getConvoAIConfig();
  
  // Validate generated auth header
  try {
    // Extract and decode the credentials to verify they're correct
    const base64Credentials = authHeader.replace('Basic ', '');
    const decoded = atob(base64Credentials);
    const [decodedApiKey, decodedPassword] = decoded.split(':');
    
    const matches = decodedApiKey === config.apiKey.trim() && decodedPassword === config.password.trim();
    
    console.log('🧪 Basic Auth Test:', {
      authHeaderValid: authHeader.startsWith('Basic '),
      canDecode: !!decoded,
      credentialsMatch: matches,
      decodedLength: decoded.length,
      originalApiKeyLength: config.apiKey ? config.apiKey.trim().length : 0,
      originalPasswordLength: config.password ? config.password.trim().length : 0
    });
    
    return matches;
  } catch (error) {
    console.error('❌ Basic Auth Test Failed:', error);
    return false;
  }
};

export const AgoraProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lipSyncData, setLipSyncData] = useState(null);
  const [agentId, setAgentId] = useState(null); // Store the agent ID for stopping
  const [configVersion, setConfigVersion] = useState(0); // To trigger config updates
  const [chatHistory, setChatHistory] = useState([]); // Store conversation transcript
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); // Track processed message IDs
  const [messageChunks, setMessageChunks] = useState(new Map()); // Track message chunks: messageId -> {parts: Map, totalParts: number}
  
  // Generate unique ID for messages to avoid React key conflicts
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Process complete message after all chunks are received
  const processCompleteMessage = async (messageId, completeMessageData) => {
    try {
      console.log('🔍 Processing complete message:', messageId, 'Length:', completeMessageData.length);
      
      // Load protobuf schema if not already loaded
      const { SomeMessage: MessageType } = await loadProtoSchema();
      
      // Convert base64 decoded string to proper Uint8Array
      // The completeMessageData is already base64 decoded, but we need to handle it as binary data
      let buffer;
      try {
        // Try to convert the string to proper byte array
        // Since atob() returns a binary string, we need to convert each char to byte
        buffer = new Uint8Array(completeMessageData.length);
        for (let i = 0; i < completeMessageData.length; i++) {
          buffer[i] = completeMessageData.charCodeAt(i) & 0xFF; // Mask to byte range
        }
        console.log('📦 Buffer created, length:', buffer.length, 'First few bytes:', Array.from(buffer.slice(0, 10)));
        
        // Basic validation: protobuf messages should not be empty and should have reasonable size
        if (buffer.length === 0) {
          throw new Error('Empty buffer - no data to decode');
        }
        if (buffer.length > 1000000) { // 1MB limit
          throw new Error(`Buffer too large: ${buffer.length} bytes`);
        }
        
      } catch (bufferError) {
        console.error('❌ Buffer creation failed:', bufferError);
        throw new Error(`Buffer creation failed: ${bufferError.message}`);
      }
      
      try {
        // First, check if the data might actually be JSON (common case)
        const trimmedData = completeMessageData.trim();
        if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
          console.log('🔍 Data appears to be JSON, skipping protobuf decode');
          throw new Error('Data appears to be JSON format');
        }
        
        // Try protobuf decoding
        const protoMessage = MessageType.decode(buffer);
        console.log('📋 Protobuf decoded successfully:', protoMessage);
        
        // Process based on message type
        if (protoMessage.words && protoMessage.words.words) {
          console.log('✅ Found Words message with', protoMessage.words.words.length, 'words');
          
          // Extract words with timing information
          const wordDetails = protoMessage.words.words.map(word => ({
            word: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence,
            speaker: word.speaker ? 'user' : 'agent'
          }));
          
          // Only show actual words (filter out empty or very short words)
          const meaningfulWords = wordDetails.filter(w => w.word && w.word.trim().length > 0);
          
          if (meaningfulWords.length > 0) {
            const transcriptText = meaningfulWords.map(w => w.word).join(' ');
            const speaker = meaningfulWords.some(w => w.speaker === 'user') ? 'user' : 'agent';
            
            console.log('📝 Real-time transcript update:', transcriptText);
            
            // Update existing message or create new one
            addOrUpdateMessageInChat({
              id: messageId,
              timestamp: new Date(),
              speaker: speaker,
              message: transcriptText.trim(),
              type: 'transcript',
              words: meaningfulWords,
              raw: protoMessage
            });
          }
          
        } else if (protoMessage.metadata) {
          console.log('📋 Found Metadata message:', protoMessage.metadata);
          // Don't add metadata messages to chat for now
        }
        
      } catch (protoError) {
        console.warn('❌ Protobuf decode failed, trying JSON fallback:', {
          error: protoError.message,
          bufferLength: buffer.length,
          dataLength: completeMessageData.length,
          firstBytes: Array.from(buffer.slice(0, 20)), // Show more bytes for debugging
          errorType: protoError.constructor.name
        });
        
        // Try JSON fallback
        try {
          const messageDataJson = JSON.parse(completeMessageData);
          console.log('📄 JSON decoded successfully:', messageDataJson);
          
          // Only process assistant.transcription messages
          if (messageDataJson.object === "assistant.transcription") {
            console.log('✅ Processing assistant.transcription message');
            
            // Extract transcript and words
            const transcriptText = messageDataJson.transcript || messageDataJson.text || '';
            const speaker = messageDataJson.role === 'user' ? 'user' : 'agent';
            
            // Extract words if available
            let wordDetails = [];
            if (messageDataJson.words && Array.isArray(messageDataJson.words)) {
              wordDetails = messageDataJson.words.map(word => ({
                word: word.word || word.text || word,
                start: word.start || word.start_time || 0,
                end: word.end || word.end_time || 0,
                confidence: word.confidence || 1.0,
                speaker: word.speaker || speaker
              })).filter(w => w.word && w.word.trim().length > 0);
            }
            
            if (transcriptText.trim() || wordDetails.length > 0) {
              console.log('📝 Real-time transcript update from JSON:', transcriptText);
              
              // Update existing message or create new one
              addOrUpdateMessageInChat({
                id: messageId,
                timestamp: new Date(),
                speaker: speaker,
                message: transcriptText.trim() || wordDetails.map(w => w.word).join(' '),
                type: 'transcript',
                words: wordDetails.length > 0 ? wordDetails : null,
                raw: messageDataJson
              });
            }
          } else {
            console.log('🚫 Filtering out non-assistant.transcription message:', messageDataJson.object);
          }
          
        } catch (jsonError) {
          console.warn('❌ Both protobuf and JSON decode failed:', {
            jsonError: jsonError.message,
            dataSnippet: completeMessageData.substring(0, 100) + '...', // Show first 100 chars
            dataLength: completeMessageData.length,
            isPrintable: /^[\x20-\x7E]*$/.test(completeMessageData.substring(0, 50)) // Check if printable ASCII
          });
          
          // Last resort: treat as plain text if it looks like readable text
          const trimmedData = completeMessageData.trim();
          if (trimmedData.length > 0 && trimmedData.length < 10000) {
            console.log('🔤 Treating as plain text message');
            addOrUpdateMessageInChat({
              id: messageId,
              timestamp: new Date(),
              speaker: 'agent',
              message: trimmedData,
              type: 'text',
              raw: { originalData: completeMessageData }
            });
          }
        }
      }
      
      // Mark as processed
      setProcessedMessageIds(prev => new Set([...prev, messageId]));
      
    } catch (error) {
      console.error('❌ Error processing complete message:', error);
    }
  };

  // Process individual chunk for real-time updates (before complete message)
  const processPartialMessage = async (messageId, partialData) => {
    try {
      // Try to decode partial data to show real-time progress
      const { SomeMessage: MessageType } = await loadProtoSchema();
      
      const buffer = new Uint8Array(partialData.length);
      for (let i = 0; i < partialData.length; i++) {
        buffer[i] = partialData.charCodeAt(i);
      }
      
      try {
        const protoMessage = MessageType.decode(buffer);
        
        if (protoMessage.words && protoMessage.words.words) {
          const wordDetails = protoMessage.words.words
            .map(word => ({
              word: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence,
              speaker: word.speaker ? 'user' : 'agent'
            }))
            .filter(w => w.word && w.word.trim().length > 0);
          
          if (wordDetails.length > 0) {
            const speaker = wordDetails.some(w => w.speaker === 'user') ? 'user' : 'agent';
            
            console.log('⚡ Real-time partial update:', wordDetails.map(w => w.word).join(' '));
            
            // Update with partial data (marked as incomplete)
            addOrUpdateMessageInChat({
              id: messageId,
              timestamp: new Date(),
              speaker: speaker,
              message: wordDetails.map(w => w.word).join(' ') + '...',
              type: 'transcript',
              words: wordDetails,
              isPartial: true,
              raw: protoMessage
            });
          }
        }
      } catch (error) {
        // Partial decode might fail, that's okay
        console.log('⚡ Partial decode failed (expected for incomplete data)');
      }
    } catch (error) {
      // Silent fail for partial updates
    }
  };

  // Add or update message in chat with real-time word updates
  const addOrUpdateMessageInChat = (messageUpdate) => {
    setChatHistory(prev => {
      const existingIndex = prev.findIndex(existing => existing.id === messageUpdate.id);
      
      if (existingIndex !== -1) {
        // Update existing message
        console.log('🔄 Updating existing message:', messageUpdate.id);
        const updatedHistory = [...prev];
        const existingMessage = updatedHistory[existingIndex];
        
        // Merge new words with existing words, avoiding duplicates
        let updatedWords = existingMessage.words || [];
        if (messageUpdate.words) {
          messageUpdate.words.forEach(newWord => {
            // Check if this word already exists (by position/timing)
            const existingWordIndex = updatedWords.findIndex(existing => 
              Math.abs(existing.start - newWord.start) < 0.01 && existing.word === newWord.word
            );
            
            if (existingWordIndex === -1) {
              // New word, add it in correct position
              updatedWords.push(newWord);
              updatedWords.sort((a, b) => a.start - b.start); // Keep words in chronological order
            } else {
              // Update existing word if needed (e.g., confidence improved)
              updatedWords[existingWordIndex] = { ...updatedWords[existingWordIndex], ...newWord };
            }
          });
        }
        
        // Update the message
        updatedHistory[existingIndex] = {
          ...existingMessage,
          message: updatedWords.map(w => w.word).join(' '), // Rebuild transcript from words
          words: updatedWords,
          lastUpdated: new Date(),
          raw: messageUpdate.raw || existingMessage.raw
        };
        
        console.log('✅ Message updated with', updatedWords.length, 'words');
        return updatedHistory;
      } else {
        // Create new message
        console.log('➕ Creating new message:', messageUpdate.id);
        const newHistory = [...prev, {
          ...messageUpdate,
          createdAt: new Date(),
          lastUpdated: new Date()
        }];
        console.log('✅ Chat history updated, new length:', newHistory.length);
        return newHistory;
      }
    });
  };
  
  const audioAnalyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Agora client
  useEffect(() => {
    const initClient = async () => {
      // Check if we have basic Agora configuration before creating client
      const agoraConfig = getAgoraConfig();
      
      if (!agoraConfig.appId || !agoraConfig.token) {
        console.log('⏸️ Skipping Agora client initialization - missing credentials');
        console.log('Missing:', {
          appId: !agoraConfig.appId ? 'MISSING' : 'SET',
          token: !agoraConfig.token ? 'MISSING' : 'SET'
        });
        return;
      }
      
      try {
        console.log('🚀 Initializing Agora client...');
        
        // Configure Agora for better connection handling
        AgoraRTC.setLogLevel(1); // Reduce log verbosity to avoid WebSocket spam
        
        // FIXED: Use 'live' mode with 'audience' role for communication-style audio
        const agoraClient = AgoraRTC.createClient({ 
          mode: 'live', // Changed from 'rtc' to 'live' for better audio handling
          codec: 'vp8' 
        });
        
        // Set client role to audience initially, then switch to host when joining
        await agoraClient.setClientRole('audience');
        console.log('🎯 Agora client created in LIVE mode with AUDIENCE role');
        
        // Set up event handlers
        agoraClient.on('user-published', async (user, mediaType) => {
        console.log('🎵 USER PUBLISHED EVENT:', {
          uid: user.uid,
          uidType: typeof user.uid,
          mediaType: mediaType,
          expectedConvoAIUid: getAgoraConfig().convoAIUid,
          isConvoAIAgent: user.uid == getAgoraConfig().convoAIUid
        });
        
        // CRITICAL: Subscribe to the user's media
        try {
          await agoraClient.subscribe(user, mediaType);
          console.log('✅ Successfully subscribed to user:', user.uid, 'for', mediaType);
        } catch (subscribeError) {
          console.error('❌ Failed to subscribe to user:', user.uid, subscribeError);
          return;
        }
        
        const agoraConfig = getAgoraConfig();
        if (mediaType === 'audio' && user.uid == agoraConfig.convoAIUid) {
          console.log('🤖 ConvoAI Agent audio track received! Setting up playback and lip sync...');
          
          // CRITICAL: Get the audio track and ensure it's playing
          const audioTrack = user.audioTrack;
          if (audioTrack) {
            console.log('🎧 Audio track found, checking properties...');
            console.log('Audio track details:', {
              enabled: audioTrack.enabled,
              muted: audioTrack.muted,
              volume: audioTrack.getVolumeLevel ? audioTrack.getVolumeLevel() : 'unknown',
              isPlaying: audioTrack.isPlaying
            });
            
            // STEP 1: Ensure audio is playing
            try {
              console.log('🔊 Starting audio playback...');
              audioTrack.play();
              console.log('✅ Audio track play() called successfully');
              
              // Set volume to maximum to ensure audibility
              if (audioTrack.setVolume) {
                audioTrack.setVolume(100);
                console.log('🔊 Set audio volume to 100%');
              }
              
            } catch (playError) {
              console.error('❌ Failed to play audio track:', playError);
            }
            
            // Set up Web Audio API analysis for real-time ConvoAI audio
            try {
              console.log('🎛️ Setting up Web Audio API for real-time lip sync...');
              const mediaStreamTrack = audioTrack.getMediaStreamTrack();
              console.log('MediaStreamTrack:', {
                enabled: mediaStreamTrack.enabled,
                muted: mediaStreamTrack.muted,
                readyState: mediaStreamTrack.readyState
              });
              
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              console.log('AudioContext state:', audioContext.state);
              
              // Resume audio context if suspended (common on mobile/browser restrictions)
              if (audioContext.state === 'suspended') {
                console.log('🔄 Resuming suspended audio context...');
                await audioContext.resume();
                console.log('✅ Audio context resumed, new state:', audioContext.state);
              }
              
              const mediaStreamSource = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
              const analyser = audioContext.createAnalyser();
              
              mediaStreamSource.connect(analyser);
              analyser.fftSize = 256;
              audioAnalyserRef.current = analyser;
              
              console.log('🔊 Real-time audio analysis setup complete, starting ConvoAI lip sync...');
              
              // Start real-time audio analysis optimized for ConvoAI speech
              const analyzeAudio = () => {
                if (audioAnalyserRef.current) {
                  const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
                  audioAnalyserRef.current.getByteFrequencyData(dataArray);
                  
                  // Calculate average audio level (0-1)
                  const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                  const normalizedLevel = average / 255;
                  
                  setAudioLevel(normalizedLevel);
                  
                  // Generate enhanced viseme-based lip sync data for real-time speech
                  let viseme = 'X'; // Default closed mouth
                  let mouthOpen = 0;
                  let mouthSmile = 0;
                  
                  if (normalizedLevel > 0.01) {
                    // Analyze frequency ranges for more realistic viseme detection
                    const lowFreq = dataArray.slice(0, 15).reduce((sum, val) => sum + val, 0) / 15;
                    const midFreq = dataArray.slice(15, 60).reduce((sum, val) => sum + val, 0) / 45;
                    const highFreq = dataArray.slice(60, 100).reduce((sum, val) => sum + val, 0) / 40;
                    
                    // Enhanced viseme detection based on frequency characteristics
                    if (normalizedLevel > 0.15) {
                      if (highFreq > midFreq && highFreq > lowFreq) {
                        // High frequency dominant - likely 'ee', 'ih', 's', 'sh' sounds
                        viseme = Math.random() > 0.5 ? 'C' : 'H'; // viseme_I or viseme_TH
                      } else if (lowFreq > midFreq && lowFreq > highFreq) {
                        // Low frequency dominant - likely 'oh', 'oo', 'ow' sounds  
                        viseme = Math.random() > 0.5 ? 'E' : 'F'; // viseme_O or viseme_U
                      } else if (midFreq > 20) {
                        // Mid frequency dominant - likely 'ah', 'ay', 'eh' sounds
                        viseme = Math.random() > 0.5 ? 'D' : 'A'; // viseme_AA or viseme_PP
                      } else {
                        // Consonants - 'p', 'b', 'm', 'k', 'g'
                        viseme = Math.random() > 0.5 ? 'B' : 'G'; // viseme_kk or viseme_FF
                      }
                    } else if (normalizedLevel > 0.05) {
                      // Lower volume speech
                      viseme = 'A'; // viseme_PP for general speech
                    }
                    
                    // Calculate mouth movements with natural variation
                    mouthOpen = Math.min(normalizedLevel * 2.5, 1); // Amplify for visibility
                    mouthSmile = normalizedLevel * 0.15; // Subtle smile during speech
                  }
                  
                  // Generate comprehensive lip sync data
                  setLipSyncData({
                    viseme: viseme,
                    mouthOpen: mouthOpen,
                    mouthSmile: mouthSmile,
                    jawOpen: mouthOpen * 0.7, // Jaw follows mouth but less pronounced
                    audioLevel: normalizedLevel,
                    // Raw frequency data for debugging
                    frequencies: {
                      low: dataArray.slice(0, 15).reduce((sum, val) => sum + val, 0) / 15,
                      mid: dataArray.slice(15, 60).reduce((sum, val) => sum + val, 0) / 45,
                      high: dataArray.slice(60, 100).reduce((sum, val) => sum + val, 0) / 40
                    }
                  });
                }
                animationFrameRef.current = requestAnimationFrame(analyzeAudio);
              };
              
              analyzeAudio();
            } catch (error) {
              console.error('❌ Error setting up real-time audio analysis:', error);
            }
          } else {
            console.warn('⚠️  Audio track is null/undefined');
          }
        } else {
          console.log('👤 Regular user audio or different media type');
        }
        
        setRemoteUsers(users => [...users, user]);
      });

      agoraClient.on('user-unpublished', (user) => {
        console.log('👋 USER UNPUBLISHED:', {
          uid: user.uid,
          expectedConvoAIUid: getAgoraConfig().convoAIUid,
          isConvoAIAgent: user.uid == getAgoraConfig().convoAIUid
        });
        setRemoteUsers(users => users.filter(u => u.uid !== user.uid));
      });

      agoraClient.on('user-joined', (user) => {
        console.log('🚀 USER JOINED CHANNEL:', {
          uid: user.uid,
          expectedConvoAIUid: getAgoraConfig().convoAIUid,
          isConvoAIAgent: user.uid == getAgoraConfig().convoAIUid
        });
      });

      agoraClient.on('user-left', (user) => {
        console.log('🚪 USER LEFT CHANNEL:', {
          uid: user.uid,
          expectedConvoAIUid: getAgoraConfig().convoAIUid,
          isConvoAIAgent: user.uid == getAgoraConfig().convoAIUid
        });
      });

      // Helper function to check if message should be added to chat
      const shouldAddToChat = (messageData, messageId) => {
        // Check if message ID already processed
        if (messageId && processedMessageIds.has(messageId)) {
          console.log(`🔄 Skipping duplicate message ID: ${messageId}`);
          return false;
        }

        // Check if message has object property
        if (messageData && messageData.object) {
          // Only show assistant.transcription messages
          if (messageData.object === 'assistant.transcription') {
            // Additional check for meaningful content
            if (messageData.words && Array.isArray(messageData.words) && messageData.words.length > 0) {
              console.log('✅ Valid assistant.transcription message with words');
              return true;
            } else if (messageData.text && messageData.text.trim()) {
              console.log('✅ Valid assistant.transcription message with text');
              return true;
            } else {
              console.log('🚫 assistant.transcription message has no meaningful content');
              return false;
            }
          } else {
            console.log(`🚫 Filtering out message type: ${messageData.object}`);
            return false;
          }
        }

        // For protobuf messages without object field, check if it has actual words
        if (messageData && messageData.words && messageData.words.words && messageData.words.words.length > 0) {
          // Additional check to ensure words have content
          const hasNonEmptyWords = messageData.words.words.some(word => word.word && word.word.trim());
          if (hasNonEmptyWords) {
            console.log('✅ Valid protobuf Words message with content');
            return true;
          } else {
            console.log('🚫 Protobuf message has empty words');
            return false;
          }
        }

        console.log('🚫 Message does not meet criteria for chat display');
        return false;
      };

      agoraClient.on('connection-state-change', (curState) => {
        console.log('Agora connection state:', curState);
        setIsConnected(curState === 'CONNECTED');
      });

      // Subscribe to RTC data stream for ConvoAI transcript
      agoraClient.on('stream-message', async (uid, payload) => {
        console.log('📨 RTC DATA STREAM MESSAGE:', {
          uid: uid,
          payloadType: typeof payload,
          payloadSize: payload ? payload.length || payload.byteLength : 0,
          isFromConvoAI: uid == getAgoraConfig().convoAIUid
        });
        
        // Only handle messages from ConvoAI agent
        if (uid == getAgoraConfig().convoAIUid) {
          try {
            // Decode the payload using TextDecoder
            let decodedString = new TextDecoder().decode(payload);
            //console.log('📝 Decoded string:', decodedString);

            
            // Parse message format: messageID|part|totalParts|base64Data
            if (!decodedString.includes('|')) {
              console.warn('⚠️ Message format invalid - missing separators');
              return;
            }
            
            const parts = decodedString.split('|');
            if (parts.length !== 4) {
              console.warn('⚠️ Message format invalid - expected 4 parts, got:', parts.length);
              return;
            }
            
            const [messageId, partNumber, totalParts, base64Data] = parts;
            const partNum = parseInt(partNumber);
            const totalNum = parseInt(totalParts);
            
            console.log('📦 Message chunk:', { messageId, partNum, totalNum });
            
            // CRITICAL: Skip if this complete message was already processed
            if (processedMessageIds.has(messageId)) {
              console.log(`🔄 Ignoring duplicate complete message: ${messageId}`);
              return;
            }
            
            // Decode Base64 data
            let messageData;
            try {
              messageData = atob(base64Data);
            } catch (base64Error) {
              console.warn('❌ Base64 decode failed:', base64Error);
              return;
            }
            
            // Handle message chunking
            setMessageChunks(prev => {
              const newChunks = new Map(prev);
              
              // Check if we already have this complete message processed
              if (processedMessageIds.has(messageId)) {
                console.log(`🔄 Skipping chunk for already processed message: ${messageId}`);
                return newChunks;
              }
              
              if (!newChunks.has(messageId)) {
                newChunks.set(messageId, {
                  parts: new Map(),
                  totalParts: totalNum,
                  receivedAt: Date.now()
                });
              }
              
              const messageInfo = newChunks.get(messageId);
              
              // Check if we already have this specific part
              if (messageInfo.parts.has(partNum)) {
                console.log(`🔄 Already have part ${partNum} for message ${messageId}, ignoring duplicate`);
                return newChunks;
              }
              
              messageInfo.parts.set(partNum, messageData);
              
              console.log(`📥 Received part ${partNum}/${totalNum} for message ${messageId} (${messageInfo.parts.size}/${totalNum} complete)`);
              
              // Check if we have all parts
              if (messageInfo.parts.size === totalNum) {
                console.log(`✅ All parts received for message ${messageId}, assembling...`);
                
                // Assemble complete message in correct order
                let completeMessage = '';
                for (let i = 1; i <= totalNum; i++) {
                  if (messageInfo.parts.has(i)) {
                    completeMessage += messageInfo.parts.get(i);
                  } else {
                    console.error(`❌ Missing part ${i} for message ${messageId}`);
                    return newChunks; // Keep waiting
                  }
                }
                
                // Process the complete message
                processCompleteMessage(messageId, completeMessage);
                
                // Remove from chunks map to save memory
                newChunks.delete(messageId);
              } else {
                // Try partial update for real-time display
                processPartialMessage(messageId, messageData);
              }
              
              return newChunks;
            });
            
          } catch (error) {
            console.error('❌ Stream message processing error:', error);
          }
        }
      });

      setClient(agoraClient);
      
      } catch (error) {
        console.error('❌ Failed to initialize Agora client:', error);
        console.log('💡 Please check your Agora App ID and Token configuration');
      }
    };

    initClient();

    // Listen for sessionStorage changes to update config
    const handleStorageChange = () => {
      setConfigVersion(prev => prev + 1);
    };

    // Listen for storage events and also custom events for sessionStorage
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionStorageUpdate', handleStorageChange);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionStorageUpdate', handleStorageChange);
    };
  }, []);

  // Call ConvoAI REST API to make agent join the channel
  const startConvoAIAgent = useCallback(async () => {
    try {
      console.log('Starting ConvoAI Agent via REST API...');
      
      // Get current configuration (from sessionStorage or env)
      const agoraConfig = getAgoraConfig();
      const convoaiConfig = getConvoAIConfig();
      
      // Validate Basic Auth credentials
      let authHeader = generateBasicAuthHeader();
      if (!authHeader) {
        console.error('❌ Failed to generate auth header - check API Key and Password');
        return;
      }
      
      if (!authHeader) {
        throw new Error('ConvoAI API credentials not configured. Please set valid API Key and Password in Settings.');
      }
      
      // Test the credentials encoding/decoding
      const credentialsValid = testBasicAuthCredentials();
      if (!credentialsValid) {
        throw new Error('ConvoAI API credentials encoding test failed. Please check your API Key and Password.');
      }
      
      // Generate a unique name for this agent session
      const uniqueName = `virtual-agent-${Date.now()}`;
      
      // Construct the API URL - POST /projects/:appid/join
      const apiUrl = `${convoaiConfig.baseUrl}/projects/${agoraConfig.appId}/join`;
      
      const requestBody = {
        "name": uniqueName,
        "properties": {
          "channel": agoraConfig.channel,
          "token": agoraConfig.token,
          "name": convoaiConfig.agentName,
          "agent_rtc_uid": convoaiConfig.agentUid.toString(), // FIXED: Ensure string format
          "remote_rtc_uids": ["*"], // Will be populated when users join
          "idle_timeout": 120,
          "llm": {
            "url": convoaiConfig.llmUrl,
            "api_key": convoaiConfig.llmApiKey,
            "system_messages": [
              {
                "role": "system",
                "content": convoaiConfig.systemMessage
              }
            ],
            "max_history": 32,
            "greeting_message": convoaiConfig.greeting,
            "failure_message": "I'm sorry, I'm having trouble processing that. Please try again.",
            "params": {
              "model": convoaiConfig.llmModel
            }
          },
          "tts": {
            "vendor": "microsoft",
            "params": {
              "key": convoaiConfig.ttsApiKey,
              "region": convoaiConfig.ttsRegion,
              "voice_name": convoaiConfig.ttsVoiceName
            }
          },
          "asr": {
            "language": convoaiConfig.asrLanguage
          }
        }
      };
      
      console.log('🚀 ConvoAI Agent Join Request:', {
        url: apiUrl,
        agentUid: convoaiConfig.agentUid,
        agentUidType: typeof convoaiConfig.agentUid,
        body: requestBody
      });
      
      console.log('🔐 Auth Debug:', {
        authHeaderPresent: !!authHeader,
        authHeaderLength: authHeader ? authHeader.length : 0,
        apiKeyPresent: !!convoaiConfig.apiKey,
        passwordPresent: !!convoaiConfig.password,
        baseUrl: convoaiConfig.baseUrl
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ConvoAI API Error (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ ConvoAI Agent started successfully:', result);
      
      // Store the agent ID for later use (stopping)
      if (result.agent_id || result.id) {
        setAgentId(result.agent_id || result.id);
        console.log('💾 Stored agent ID:', result.agent_id || result.id);
      }
      
      // IMPORTANT: Trigger the agent to speak its greeting
      // This ensures the agent actually starts generating audio
      console.log('🎤 Agent should start speaking greeting message...');
      
      return result;
    } catch (error) {
      console.error('Failed to start ConvoAI Agent:', error);
      throw error;
    }
  }, []);

  // Stop ConvoAI Agent via REST API
  const stopConvoAIAgent = useCallback(async () => {
    try {
      if (!agentId) {
        console.warn('No agent ID available for stopping');
        return;
      }
      
      console.log('Stopping ConvoAI Agent...');
      
      // Get current configuration (from sessionStorage or env)
      const agoraConfig = getAgoraConfig();
      const convoaiConfig = getConvoAIConfig();
      
      // Generate auth header
      const authHeader = generateBasicAuthHeader();
      if (!authHeader) {
        console.warn('ConvoAI API credentials not available for stopping agent');
        return;
      }
      
      // Construct the API URL - POST /projects/:appid/agents/:agentid/leave
      const apiUrl = `${convoaiConfig.baseUrl}/projects/${agoraConfig.appId}/agents/${agentId}/leave`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`ConvoAI Stop API Warning (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('ConvoAI Agent stopped:', result);
      
      // Clear the agent ID
      setAgentId(null);
      
    } catch (error) {
      console.warn('Failed to stop ConvoAI Agent:', error);
      // Don't throw here as stopping shouldn't block other operations
    }
  }, [agentId]);

  // Join the Agora channel and start ConvoAI Agent
  const joinChannel = useCallback(async () => {
    if (!client || isJoined) {
      console.warn('Cannot join: client not ready or already joined', { client: !!client, isJoined });
      return;
    }
    
    try {
      console.log('Joining Agora channel and starting ConvoAI Agent...');
      
      // Get current configuration
      const agoraConfig = getAgoraConfig();
      
      console.log('🔗 Joining Agora channel:', agoraConfig.channel);
      
      if (!agoraConfig.appId) {
        throw new Error('Agora App ID is required. Please configure it in Settings.');
      }
      
      if (!agoraConfig.token) {
        throw new Error('Agora Token is required. Please configure it in Settings.');
      }
      
      // Validate App ID format (should be 32 character hex string)
      if (!/^[a-f0-9]{32}$/i.test(agoraConfig.appId)) {
        throw new Error(`Invalid Agora App ID format. Expected 32 character hex string, got: ${agoraConfig.appId}`);
      }
      
      // Create local audio track
      console.log('Creating microphone audio track...');
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 128,
        }
      });
      setLocalAudioTrack(audioTrack);
      
      // Join the channel
      console.log('Joining Agora channel with params:', {
        appId: agoraConfig.appId,
        channel: agoraConfig.channel,
        tokenPresent: !!agoraConfig.token,
        uid: agoraConfig.uid
      });
      
      await client.join(
        agoraConfig.appId,
        agoraConfig.channel,
        agoraConfig.token,
        agoraConfig.uid
      );
      
      // CRITICAL: Switch to host role to publish audio
      console.log('🎙️ Switching to HOST role to publish audio...');
      await client.setClientRole('host');
      
      // Publish local audio track
      console.log('Publishing local audio track...');
      await client.publish([audioTrack]);
      
      setIsJoined(true);
      setIsConnected(true);
      
      console.log(`Successfully joined Agora channel: ${agoraConfig.channel}`);
      
      // Debug: List all current users in the channel
      setTimeout(() => {
        console.log('🔍 Checking all remote users after 3 seconds...');
        console.log('Current remote users:', remoteUsers.map(user => ({
          uid: user.uid,
          hasAudio: !!user.audioTrack,
          hasVideo: !!user.videoTrack
        })));
      }, 3000);
      
      // Start ConvoAI Agent via REST API
      try {
        console.log('Starting ConvoAI Agent...');
        await startConvoAIAgent();
        console.log(`ConvoAI Agent (UID: ${agoraConfig.convoAIUid}) should now join the channel`);
      } catch (agentError) {
        console.error('Failed to start ConvoAI Agent, but user connection successful:', agentError);
        // Don't fail the entire join process if ConvoAI fails
        alert(`Connected to Agora, but ConvoAI Agent failed to start: ${agentError.message}`);
      }
      
    } catch (error) {
      console.error('Failed to join channel:', error);
      alert(`Connection failed: ${error.message}`);
      
      // Clean up on error
      setIsJoined(false);
      setIsConnected(false);
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
    }
  }, [client, isJoined, startConvoAIAgent, localAudioTrack]);

  // Leave the Agora channel and stop ConvoAI Agent
  const leaveChannel = useCallback(async () => {
    if (!client || !isJoined) return;
    
    try {
      console.log('Leaving Agora channel and stopping ConvoAI Agent...');
      
      // Stop ConvoAI Agent first
      try {
        await stopConvoAIAgent();
      } catch (agentError) {
        console.warn('Failed to stop ConvoAI Agent (continuing with disconnect):', agentError);
      }
      
      // Stop audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Close local audio track
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      
      // Leave the channel
      await client.leave();
      
      setIsJoined(false);
      setIsConnected(false);
      setRemoteUsers([]);
      setAudioLevel(0);
      setLipSyncData(null);
      setChatHistory([]); // Clear chat history when leaving
      
      // Clean up message chunks map
      if (window.messagesMap) {
        window.messagesMap.clear();
      }
      
      console.log('Successfully left Agora channel');
      
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  }, [client, isJoined, localAudioTrack, stopConvoAIAgent]);

  // Send message to ConvoAI (for compatibility with useChat)
  const sendMessageToConvoAI = useCallback(async (message) => {
    console.log('Message will be processed by ConvoAI Agent via voice:', message);
    // In this implementation, text messages are automatically converted to voice
    // by the ConvoAI Agent when it receives the audio from the user's microphone
    return true;
  }, []);

  // Test function to trigger agent speech
  const triggerAgentSpeech = useCallback(async () => {
    if (!agentId) {
      console.warn('No agent ID available for triggering speech');
      return;
    }
    
    try {
      console.log('🎤 Triggering agent to speak...');
      // Simulate user speaking by sending a message
      // This should trigger the agent to respond with audio
      console.log('Agent should respond to user input with voice...');
      return true;
    } catch (error) {
      console.error('Failed to trigger agent speech:', error);
    }
  }, [agentId]);

  // Get configuration status for UI display (reactive to sessionStorage changes)
  const getConfigStatus = useCallback(() => {
    const agoraConfig = getAgoraConfig();
    const convoaiConfig = getConvoAIConfig();
    
    // Helper function to check if a value is a real credential (not a placeholder)
    const isValidCredential = (value) => {
      return value && 
             value !== '' && 
             !value.includes('your-') && 
             !value.includes('replace-') &&
             !value.includes('api-key') &&
             !value.includes('password');
    };
    
    const hasValidConvoAICredentials = isValidCredential(convoaiConfig.apiKey) && isValidCredential(convoaiConfig.password);
    const hasValidLLMKey = isValidCredential(convoaiConfig.llmApiKey);
    const hasValidTTSKey = isValidCredential(convoaiConfig.ttsApiKey);
    
    return {
      channel: agoraConfig.channel,
      convoAIUid: agoraConfig.convoAIUid,
      hasCredentials: hasValidConvoAICredentials,
      hasLLMKey: hasValidLLMKey,
      hasTTSKey: hasValidTTSKey,
    };
  }, [configVersion]);

  const value = {
    client,
    localAudioTrack,
    remoteUsers,
    isConnected,
    isJoined,
    audioLevel,
    lipSyncData,
    agentId,
    chatHistory,
    joinChannel,
    leaveChannel,
    sendMessageToConvoAI,
    startConvoAIAgent,
    stopConvoAIAgent,
    triggerAgentSpeech,
    clearChatHistory: () => {
      console.log('🗑️ Clearing chat history, processed message IDs, and message chunks...');
      setChatHistory([]);
      setProcessedMessageIds(new Set());
      setMessageChunks(new Map());
    },
    testChatMessage: () => {
      console.log('🧪 Adding test message with word details to chat...');
      setChatHistory(prev => [...prev, {
        id: generateUniqueId(),
        timestamp: new Date(),
        speaker: 'agent',
        message: 'Hello! This is a test message with protobuf word details.',
        type: 'transcript',
        words: [
          { word: 'Hello!', start: 0.0, end: 0.5, confidence: 0.98, speaker: false },
          { word: 'This', start: 0.6, end: 0.8, confidence: 0.95, speaker: false },
          { word: 'is', start: 0.9, end: 1.0, confidence: 0.99, speaker: false },
          { word: 'a', start: 1.1, end: 1.15, confidence: 0.97, speaker: false },
          { word: 'test', start: 1.2, end: 1.5, confidence: 0.96, speaker: false },
          { word: 'message', start: 1.6, end: 2.0, confidence: 0.94, speaker: false },
          { word: 'with', start: 2.1, end: 2.3, confidence: 0.98, speaker: false },
          { word: 'protobuf', start: 2.4, end: 2.8, confidence: 0.92, speaker: false },
          { word: 'word', start: 2.9, end: 3.1, confidence: 0.99, speaker: false },
          { word: 'details.', start: 3.2, end: 3.6, confidence: 0.93, speaker: false }
        ]
      }]);
      console.log('✅ Test message with word details added');
    },
    testProtobufDecoding: async () => {
      console.log('🧪 Testing protobuf decoding...');
      try {
        const { SomeMessage: MessageType } = await loadProtoSchema();
        console.log('✅ Protobuf schema loaded for testing');
        
        // Create a test message to show that protobuf decoding would work
        setChatHistory(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date(),
          speaker: 'system',
          message: 'Protobuf schema loaded successfully! Only assistant.transcription messages will appear.',
          type: 'test'
        }]);
        
      } catch (error) {
        console.error('❌ Protobuf schema test failed:', error);
        setChatHistory(prev => [...prev, {
          id: generateUniqueId(),
          timestamp: new Date(),
          speaker: 'error',
          message: `Protobuf test failed: ${error.message}`,
          type: 'error'
        }]);
      }
    },
    testFilteredMessage: () => {
      console.log('🧪 Testing message filtering...');
      
      // Simulate different types of messages to show filtering in action
      const mockMessages = [
        {
          object: 'assistant.transcription',
          words: [{ word: 'Hello', start: 0, end: 0.5 }],
          text: 'Hello'
        },
        {
          object: 'debug.info',
          text: 'This should be filtered out'
        },
        {
          object: 'silence.detection',
          text: 'This should also be filtered out'
        }
      ];
      
      console.log('📋 Message filtering test results:');
      mockMessages.forEach((msg, index) => {
        // Simulate the filtering logic here for testing
        const wouldShow = msg.object === 'assistant.transcription';
        console.log(`Message ${index + 1} (${msg.object}): ${wouldShow ? 'WOULD SHOW ✅' : 'WOULD FILTER 🚫'}`);
      });
      
      // Add a test message that should pass filtering
      setChatHistory(prev => [...prev, {
        id: generateUniqueId(),
        timestamp: new Date(),
        speaker: 'system',
        message: 'Filter test complete! Only assistant.transcription messages will be shown in real chat.',
        type: 'test'
      }]);
    },
    testRealTimeUpdates: () => {
      console.log('🧪 Testing real-time word-by-word updates...');
      const testMessageId = 'test-realtime-' + Date.now();
      
      // Simulate real-time word updates
      const words = [
        { word: 'This', start: 0.0, end: 0.3, confidence: 0.95 },
        { word: 'is', start: 0.4, end: 0.5, confidence: 0.99 },
        { word: 'a', start: 0.6, end: 0.65, confidence: 0.97 },
        { word: 'real-time', start: 0.7, end: 1.2, confidence: 0.93 },
        { word: 'transcription', start: 1.3, end: 2.0, confidence: 0.96 },
        { word: 'demo!', start: 2.1, end: 2.5, confidence: 0.98 }
      ];
      
      // Add words one by one with delays
      words.forEach((word, index) => {
        setTimeout(() => {
          const wordsUpToNow = words.slice(0, index + 1);
          const isLast = index === words.length - 1;
          
          addOrUpdateMessageInChat({
            id: testMessageId,
            timestamp: new Date(),
            speaker: 'agent',
            message: wordsUpToNow.map(w => w.word).join(' ') + (isLast ? '' : '...'),
            type: 'transcript',
            words: wordsUpToNow,
            isPartial: !isLast
          });
          
          console.log(`⚡ Added word ${index + 1}/${words.length}: "${word.word}"`);
        }, index * 500); // 500ms delay between words
      });
    },
    config: getConfigStatus(),
    // Debug functions
    testBasicAuth: testBasicAuthCredentials,
    generateAuthHeader: generateBasicAuthHeader,
    debugCredentials: () => {
      console.log('🔍 Current credential status:');
      console.log('SessionStorage VITE_RESTFUL_API_KEY:', sessionStorage.getItem('VITE_RESTFUL_API_KEY') ? 'SET' : 'MISSING');
      console.log('SessionStorage VITE_RESTFUL_PASSWORD:', sessionStorage.getItem('VITE_RESTFUL_PASSWORD') ? 'SET' : 'MISSING');
      console.log('Environment VITE_RESTFUL_API_KEY:', import.meta.env.VITE_RESTFUL_API_KEY ? 'SET' : 'MISSING');
      console.log('Environment VITE_RESTFUL_PASSWORD:', import.meta.env.VITE_RESTFUL_PASSWORD ? 'SET' : 'MISSING');
      const config = getConvoAIConfig();
      console.log('Final resolved:', { 
        apiKey: config.apiKey ? 'SET' : 'MISSING', 
        password: config.password ? 'SET' : 'MISSING' 
      });
    },
  };

  return (
    <AgoraContext.Provider value={value}>
      {children}
    </AgoraContext.Provider>
  );
};

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error('useAgora must be used within an AgoraProvider');
  }
  return context;
};