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

  // Unified ref to hold terminal instance, fit addon, unlisten handle, and mounting state
  const sessionRef = useRef<{
    sessionId: string;
    term: Terminal | null;
    fitAddon: FitAddon | null;
    unlisten: UnlistenFn | null;
    isMounted: boolean;
  }>({
    sessionId,
    term: null,
    fitAddon: null,
    unlisten: null,
    isMounted: false,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const currentSessionId = sessionId;
    sessionRef.current.sessionId = currentSessionId;
    sessionRef.current.isMounted = true;

    // 1. Instantiate Terminal with modern dark theme
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

    // 2. Initialize FitAddon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    sessionRef.current.term = term;
    sessionRef.current.fitAddon = fitAddon;

    // Initial fit right after mount
    const doFit = () => {
      try {
        if (sessionRef.current.isMounted && containerRef.current) {
          fitAddon.fit();
        }
      } catch {}
    };

    doFit();
    const fitTimeout = setTimeout(doFit, 50);

    // 3. Connect xterm.onData directly to Tauri PTY writer
    //    Send data 100% raw — the real PTY handles backspace, arrows, Ctrl+C, etc.
    const dataDisposable = term.onData((data) => {
      invoke("write_terminal_data", { sessionId: currentSessionId, data }).catch(() => {});
    });

    // 4. Sync PTY dimensions on resize — tell the PTY the new cols/rows
    const resizeDisposable = term.onResize(({ cols, rows }) => {
      invoke("resize_terminal", { sessionId: currentSessionId, cols, rows }).catch(() => {});
    });

    // 5. Setup FitAddon on window and container resize events
    const resizeObserver = new ResizeObserver(() => {
      doFit();
    });
    resizeObserver.observe(containerRef.current);

    const handleWindowResize = () => {
      doFit();
    };
    window.addEventListener("resize", handleWindowResize);

    // 6. Async shell process initialization and output listener binding
    let isCleanedUp = false;

    const initTerminal = async () => {
      try {
        const unlisten = await listen<string>(`terminal-output-${currentSessionId}`, (event) => {
          if (!isCleanedUp && sessionRef.current.isMounted && sessionRef.current.term) {
            sessionRef.current.term.write(event.payload);
          }
        });

        if (isCleanedUp || !sessionRef.current.isMounted) {
          unlisten();
          return;
        }

        sessionRef.current.unlisten = unlisten;

        // Pass initial cols/rows so the PTY starts with correct dimensions
        const cols = term.cols;
        const rows = term.rows;

        await invoke("create_terminal_session", {
          sessionId: currentSessionId,
          cwd,
          cols,
          rows,
        });

        if (isCleanedUp || !sessionRef.current.isMounted) {
          invoke("close_terminal_session", { sessionId: currentSessionId }).catch(() => {});
        }
      } catch (err) {
        if (!isCleanedUp && sessionRef.current.isMounted && sessionRef.current.term) {
          sessionRef.current.term.writeln(`\r\nError al inicializar la terminal: ${err}`);
        }
      }
    };

    initTerminal();

    // 7. Clean Cleanup on component unmount / re-render / StrictMode
    return () => {
      isCleanedUp = true;
      sessionRef.current.isMounted = false;
      clearTimeout(fitTimeout);

      window.removeEventListener("resize", handleWindowResize);
      resizeObserver.disconnect();

      dataDisposable.dispose();
      resizeDisposable.dispose();

      if (sessionRef.current.unlisten) {
        sessionRef.current.unlisten();
        sessionRef.current.unlisten = null;
      }

      term.dispose();
      sessionRef.current.term = null;
      sessionRef.current.fitAddon = null;

      // Kill and destroy the active shell process in Tauri to prevent duplicate sessions
      invoke("close_terminal_session", { sessionId: currentSessionId }).catch(() => {});
    };
  }, [sessionId, cwd]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-gray-950 p-2 overflow-hidden ${className || ""}`}
    />
  );
}
