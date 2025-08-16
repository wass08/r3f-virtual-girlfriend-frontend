import { useState, useEffect } from 'react';

const Settings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    // Agora Configuration
    agoraAppId: '',
    agoraToken: '',
    agoraChannel: '',
    
    // ConvoAI REST API Configuration
    convoaiApiBaseUrl: '',
    restfulApiKey: '',
    restfulPassword: '',
    convoaiAgentName: '',
    convoaiAgentUid: '',
    
    // LLM Configuration
    llmUrl: '',
    llmApiKey: '',
    llmModel: '',
    llmSystemMessage: '',
    llmGreeting: '',
    
    // TTS Configuration
    ttsApiKey: '',
    ttsRegion: '',
    ttsVoiceName: '',
    
    // ASR Configuration
    asrLanguage: '',
  });

  // Load current environment variables when component mounts
  useEffect(() => {
    if (isOpen) {
      setSettings({
        // Agora Configuration
        agoraAppId: import.meta.env.VITE_AGORA_APP_ID || '',
        agoraToken: import.meta.env.VITE_AGORA_TOKEN || '',
        agoraChannel: import.meta.env.VITE_AGORA_CHANNEL || 'VirtualGirlfriend_Channel',
        
        // ConvoAI REST API Configuration
        convoaiApiBaseUrl: import.meta.env.VITE_CONVOAI_API_BASE_URL || 'https://api.agora.io/api/conversational-ai-agent/v2',
        restfulApiKey: import.meta.env.VITE_RESTFUL_API_KEY || '',
        restfulPassword: import.meta.env.VITE_RESTFUL_PASSWORD || '',
        convoaiAgentName: import.meta.env.VITE_CONVOAI_AGENT_NAME || 'Virtual Girlfriend',
        convoaiAgentUid: import.meta.env.VITE_CONVOAI_AGENT_UID || '8888',
        
        // LLM Configuration
        llmUrl: import.meta.env.VITE_LLM_URL || 'https://api.openai.com/v1/chat/completions',
        llmApiKey: import.meta.env.VITE_LLM_API_KEY || '',
        llmModel: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
        llmSystemMessage: import.meta.env.VITE_LLM_SYSTEM_MESSAGE || 'You are a friendly virtual girlfriend assistant.',
        llmGreeting: import.meta.env.VITE_LLM_GREETING || "Hello! I'm your virtual girlfriend. How can I help you today?",
        
        // TTS Configuration
        ttsApiKey: import.meta.env.VITE_TTS_API_KEY || '',
        ttsRegion: import.meta.env.VITE_TTS_REGION || 'eastus',
        ttsVoiceName: import.meta.env.VITE_TTS_VOICE_NAME || 'en-US-AriaNeural',
        
        // ASR Configuration
        asrLanguage: import.meta.env.VITE_ASR_LANGUAGE || 'en-US',
      });
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Store settings in sessionStorage so they persist during the session
    const configToStore = {
      VITE_AGORA_APP_ID: settings.agoraAppId,
      VITE_AGORA_TOKEN: settings.agoraToken,
      VITE_AGORA_CHANNEL: settings.agoraChannel,
      VITE_RESTFUL_API_KEY: settings.restfulApiKey,
      VITE_RESTFUL_PASSWORD: settings.restfulPassword,
      VITE_CONVOAI_AGENT_NAME: settings.convoaiAgentName,
      VITE_CONVOAI_AGENT_UID: settings.convoaiAgentUid,
      VITE_CONVOAI_API_BASE_URL: settings.convoaiApiBaseUrl,
      VITE_LLM_URL: settings.llmUrl,
      VITE_LLM_API_KEY: settings.llmApiKey,
      VITE_LLM_MODEL: settings.llmModel,
      VITE_LLM_SYSTEM_MESSAGE: settings.llmSystemMessage,
      VITE_LLM_GREETING: settings.llmGreeting,
      VITE_TTS_API_KEY: settings.ttsApiKey,
      VITE_TTS_REGION: settings.ttsRegion,
      VITE_TTS_VOICE_NAME: settings.ttsVoiceName,
      VITE_ASR_LANGUAGE: settings.asrLanguage,
    };

    // Store in sessionStorage
    Object.entries(configToStore).forEach(([key, value]) => {
      if (value) {
        sessionStorage.setItem(key, value);
      }
    });

    // Trigger custom event to notify components of sessionStorage update
    window.dispatchEvent(new Event('sessionStorageUpdate'));

    // Show success message
    alert('Settings saved! Please refresh the page for changes to take effect.');
    onClose();
  };

  const handleReset = () => {
    // Clear sessionStorage
    Object.keys(settings).forEach(key => {
      const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
      sessionStorage.removeItem(`VITE_${envKey}`);
    });
    
    // Reset to defaults
    setSettings({
      agoraAppId: '',
      agoraToken: '',
      agoraChannel: 'VirtualGirlfriend_Channel',
      convoaiApiBaseUrl: 'https://api.agora.io/api/conversational-ai-agent/v2',
      authCode: '',
      restfulApiKey: '',
      restfulPassword: '',
      convoaiAgentName: 'Virtual Girlfriend',
      convoaiAgentUid: '8888',
      llmUrl: 'https://api.openai.com/v1/chat/completions',
      llmApiKey: '',
      llmModel: 'gpt-4o-mini',
      llmSystemMessage: 'You are a friendly virtual girlfriend assistant.',
      llmGreeting: "Hello! I am your virtual girlfriend. How can I help you today?",
      ttsApiKey: '',
      ttsRegion: 'eastus',
      ttsVoiceName: 'en-US-AriaNeural',
      asrLanguage: 'en-US',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Configuration Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Agora Configuration */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 Agora Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App ID *
                </label>
                <input
                  type="text"
                  value={settings.agoraAppId}
                  onChange={(e) => handleInputChange('agoraAppId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Agora App ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={settings.agoraChannel}
                  onChange={(e) => handleInputChange('agoraChannel', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VirtualGirlfriend_Channel"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token *
                </label>
                <textarea
                  value={settings.agoraToken}
                  onChange={(e) => handleInputChange('agoraToken', e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Agora Token"
                />
              </div>
            </div>
          </div>

          {/* ConvoAI REST API Configuration */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-semibold text-green-800 mb-4">🤖 ConvoAI REST API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL *
                </label>
                <input
                  type="url"
                  value={settings.convoaiApiBaseUrl}
                  onChange={(e) => handleInputChange('convoaiApiBaseUrl', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://api.agora.io/api/conversational-ai-agent/v2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The Agora ConvoAI REST API endpoint
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RESTful API Key *
                </label>
                <input
                  type="password"
                  value={settings.restfulApiKey}
                  onChange={(e) => handleInputChange('restfulApiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your RESTful API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RESTful API Password *
                </label>
                <input
                  type="password"
                  value={settings.restfulPassword}
                  onChange={(e) => handleInputChange('restfulPassword', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your RESTful API Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={settings.convoaiAgentName}
                  onChange={(e) => handleInputChange('convoaiAgentName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Virtual Girlfriend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent UID
                </label>
                <input
                  type="text"
                  value={settings.convoaiAgentUid}
                  onChange={(e) => handleInputChange('convoaiAgentUid', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="8888"
                />
              </div>
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">🧠 LLM Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LLM API URL *
                </label>
                <input
                  type="url"
                  value={settings.llmUrl}
                  onChange={(e) => handleInputChange('llmUrl', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The endpoint URL for your LLM service (e.g., OpenAI, Azure OpenAI, etc.)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key *
                </label>
                <input
                  type="password"
                  value={settings.llmApiKey}
                  onChange={(e) => handleInputChange('llmApiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={settings.llmModel}
                  onChange={(e) => handleInputChange('llmModel', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Message
                </label>
                <textarea
                  value={settings.llmSystemMessage}
                  onChange={(e) => handleInputChange('llmSystemMessage', e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="You are a friendly virtual girlfriend assistant."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Greeting Message
                </label>
                <textarea
                  value={settings.llmGreeting}
                  onChange={(e) => handleInputChange('llmGreeting', e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Hello! I'm your virtual girlfriend. How can I help you today?"
                />
              </div>
            </div>
          </div>

          {/* TTS Configuration */}
          <div className="border rounded-lg p-4 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">🎤 Text-to-Speech (TTS)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Azure TTS API Key *
                </label>
                <input
                  type="password"
                  value={settings.ttsApiKey}
                  onChange={(e) => handleInputChange('ttsApiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your Azure TTS API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={settings.ttsRegion}
                  onChange={(e) => handleInputChange('ttsRegion', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="eastus">East US</option>
                  <option value="westus">West US</option>
                  <option value="eastus2">East US 2</option>
                  <option value="westus2">West US 2</option>
                  <option value="centralus">Central US</option>
                  <option value="northeurope">North Europe</option>
                  <option value="westeurope">West Europe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Name
                </label>
                <select
                  value={settings.ttsVoiceName}
                  onChange={(e) => handleInputChange('ttsVoiceName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="en-US-AriaNeural">Aria (English US, Female)</option>
                  <option value="en-US-JennyNeural">Jenny (English US, Female)</option>
                  <option value="en-US-GuyNeural">Guy (English US, Male)</option>
                  <option value="en-US-DavisNeural">Davis (English US, Male)</option>
                  <option value="en-GB-SoniaNeural">Sonia (English UK, Female)</option>
                  <option value="en-GB-RyanNeural">Ryan (English UK, Male)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ASR Language
                </label>
                <select
                  value={settings.asrLanguage}
                  onChange={(e) => handleInputChange('asrLanguage', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="px-6 pb-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Note:</strong> Settings are saved in your browser session and will persist until you refresh the page or close the browser.
          </p>
          <p>
            Fields marked with <span className="text-red-500">*</span> are required for the application to function properly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
