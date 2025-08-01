import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { HeroUIProvider } from "@heroui/system";
import "./styles/global.css";
import { BrowserRouter } from "react-router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <React.StrictMode>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </React.StrictMode>
  </BrowserRouter>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
