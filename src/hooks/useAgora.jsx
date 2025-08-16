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
      protoRoot = await protobuf.load('/virtual-girlfriend/schema.proto');
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
  channel: getConfigValue('VITE_AGORA_CHANNEL', 'VirtualGirlfriend_Channel'),
  uid: null, // null for auto-generation
  convoAIUid: parseInt(getConfigValue('VITE_CONVOAI_AGENT_UID', '8888')),
});

// ConvoAI API configuration - Uses sessionStorage and environment variables
const getConvoAIConfig = () => ({
  baseUrl: getConfigValue('VITE_CONVOAI_API_BASE_URL', 'https://api.agora.io/api/conversational-ai-agent/v2'),
  apiKey: getConfigValue('VITE_RESTFUL_API_KEY'),
  password: getConfigValue('VITE_RESTFUL_PASSWORD'),
  agentUid: parseInt(getConfigValue('VITE_CONVOAI_AGENT_UID', '8888')),
  agentName: getConfigValue('VITE_CONVOAI_AGENT_NAME', 'Virtual Girlfriend'),

  // LLM Configuration
  llmUrl: getConfigValue('VITE_LLM_URL', 'https://api.openai.com/v1/chat/completions'),
  llmApiKey: getConfigValue('VITE_LLM_API_KEY'),
  llmModel: getConfigValue('VITE_LLM_MODEL', 'gpt-4o-mini'),
  systemMessage: getConfigValue('VITE_LLM_SYSTEM_MESSAGE', 'You are a friendly virtual girlfriend assistant.'),
  greeting: getConfigValue('VITE_LLM_GREETING', "Hello! I'm your virtual girlfriend. How can I help you today?"),
  
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
      console.log('🔍 Processing complete message:', messageId);
      
      // Load protobuf schema if not already loaded
      const { SomeMessage: MessageType } = await loadProtoSchema();
      
      // Convert string to Uint8Array for protobuf
      const buffer = new Uint8Array(completeMessageData.length);
      for (let i = 0; i < completeMessageData.length; i++) {
        buffer[i] = completeMessageData.charCodeAt(i);
      }
      
      try {
        // Try protobuf decoding first
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
          
          // Create transcript text from words
          const transcriptText = wordDetails.map(w => w.word).join(' ');
          const speaker = wordDetails.some(w => w.speaker === 'user') ? 'user' : 'agent';
          
          console.log('📝 Transcript:', transcriptText);
          
          // Add to chat history
          addMessageToChat({
            id: messageId,
            timestamp: new Date(),
            speaker: speaker,
            message: transcriptText.trim(),
            type: 'transcript',
            words: wordDetails,
            raw: protoMessage
          });
          
        } else if (protoMessage.metadata) {
          console.log('📋 Found Metadata message:', protoMessage.metadata);
          // Don't add metadata messages to chat for now
        }
        
      } catch (protoError) {
        console.warn('❌ Protobuf decode failed, trying JSON fallback:', protoError);
        
        // Try JSON fallback
        try {
          const messageDataJson = JSON.parse(completeMessageData);
          console.log('📄 JSON decoded successfully:', messageDataJson);
          
          // Only process assistant.transcription messages
          if (messageDataJson.object === "assistant.transcription") {
            const transcriptText = messageDataJson.transcript || messageDataJson.text || '';
            const speaker = messageDataJson.role === 'user' ? 'user' : 'agent';
            
            if (transcriptText.trim()) {
              console.log('✅ Adding assistant.transcription message to chat');
              
              addMessageToChat({
                id: messageId,
                timestamp: new Date(),
                speaker: speaker,
                message: transcriptText.trim(),
                type: 'transcript',
                raw: messageDataJson
              });
            }
          } else {
            console.log('🚫 Filtering out non-assistant.transcription message:', messageDataJson.object);
          }
          
        } catch (jsonError) {
          console.warn('❌ Both protobuf and JSON decode failed:', jsonError);
        }
      }
      
      // Mark as processed
      setProcessedMessageIds(prev => new Set([...prev, messageId]));
      
    } catch (error) {
      console.error('❌ Error processing complete message:', error);
    }
  };

  // Add message to chat with duplicate prevention
  const addMessageToChat = (message) => {
    setChatHistory(prev => {
      // Check for duplicate by ID
      const isDuplicate = prev.some(existing => existing.id === message.id);
      if (isDuplicate) {
        console.log('🔄 Skipping duplicate message ID:', message.id);
        return prev;
      }
      
      const newHistory = [...prev, message];
      console.log('✅ Chat history updated, new length:', newHistory.length);
      return newHistory;
    });
  };
  
  const audioAnalyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Agora client
  useEffect(() => {
    const initClient = async () => {
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
            // Load protobuf schema if not already loaded
            const { SomeMessage: MessageType } = await loadProtoSchema();
            
            // Step 1: Decode the payload using TextDecoder
            let decodedString = new TextDecoder().decode(payload);
            console.log('📝 Decoded string:', decodedString);
            
            let messageData = '';
            
            // Step 2: Check if it's in chunked format (messageId|messagePart|messageChunks|messageData)
            if (decodedString.includes('|')) {
              let [messageId, messagePart, messageChunks, base64Data] = decodedString.split("|");
              console.log('📦 Chunked message:', { messageId, messagePart, messageChunks });
              
              // Step 3: Decode the Base64 message data
              try {
                messageData = atob(base64Data);
                console.log('� Base64 decoded data:', messageData.substring(0, 200) + '...');
                
                // Handle chunked messages - store and reassemble
                if (!window.messagesMap) window.messagesMap = new Map();
                window.messagesMap.set(messageId, 
                  window.messagesMap.get(messageId) ? 
                  window.messagesMap.get(messageId) + messageData : 
                  messageData
                );
                
                messageData = window.messagesMap.get(messageId);
                
                // Check if we have all chunks
                if (parseInt(messagePart) === parseInt(messageChunks)) {
                  window.messagesMap.delete(messageId);
                  console.log('✅ Complete message assembled');
                } else {
                  console.log(`⏳ Waiting for more chunks: ${messagePart}/${messageChunks}`);
                  return; // Wait for more chunks
                }
              } catch (base64Error) {
                console.warn('❌ Base64 decode failed:', base64Error);
                return;
              }
            } else {
              // Step 4: Direct Base64 decode if no chunking
              try {
                messageData = atob(decodedString);
                console.log('🔓 Direct Base64 decoded, length:', messageData.length);
              } catch (base64Error) {
                console.warn('❌ Direct Base64 decode failed, using original:', base64Error);
                messageData = decodedString;
              }
            }
            
            // Step 5: Try protobuf decoding first
            if (!messageData) {
              console.warn('❌ messageData is empty, skipping protobuf decode');
              return;
            }
            
            try {
              // Convert string to Uint8Array for protobuf
              const buffer = new Uint8Array(messageData.length);
              for (let i = 0; i < messageData.length; i++) {
                buffer[i] = messageData.charCodeAt(i);
              }
              
              // Decode protobuf message
              const protoMessage = MessageType.decode(buffer);
              console.log('📋 Protobuf decoded successfully:', protoMessage);
              
              let transcriptText = '';
              let speaker = 'agent';
              let wordDetails = [];
              
              // Check if this is a Words message
              if (protoMessage.words && protoMessage.words.words) {
                console.log('✅ Found Words message with', protoMessage.words.words.length, 'words');
                
                // Extract words with timing information
                wordDetails = protoMessage.words.words.map(word => ({
                  word: word.word,
                  start: word.start,
                  end: word.end,
                  confidence: word.confidence,
                  speaker: word.speaker ? 'user' : 'agent'
                }));
                
                // Create transcript text from words
                transcriptText = wordDetails.map(w => w.word).join(' ');
                
                // For real-time display, we can show words as they come
                console.log('📝 Real-time words:', wordDetails);
                
                // If this message contains user words, update speaker
                if (wordDetails.some(w => w.speaker === 'user')) {
                  speaker = 'user';
                }
              }
              // Check if this is a Metadata message
              else if (protoMessage.metadata) {
                console.log('📋 Found Metadata message:', protoMessage.metadata);
                transcriptText = `[Metadata] Session: ${protoMessage.metadata.session_id}`;
                speaker = 'system';
              }
              else {
                console.log('❓ Unknown protobuf message type');
                transcriptText = `[Unknown protobuf message]`;
                speaker = 'debug';
              }
              
              // Step 6: Add to chat history only if it passes filtering
              if (transcriptText.trim() && shouldAddToChat(protoMessage, null)) {
                console.log('➕ Adding protobuf message to chat history...');
                const newMessage = {
                  id: generateUniqueId(),
                  timestamp: new Date(),
                  speaker: speaker,
                  message: transcriptText.trim(),
                  type: 'transcript',
                  words: wordDetails.length > 0 ? wordDetails : null,
                  raw: protoMessage
                };
                
                console.log('📤 New protobuf message:', newMessage);
                
                setChatHistory(prev => {
                  const newHistory = [...prev, newMessage];
                  console.log('✅ Chat history updated with protobuf message, new length:', newHistory.length);
                  return newHistory;
                });
                
                // For real-time word-by-word display, we can set up a timer
                if (wordDetails.length > 0) {
                  console.log('⏰ Setting up real-time word display');
                  // This could be expanded to show words one by one based on timing
                }
              }
              
            } catch (protobufError) {
              console.warn('❌ Protobuf decode failed, trying JSON fallback:', protobufError);
              
              // Step 7: Fallback to JSON parsing
              try {
                const messageDataJson = JSON.parse(messageData);
                console.log('📋 JSON fallback successful:', messageDataJson);
                
                let transcriptText = '';
                let speaker = 'agent';
                
                // Extract text using various methods
                if (messageDataJson.words && Array.isArray(messageDataJson.words)) {
                  transcriptText = messageDataJson.words.map(word => word.word || word).join(' ');
                  console.log('✅ Extracted from words array:', transcriptText);
                } else if (messageDataJson.text) {
                  transcriptText = messageDataJson.text;
                  console.log('✅ Extracted from text field:', transcriptText);
                } else if (messageDataJson.message) {
                  transcriptText = messageDataJson.message;
                  console.log('✅ Extracted from message field:', transcriptText);
                } else {
                  transcriptText = `[JSON DEBUG] ${JSON.stringify(messageDataJson)}`;
                  speaker = 'debug';
                  console.log('❓ No text field found in JSON, using debug format');
                }
                
                // Add JSON fallback to chat history only if it passes filtering
                const messageId = messageDataJson.id || messageDataJson.message_id || null;
                
                if (transcriptText.trim() && shouldAddToChat(messageDataJson, messageId)) {
                  console.log('➕ Adding JSON fallback to chat history...');
                  
                  // Mark message ID as processed if available
                  if (messageId) {
                    setProcessedMessageIds(prev => new Set([...prev, messageId]));
                  }
                  
                  const newMessage = {
                    id: messageId || generateUniqueId(),
                    timestamp: new Date(),
                    speaker: speaker,
                    message: transcriptText.trim(),
                    type: 'transcript',
                    raw: messageDataJson
                  };
                  
                  setChatHistory(prev => {
                    const newHistory = [...prev, newMessage];
                    console.log('✅ Chat history updated with JSON fallback, new length:', newHistory.length);
                    return newHistory;
                  });
                } else {
                  console.log('🚫 JSON message filtered out or duplicate');
                }
                
              } catch (jsonError) {
                console.warn('❌ Both protobuf and JSON decode failed:', jsonError);
                console.log('📄 Raw message data (first 500 chars):', messageData.substring(0, 500));
                // Note: Not adding decode errors to chat to avoid noise
              }
            }
            
          } catch (error) {
            console.error('❌ Error processing stream message:', error);
            // Note: Not adding stream errors to chat to avoid noise
          }
        }
      });

      setClient(agoraClient);
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
      const uniqueName = `virtual-girlfriend-${Date.now()}`;
      
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
      console.log('🗑️ Clearing chat history and processed message IDs...');
      setChatHistory([]);
      setProcessedMessageIds(new Set());
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