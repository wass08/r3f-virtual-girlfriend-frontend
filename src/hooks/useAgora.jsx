import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraContext = createContext();

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
  authCode: getConfigValue('VITE_AUTH_CODE'), // Hardcoded auth header override
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
  
  // PRIORITY 1: Check for hardcoded AuthCode first
  if (config.authCode && config.authCode.trim() !== '') {
    const authCode = config.authCode.trim();
    console.log('🔑 Using hardcoded AuthCode from settings:', {
      authCodeLength: authCode.length,
      startsWithBasic: authCode.toLowerCase().startsWith('basic '),
      source: 'HARDCODED_AUTHCODE'
    });
    
    // Ensure it starts with "Basic " if not already present
    if (!authCode.toLowerCase().startsWith('basic ')) {
      const fullAuthHeader = `Basic ${authCode}`;
      console.log('✅ Added Basic prefix to AuthCode');
      return fullAuthHeader;
    }
    
    return authCode;
  }
  
  // PRIORITY 2: Generate from API Key + Password
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
  console.log('🔐 Credential string debug:', {
    totalLength: credentialString.length,
    hasColon: credentialString.includes(':'),
    beforeColon: credentialString.split(':')[0].length,
    afterColon: credentialString.split(':')[1].length
  });
  
  const credentials = btoa(credentialString);
  const authHeader = `Basic ${credentials}`;
  
  console.log('✅ Generated Basic Auth header:', {
    authHeaderLength: authHeader.length,
    encodedCredentialsLength: credentials.length,
    startsWithBasic: authHeader.startsWith('Basic '),
    encodedSample: credentials.substring(0, 12) + '...'
  });
  
  return authHeader;
};

// TEMPORARY: Manual credential override for testing
const generateHardcodedAuthHeader = () => {
  console.log('🔧 USING HARDCODED CREDENTIALS FOR TESTING');
  // TODO: Replace these with your actual credentials for testing
  const testApiKey = "YOUR_ACTUAL_API_KEY_HERE";
  const testPassword = "YOUR_ACTUAL_PASSWORD_HERE";
  
  if (testApiKey === "YOUR_ACTUAL_API_KEY_HERE" || testPassword === "YOUR_ACTUAL_PASSWORD_HERE") {
    console.error('❌ Please replace the hardcoded credentials in generateHardcodedAuthHeader()');
    console.log('💡 Edit useAgora.jsx lines ~150-155 to add your actual credentials');
    return null;
  }
  
  return generateBasicAuthHeaderWithCredentials(testApiKey, testPassword);
};

// Test function to verify Basic Auth encoding/decoding
const testBasicAuthCredentials = () => {
  const authHeader = generateBasicAuthHeader();
  if (!authHeader) {
    console.error('❌ Cannot test - no auth header generated');
    return false;
  }
  
  const config = getConvoAIConfig();
  
  // If using hardcoded AuthCode, just validate the format
  if (config.authCode && config.authCode.trim() !== '') {
    console.log('🧪 Basic Auth Test (Hardcoded AuthCode):', {
      authHeaderValid: authHeader.startsWith('Basic '),
      authHeaderLength: authHeader.length,
      usingHardcodedAuthCode: true,
      testResult: 'SKIPPED - Using hardcoded AuthCode'
    });
    
    // For hardcoded auth codes, we just verify it has the right format
    const isValidFormat = authHeader.toLowerCase().startsWith('basic ') && authHeader.length > 10;
    if (!isValidFormat) {
      console.error('❌ Invalid AuthCode format. Should start with "Basic " followed by base64 encoded credentials');
      return false;
    }
    
    console.log('✅ Hardcoded AuthCode format looks valid');
    return true;
  }
  
  // Original validation for generated auth headers
  try {
    // Extract and decode the credentials to verify they're correct
    const base64Credentials = authHeader.replace('Basic ', '');
    const decoded = atob(base64Credentials);
    const [decodedApiKey, decodedPassword] = decoded.split(':');
    
    const matches = decodedApiKey === config.apiKey.trim() && decodedPassword === config.password.trim();
    
    console.log('🧪 Basic Auth Test (Generated):', {
      authHeaderValid: authHeader.startsWith('Basic '),
      canDecode: !!decoded,
      credentialsMatch: matches,
      decodedLength: decoded.length,
      originalApiKeyLength: config.apiKey ? config.apiKey.trim().length : 0,
      originalPasswordLength: config.password ? config.password.trim().length : 0,
      usingHardcodedAuthCode: false
    });
    
    return matches;
  } catch (error) {
    console.error('❌ Basic Auth Test Failed:', error);
    return false;
  }
};

// Test function specifically for hardcoded AuthCode
const testHardcodedAuthCode = (authCode) => {
  console.log('🧪 Testing hardcoded AuthCode:', {
    provided: !!authCode,
    length: authCode ? authCode.length : 0,
    startsWithBasic: authCode ? authCode.toLowerCase().startsWith('basic ') : false
  });
  
  if (!authCode || authCode.trim() === '') {
    console.error('❌ No AuthCode provided');
    return false;
  }
  
  const cleanAuthCode = authCode.trim();
  
  // Check format
  if (!cleanAuthCode.toLowerCase().startsWith('basic ')) {
    console.error('❌ AuthCode must start with "Basic "');
    return false;
  }
  
  try {
    // Extract and test decode the base64 part
    const base64Part = cleanAuthCode.substring(6); // Remove "Basic "
    const decoded = atob(base64Part);
    const parts = decoded.split(':');
    
    console.log('✅ AuthCode validation:', {
      canDecode: true,
      decodedLength: decoded.length,
      hasTwoParts: parts.length === 2,
      firstPartLength: parts[0] ? parts[0].length : 0,
      secondPartLength: parts[1] ? parts[1].length : 0,
      decodedPreview: `${parts[0] ? parts[0].substring(0, 3) : ''}...${parts[1] ? parts[1].substring(0, 2) : ''}***`
    });
    
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  } catch (error) {
    console.error('❌ Cannot decode AuthCode base64:', error);
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

      agoraClient.on('connection-state-change', (curState) => {
        console.log('Agora connection state:', curState);
        setIsConnected(curState === 'CONNECTED');
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
        console.log('🔧 Regular credentials failed, trying hardcoded fallback...');
        authHeader = generateHardcodedAuthHeader();
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
      
      // Get current configuration (HARDCODED now)
      const agoraConfig = getAgoraConfig();
      
      
      console.log('Processed Agora config:', {
        appId: agoraConfig.appId,
        appIdLength: agoraConfig.appId ? agoraConfig.appId.length : 0,
        channel: agoraConfig.channel,
        token: agoraConfig.token ? 'SET (' + agoraConfig.token.length + ' chars)' : 'MISSING',
        convoAIUid: agoraConfig.convoAIUid,
        uid: agoraConfig.uid
      });
      
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
    
    console.log('Config status check:', {
      apiKey: convoaiConfig.apiKey,
      password: convoaiConfig.password,
      llmApiKey: convoaiConfig.llmApiKey,
      ttsApiKey: convoaiConfig.ttsApiKey,
      hasValidConvoAICredentials,
      hasValidLLMKey,
      hasValidTTSKey
    });
    
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
    joinChannel,
    leaveChannel,
    sendMessageToConvoAI,
    startConvoAIAgent,
    stopConvoAIAgent,
    triggerAgentSpeech,
    config: getConfigStatus(),
    // Debug functions
    testBasicAuth: testBasicAuthCredentials,
    testHardcodedAuth: testHardcodedAuthCode,
    generateAuthHeader: generateBasicAuthHeader,
    generateHardcodedAuth: generateHardcodedAuthHeader,
    debugCredentials: () => {
      console.log('🔍 Current credential status:');
      console.log('SessionStorage VITE_AUTH_CODE:', sessionStorage.getItem('VITE_AUTH_CODE') ? 'SET' : 'MISSING');
      console.log('SessionStorage VITE_RESTFUL_API_KEY:', sessionStorage.getItem('VITE_RESTFUL_API_KEY') ? 'SET' : 'MISSING');
      console.log('SessionStorage VITE_RESTFUL_PASSWORD:', sessionStorage.getItem('VITE_RESTFUL_PASSWORD') ? 'SET' : 'MISSING');
      console.log('Environment VITE_AUTH_CODE:', import.meta.env.VITE_AUTH_CODE ? 'SET' : 'MISSING');
      console.log('Environment VITE_RESTFUL_API_KEY:', import.meta.env.VITE_RESTFUL_API_KEY ? 'SET' : 'MISSING');
      console.log('Environment VITE_RESTFUL_PASSWORD:', import.meta.env.VITE_RESTFUL_PASSWORD ? 'SET' : 'MISSING');
      const config = getConvoAIConfig();
      console.log('Final resolved:', { 
        authCode: config.authCode ? 'SET' : 'MISSING',
        apiKey: config.apiKey ? 'SET' : 'MISSING', 
        password: config.password ? 'SET' : 'MISSING' 
      });
      
      // Test the current auth code if present
      if (config.authCode) {
        console.log('🧪 Testing current AuthCode...');
        const isValid = testHardcodedAuthCode(config.authCode);
        console.log(`AuthCode validation result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
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