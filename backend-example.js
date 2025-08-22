// Example Backend Integration for ConvoAI + Agora
// This is a sample implementation - adapt to your backend framework

const express = require('express');
const cors = require('cors');
const { ConvoAIEngine } = require('@agora/convoai'); // Example - replace with actual ConvoAI SDK
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const CONVOAI_API_KEY = process.env.CONVOAI_API_KEY;
const CONVOAI_UID = 8888; // Must match frontend configuration

// Initialize ConvoAI Engine
const convoAI = new ConvoAIEngine({
  apiKey: CONVOAI_API_KEY,
  // Add other ConvoAI configuration
});

// Endpoint to handle chat messages and trigger ConvoAI response
app.post('/api/convoai/message', async (req, res) => {
  try {
    const { message, channel, convoAIUid } = req.body;
    
    console.log(`Received message: "${message}" for channel: ${channel}`);
    
    // 1. Generate Agora token for ConvoAI if needed
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channel,
      convoAIUid,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    );
    
    // 2. Configure ConvoAI to join the Agora channel
    await convoAI.joinChannel({
      appId: AGORA_APP_ID,
      channel: channel,
      token: token,
      uid: convoAIUid
    });
    
    // 3. Send the message to ConvoAI for processing
    const response = await convoAI.sendMessage({
      text: message,
      voice: {
        // Configure voice parameters
        speed: 1.0,
        pitch: 1.0,
        emotion: 'friendly'
      },
      // Configure response behavior
      responseMode: 'realtime', // Real-time voice response
      outputChannel: channel     // Speak directly to Agora channel
    });
    
    // 4. ConvoAI should now be speaking in the Agora channel
    // The frontend will automatically detect and sync lips
    
    res.json({
      success: true,
      message: 'ConvoAI is responding in real-time',
      responseId: response.id
    });
    
  } catch (error) {
    console.error('ConvoAI integration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to generate Agora tokens for frontend clients
app.post('/api/agora/token', (req, res) => {
  try {
    const { channel, uid } = req.body;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channel,
      uid || 0,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    );
    
    res.json({
      success: true,
      token: token,
      appId: AGORA_APP_ID
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      agora: !!AGORA_APP_ID,
      convoAI: !!CONVOAI_API_KEY
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('ConvoAI + Agora integration ready');
});

module.exports = app;
