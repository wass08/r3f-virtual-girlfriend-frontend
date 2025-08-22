import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import { AgoraProvider } from "./hooks/useAgora";
import "./index.css";

// Suppress Three.js PropertyBinding warnings and Agora WebSocket errors
const originalWarn = console.warn;
const originalError = console.error;

console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('PropertyBinding') && message.includes('not found')) {
    return; // Silently ignore PropertyBinding warnings
  }
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  // Suppress common Agora WebSocket connection errors when no credentials are set
  if (message.includes('WebSocket connection') && message.includes('failed')) {
    console.log('ℹ️ WebSocket connection failed - this is normal if Agora credentials are not configured');
    return;
  }
  if (message.includes('WebSocket is closed before the connection is established')) {
    console.log('ℹ️ WebSocket closed during connection - this is normal if Agora credentials are not configured');
    return;
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AgoraProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AgoraProvider>
  </React.StrictMode>
);
