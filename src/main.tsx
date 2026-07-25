import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { TabProvider } from "./context/TabContext";
import { ClipboardProvider } from "./context/ClipboardContext";

function MainApp() {
  const { isLoaded } = useSettings();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-gray-950 text-gray-400 flex items-center justify-center font-sans text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <TabProvider>
      <ClipboardProvider>
        <App />
      </ClipboardProvider>
    </TabProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  </React.StrictMode>
);
