import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";

interface TerminalComponentProps {
  sessionId: string;
  cwd: string;
  className?: string;
}

export function TerminalComponent({ sessionId, cwd, className }: TerminalComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Consolas, 'Courier New', monospace",
      theme: {
        background: "#030712", // gray-950
        foreground: "#e5e7eb", // gray-200
        cursor: "#60a5fa", // blue-400
        selectionBackground: "#1e3a8a", // blue-900
        black: "#1f2937",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#38bdf8",
        white: "#f3f4f6",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    // Initial fit after mount
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {}
    }, 50);

    termRef.current = term;

    let unlistenOutput: UnlistenFn | undefined;

    const initTerminal = async () => {
      try {
        unlistenOutput = await listen<string>(`terminal-output-${sessionId}`, (event) => {
          term.write(event.payload);
        });

        term.onData((data) => {
          invoke("write_terminal_data", { sessionId, data }).catch(() => {});
        });

        await invoke("create_terminal_session", { sessionId, cwd });
      } catch (err) {
        term.writeln(`\r\nError al inicializar la terminal: ${err}`);
      }
    };

    initTerminal();

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (unlistenOutput) unlistenOutput();
      term.dispose();
      invoke("close_terminal_session", { sessionId }).catch(() => {});
    };
  }, [sessionId, cwd]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-gray-950 p-2 overflow-hidden ${className || ""}`}
    />
  );
}
