import { useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useAgora } from "../hooks/useAgora";
import Settings from "./Settings";

export const UI = ({ hidden, currentExpression, setCurrentExpression, currentAnimation, setCurrentAnimation, ...props }) => {
  const input = useRef();
  const [showSettings, setShowSettings] = useState(false);
  
  // Panel visibility states - Avatar panels default to closed for cleaner UI
  const [showConnectionPanel, setShowConnectionPanel] = useState(true);
  const [showExpressionPanel, setShowExpressionPanel] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const { isConnected, isJoined, joinChannel, leaveChannel, audioLevel, config, agentId } = useAgora();

  // Available expressions for the avatar
  const availableExpressions = [
    { name: "default", label: "😐 Default", emoji: "😐" },
    { name: "smile", label: "😊 Smile", emoji: "😊" },
    { name: "surprised", label: "😲 Surprised", emoji: "😲" },
    { name: "funnyFace", label: "🤪 Funny", emoji: "🤪" },
    { name: "sad", label: "😢 Sad", emoji: "😢" },
    { name: "angry", label: "😠 Angry", emoji: "😠" },
    { name: "crazy", label: "🤯 Crazy", emoji: "🤯" },
  ];

  // Available animations for the avatar (based on the files in public/animations)
  const availableAnimations = [
    { name: "Idle", label: "🧘 Idle", emoji: "🧘" },
    // { name: "Standing Idle", label: "🚶 Standing", emoji: "🚶" }, // Temporarily disabled - may cause crashes
    { name: "Talking_0", label: "💬 Talking 1", emoji: "💬" },
    { name: "Talking_1", label: "🗣️ Talking 2", emoji: "🗣️" },
    { name: "Talking_2", label: "💭 Talking 3", emoji: "💭" },
    { name: "Laughing", label: "😂 Laughing", emoji: "😂" },
    { name: "Crying", label: "😭 Crying", emoji: "😭" },
    { name: "Angry", label: "😡 Angry", emoji: "😡" },
    { name: "Terrified", label: "😨 Terrified", emoji: "😨" },
    // { name: "Rumba Dancing", label: "💃 Dancing", emoji: "💃" }, // Temporarily disabled - may cause crashes
  ];

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && isConnected) {
      chat(text);
      input.current.value = "";
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        {/* Top Section with Title and Settings Button */}
        <div className="flex justify-between items-start">
          <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h1 className="font-black text-xl">My Virtual GF</h1>
              <button
                onClick={() => setShowConnectionPanel(!showConnectionPanel)}
                className="pointer-events-auto text-gray-600 hover:text-gray-800 transition-colors"
                title={showConnectionPanel ? "Hide connection details" : "Show connection details"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform ${showConnectionPanel ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
            <p>I will always love you ❤️</p>
            {showConnectionPanel && (
              <div className="mt-2 text-sm space-y-1">
                <p className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '🟢 Connected to Agora' : '🔴 Not connected'}
                </p>
                <p className="text-gray-600">
                  Channel: <span className="font-mono">{config?.channel || 'ConvoAINPC'}</span>
                </p>
                <p className="text-gray-600">
                  ConvoAI UID: <span className="font-mono">{config?.convoAIUid || '8888'}</span>
                </p>
                {agentId && (
                  <p className="text-green-600">
                    🤖 Agent Active: <span className="font-mono text-xs">{agentId}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <p className={`text-xs ${config?.hasCredentials ? 'text-green-600' : 'text-red-600'}`}>
                    {config?.hasCredentials ? '✅' : '❌'} Auth
                  </p>
                  <p className={`text-xs ${config?.hasLLMKey ? 'text-green-600' : 'text-red-600'}`}>
                    {config?.hasLLMKey ? '✅' : '❌'} LLM
                  </p>
                  <p className={`text-xs ${config?.hasTTSKey ? 'text-green-600' : 'text-red-600'}`}>
                    {config?.hasTTSKey ? '✅' : '❌'} TTS
                  </p>
                </div>
                <p className="text-blue-600">
                  🎤 Audio Level: {(audioLevel * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          
          {/* Join/Connect Button - Always visible */}
          <div className="flex gap-2 items-center">
            {!isJoined ? (
              <button
                onClick={joinChannel}
                className="pointer-events-auto bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Connect to ConvoAI Channel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
                Connect
              </button>
            ) : (
              <button
                onClick={leaveChannel}
                className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Disconnect from ConvoAI Channel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 7.5A2.25 2.25 0 017.5 9.75V15a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V9.75A2.25 2.25 0 013.75 7.5H5.25z"
                  />
                </svg>
                Disconnect
              </button>
            )}
          </div>
          
          {/* Settings Button (Burger Menu) */}
          <button
            onClick={() => setShowSettings(true)}
            className="pointer-events-auto backdrop-blur-md bg-white bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors"
            title="Configuration Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 6h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H4.5m0 6h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H1.5"
              />
            </svg>
          </button>
        </div>

        {/* Expression Control Panel */}
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">🎭 Avatar Expressions</h3>
            <button
              onClick={() => setShowExpressionPanel(!showExpressionPanel)}
              className="pointer-events-auto text-gray-600 hover:text-gray-800 transition-colors"
              title={showExpressionPanel ? "Hide expressions" : "Show expressions"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform ${showExpressionPanel ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
          {showExpressionPanel && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {availableExpressions.map((expr) => (
                  <button
                    key={expr.name}
                    onClick={() => setCurrentExpression(expr.name === "default" ? "" : expr.name)}
                    className={`pointer-events-auto p-2 rounded-md text-sm font-medium transition-colors ${
                      (currentExpression === "" && expr.name === "default") || 
                      currentExpression === expr.name
                        ? "bg-pink-500 text-white" 
                        : "bg-white bg-opacity-70 text-gray-700 hover:bg-pink-200"
                    }`}
                  >
                    <div className="text-lg">{expr.emoji}</div>
                    <div className="text-xs">{expr.label.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Current: <span className="font-mono">{currentExpression || "default"}</span>
              </p>
            </>
          )}
        </div>

        {/* Animation Control Panel */}
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">🎬 Avatar Animations</h3>
            <button
              onClick={() => setShowAnimationPanel(!showAnimationPanel)}
              className="pointer-events-auto text-gray-600 hover:text-gray-800 transition-colors"
              title={showAnimationPanel ? "Hide animation controls" : "Show animation controls"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform ${showAnimationPanel ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
          {showAnimationPanel && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {availableAnimations.map((anim) => (
                  <button
                    key={anim.name}
                    onClick={() => setCurrentAnimation(anim.name)}
                    className={`pointer-events-auto p-2 rounded-md text-sm font-medium transition-colors ${
                      currentAnimation === anim.name
                        ? "bg-blue-500 text-white" 
                        : "bg-white bg-opacity-70 text-gray-700 hover:bg-blue-200"
                    }`}
                  >
                    <div className="text-lg">{anim.emoji}</div>
                    <div className="text-xs">{anim.label.split(' ')[1] || anim.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Manual Override: <span className="font-mono">{currentAnimation || "Auto"}</span>
              </p>
            </>
          )}
        </div>

        <div className="w-full flex flex-col items-end justify-center gap-4">
          <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
            title={cameraZoomed ? "Zoom Out" : "Zoom In"}
          >
            {cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              const body = document.querySelector("body");
              if (body.classList.contains("greenScreen")) {
                body.classList.remove("greenScreen");
              } else {
                body.classList.add("greenScreen");
              }
            }}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
            placeholder={isConnected ? "Type a message..." : "Connect to Agora first..."}
            ref={input}
            disabled={!isConnected}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button
            disabled={loading || message || !isConnected}
            onClick={sendMessage}
            className={`bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md ${
              loading || message || !isConnected ? "cursor-not-allowed opacity-30" : ""
            }`}
          >
            Send
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};
