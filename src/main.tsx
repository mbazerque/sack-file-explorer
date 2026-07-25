import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TabProvider } from "./context/TabContext";
import { ClipboardProvider } from "./context/ClipboardContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TabProvider>
      <ClipboardProvider>
        <App />
      </ClipboardProvider>
    </TabProvider>
  </React.StrictMode>,
);
