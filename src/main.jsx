import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import { AgoraProvider } from "./hooks/useAgora";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AgoraProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AgoraProvider>
  </React.StrictMode>
);
