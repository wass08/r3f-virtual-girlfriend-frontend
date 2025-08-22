# 🎭 3D Virtual Agent with Real-Time AI & Lip Sync

**Live Demo**: https://chitimalli.github.io/virtual-agent/

> **Advanced 3D Avatar with Agora ConvoAI Integration and Real-Time Lip Synchronization**

![Video Thumbnail](https://img.youtube.com/vi/EzzcEL_1o9o/maxresdefault.jpg)

## 🌟 Revolutionary Features

### � **Real-Time Lip Sync Technology**
- **WebAudio API Integration** - Analyzes live audio in real-time
- **Advanced Viseme Processing** - Maps speech sounds to realistic mouth shapes
- **Morph Target Animation** - 20+ facial morph targets for natural expressions
- **Smooth Interpolation** - Delta-time based easing for fluid mouth movements
- **Breathing Simulation** - Subtle variations for lifelike behavior

### 🤖 **Agora ConvoAI Integration**
- **Ultra-Low Latency** - Real-time voice communication via WebRTC
- **AI-Powered Conversations** - Intelligent responses with personality
- **Automatic Speech Recognition** - Voice-to-text processing
- **Text-to-Speech Synthesis** - Natural voice generation
- **Multi-Language Support** - Configurable language settings

### 🎨 **Advanced 3D Avatar System**
- **Facial Expression Engine** - 7 distinct emotional states (Happy, Sad, Angry, etc.)
- **Animation Controller** - 8+ body animations (Idle, Talking, Dancing, etc.)
- **Real-Time Morphing** - Facial features respond to voice input
- **Manual Control** - UI panels for expression/animation override
- **Smooth Transitions** - Seamless blending between states

## 🎯 How It Works

### Real-Time Communication Flow
```
Your Voice → Agora WebRTC → ConvoAI Processing → AI Response → TTS → Avatar Lip Sync
     ↑                                                                        ↓
WebAudio Analysis ←────────────────────────────────────────── Audio Output
```

1. **Voice Input**: Your microphone captures speech via Agora WebRTC
2. **Live Analysis**: WebAudio API analyzes audio frequency data in real-time
3. **Viseme Mapping**: Speech sounds are mapped to mouth shape visemes (A, E, I, O, U, etc.)
4. **Morph Target Control**: 20+ facial morph targets create realistic mouth movements
5. **AI Processing**: ConvoAI processes your speech and generates intelligent responses
6. **TTS Output**: AI response is converted to natural speech
7. **Synchronized Animation**: Avatar mouth moves in perfect sync with AI speech

### Lip Sync Technology Deep Dive

#### **Enhanced Mouth Morph Targets**
```javascript
// Vowel Sounds - Wide mouth shapes
A: { jawOpen: 0.7, mouthOpen: 0.8, mouthWide: 0.5 }
E: { jawOpen: 0.4, mouthOpen: 0.6, mouthWide: 0.7, mouthSmile: 0.3 }
I: { jawOpen: 0.2, mouthOpen: 0.3, mouthWide: 0.8, mouthSmile: 0.5 }
O: { jawOpen: 0.5, mouthOpen: 0.7, mouthFunnel: 0.6, mouthPucker: 0.4 }
U: { jawOpen: 0.3, mouthOpen: 0.4, mouthFunnel: 0.8, mouthPucker: 0.7 }

// Consonant Sounds
B: { mouthPressLeft: 0.8, mouthPressRight: 0.8, mouthClose: 0.9 }
F: { jawOpen: 0.1, mouthOpen: 0.2, mouthFunnel: 0.3 }
```

#### **Smooth Animation System**
- **Exponential Smoothing**: Reduces audio jitter while maintaining responsiveness
- **Delta Time Integration**: Frame-rate independent animations
- **Viseme Transitions**: Smooth blending between different mouth shapes
- **Breathing Variation**: Subtle sine wave variations for natural movement
- **Audio Level Scaling**: Mouth movement intensity matches voice volume

## 🚀 Quick Start

### 1. **Access the App**
Visit: https://chitimalli.github.io/virtual-agent/

### 2. **Configure APIs**
Click **Settings** and enter your credentials:

#### **Agora Configuration**
```
App ID: [Your Agora App ID]
Token: [Your Agora Token] 
Channel: [Voice Channel Name]
```

#### **ConvoAI Configuration**
```
API Key: [Your ConvoAI API Key]
Password: [Your ConvoAI Password]
Agent UID: [ConvoAI Agent Identifier]
```

#### **AI Services**
```
LLM API Key: [OpenAI/Other LLM Key]
TTS API Key: [Azure/Other TTS Key]
TTS Region: [Service Region]
Voice Name: [Preferred Voice]
```

### 3. **Start Conversation**
1. Click **Connect** to join the voice channel
2. Wait for ConvoAI agent to connect
3. Start speaking - watch real-time lip sync!
4. Avatar responds with AI-generated speech

## 🎮 Manual Controls

### **Facial Expression Panel**
- 😐 Default
- 😊 Smile  
- 😲 Surprised
- 🤪 Funny Face
- 😢 Sad
- 😠 Angry
- 🤯 Crazy

### **Animation Panel**
- 🧘 Idle
- 💬 Talking (3 variants)
- 😂 Laughing
- 😭 Crying
- 😡 Angry
- 😨 Terrified

*Manual controls override AI behavior for creative control*

## 🔧 Technical Architecture

### **Frontend Stack**
- **React Three Fiber** - 3D rendering and animation
- **Three.js** - WebGL graphics engine
- **WebAudio API** - Real-time audio analysis
- **Agora SDK** - WebRTC communication
- **Tailwind CSS** - UI styling

### **Real-Time Processing**
- **Audio Sampling**: 44.1kHz audio analysis
- **Frequency Analysis**: FFT processing for audio features
- **Viseme Detection**: Speech sound classification
- **Morph Target Interpolation**: Smooth facial animation
- **Frame Rate**: 60fps animation updates

### **3D Model Features**
- **File Format**: GLB (optimized for web)
- **Facial Rig**: 50+ morph targets
- **Animation System**: Mixamo-compatible FBX animations
- **Texture Resolution**: Optimized for real-time rendering
- **LOD System**: Performance-optimized for web browsers

## 💰 Cost Structure

### **User-Controlled Costs**
You provide all API credentials and control spending:

- **Agora Voice/Video**: 
  - FREE: 10,000 minutes/month
  - Paid: $0.99/1000 minutes
  
- **ConvoAI**: 
  - Based on usage plan
  - Real-time AI conversation processing
  
- **OpenAI (LLM)**:
  - GPT-4: ~$0.03/1000 tokens
  - GPT-3.5: ~$0.002/1000 tokens
  
- **Azure TTS**:
  - FREE: 500,000 characters/month
  - Paid: $4/1M characters

### **Developer Costs: $0**
- **GitHub Pages**: FREE hosting
- **No Backend**: Pure frontend application
- **No Server Costs**: Everything runs client-side

## 🛡️ Privacy & Security

- ✅ **Zero Data Storage** - No conversation logs or personal data stored
- ✅ **Client-Side Processing** - All credentials stored locally in browser
- ✅ **End-to-End Encryption** - Agora WebRTC encrypted communication
- ✅ **Session-Only Storage** - Credentials cleared when browser closes
- ✅ **Open Source** - Full code transparency
- ✅ **No Tracking** - No analytics or user tracking

## 🛠️ Advanced Development

### **Local Development**
```bash
# Clone repository
git clone https://github.com/chitimalli/virtual-agent.git
cd virtual-agent

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### **Key Development Features**
- **No Environment Variables** - All config via UI
- **Hot Module Replacement** - Instant code updates
- **Debug Panels** - Real-time lip sync monitoring
- **Animation Controls** - Manual override capabilities
- **Audio Level Indicators** - WebRTC connection status

### **Customization Options**
- **Avatar Models** - Replace GLB files with custom 3D models
- **Animation Sets** - Add custom FBX animations
- **Voice Personalities** - Configure different AI personalities
- **UI Themes** - Customize interface appearance
- **Lip Sync Tuning** - Adjust viseme sensitivity parameters

## � Performance Monitoring

### **Real-Time Metrics**
- **Audio Level**: Live voice input monitoring
- **Connection Status**: Agora WebRTC health
- **Frame Rate**: 3D rendering performance
- **Latency**: Voice-to-lip sync delay
- **Memory Usage**: Browser resource utilization

## 🌐 Browser Compatibility

### **Supported Browsers**
- ✅ **Chrome 80+** (Recommended)
- ✅ **Firefox 75+**
- ✅ **Safari 14+**
- ✅ **Edge 80+**

### **Required Features**
- WebRTC support
- WebAudio API
- WebGL 2.0
- ES6 modules

## 📞 Support & Troubleshooting

### **Common Issues**
1. **No Audio**: Check microphone permissions
2. **Connection Failed**: Verify Agora credentials
3. **No Lip Sync**: Ensure WebAudio permissions
4. **Performance Issues**: Lower quality settings

### **Debug Mode**
- Open browser DevTools
- Check Console for errors
- Monitor Network tab for API calls
- Use Performance tab for optimization

---

## 🎉 Experience the Future of AI Interaction

**Real-time lip sync meets AI conversation in stunning 3D - all running in your browser!**

**Live Demo**: https://chitimalli.github.io/virtual-agent/

*Based on original concept by [wass08](https://github.com/wass08/r3f-virtual-girlfriend-backend) - enhanced with advanced real-time features*
