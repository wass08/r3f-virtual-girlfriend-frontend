import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import { AgoraProvider } from "./hooks/useAgora";
import "./index.css";

// Suppress Three.js PropertyBinding warnings for missing animation nodes
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('PropertyBinding') && message.includes('not found')) {
    return; // Silently ignore PropertyBinding warnings
  }
  originalWarn.apply(console, args);
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
