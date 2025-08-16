import { useState, useEffect, useRef } from "react";
import { useAgora } from "../hooks/useAgora";
import { useChat } from "../hooks/useChat";

export const CombinedChat = ({ isConnected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const { chatHistory, clearChatHistory, testChatMessage } = useAgora();
  const { chat, loading, message } = useChat();
  const messagesEndRef = useRef(null);
  const input = useRef();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isExpanded]);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && isConnected && text.trim()) {
      chat(text);
      input.current.value = "";
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Chat Icon/Button when minimized */}
      {isMinimized && (
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsExpanded(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Open Chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          {chatHistory.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {chatHistory.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Window */}
      {!isMinimized && (
        <div className={`bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl transition-all duration-300 ${
          isExpanded ? 'w-96 h-96' : 'w-96 h-16'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/20 bg-black/60 rounded-t-lg">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              💬 Chat
              {chatHistory.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {chatHistory.length}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={testChatMessage}
                className="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="Add test message"
              >
                🧪
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? "−" : "+"}
              </button>
              <button
                onClick={clearChatHistory}
                className="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="Clear chat history"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white/70 hover:text-white text-xl leading-none hover:bg-white/10 w-7 h-7 rounded flex items-center justify-center transition-colors"
                title="Minimize chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages (only visible when expanded) */}
          {isExpanded && (
            <div className="h-64 overflow-y-auto p-3 space-y-2">
              {chatHistory.length === 0 ? (
                <div className="text-white/50 text-center text-sm mt-8">
                  Start a conversation to see the transcript here...
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={`${message.id}-${index}-${message.timestamp?.getTime() || index}`}
                    className={`flex flex-col ${
                      message.speaker === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        message.speaker === 'user'
                          ? 'bg-blue-600/80 text-white ml-4'
                          : 'bg-gray-700/80 text-white mr-4'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="leading-relaxed break-words flex-1">
                          {message.message}
                          {message.isPartial && (
                            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse opacity-70">|</span>
                          )}
                        </p>
                        {message.isPartial && (
                          <span className="text-xs text-white/50 ml-2 flex-shrink-0">
                            ⚡ Live
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp and speaker */}
                    <div
                      className={`text-xs text-white/50 mt-0.5 ${
                        message.speaker === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <span className="font-medium">
                        {message.speaker === 'user' ? '👤' : '🤖'}
                      </span>
                      <span className="ml-1">
                        {message.lastUpdated ? 
                          `${formatTime(message.lastUpdated)} ${message.isPartial ? '(live)' : ''}` :
                          formatTime(message.timestamp)
                        }
                      </span>
                      {message.words && message.words.length > 0 && (
                        <span className="ml-2 text-white/40">
                          • {message.words.length}w
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Message Input (always visible) */}
          <div className="p-3 border-t border-white/20 bg-black/40 rounded-b-lg">
            <div className="flex items-center gap-2">
              <input
                ref={input}
                className="flex-1 bg-white/10 text-white placeholder-white/50 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20"
                placeholder={isConnected ? "Type a message..." : "Connect to Agora first..."}
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
                className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium rounded transition-colors ${
                  loading || message || !isConnected ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
            
            {/* Connection Status */}
            <div className="mt-2 text-xs text-center">
              <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
              {chatHistory.length > 0 && (
                <span className="text-white/60 ml-2">
                  • {chatHistory.length} message{chatHistory.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
