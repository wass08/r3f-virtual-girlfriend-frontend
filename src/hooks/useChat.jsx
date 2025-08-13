import { createContext, useContext, useEffect, useState } from "react";
import { useAgora } from "./useAgora";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { sendMessageToConvoAI, isConnected } = useAgora();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  const chat = async (messageText) => {
    if (!isConnected) {
      console.warn('Not connected to Agora channel');
      return;
    }

    setLoading(true);
    try {
      // Send message to ConvoAI instead of traditional backend
      await sendMessageToConvoAI(messageText);
      
      // Add user message to local state for display
      const userMessage = {
        text: messageText,
        audio: null,
        lipsync: null,
        animation: "Talking_0",
        facialExpression: "default",
        sender: "user"
      };
      
      setMessages((messages) => [...messages, userMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Only set AI messages for avatar playback, skip user messages
      const aiMessages = messages.filter(msg => msg.sender !== "user");
      if (aiMessages.length > 0) {
        setMessage(aiMessages[0]);
      } else {
        setMessage(null);
      }
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
