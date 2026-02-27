import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const Ctx = createContext(null);

function getDefaultWsUrl() {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;

  if (typeof window === "undefined") return "ws://127.0.0.1:9900";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;

  // In Vite dev, HTTP is typically :5173, while WS bridge runs on :9900.
  if (import.meta.env.DEV) return `${protocol}//${host}:9900`;

  // In build, UI + WS are usually served from the same host/port.
  return `${protocol}//${window.location.host}`;
}

export function SimpleWSProvider({ children, defaultUrl }) {
  const [wsUrl, setWsUrl] = useState(defaultUrl || getDefaultWsUrl());

  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tdOnline, setTdOnline] = useState(false);
  const [log, setLog] = useState([]);

  const pushLog = (line) => {
    setLog((prev) => {
      const next = [...prev, `${new Date().toLocaleTimeString()} · ${line}`];
      return next.slice(-200);
    });
  };

  const connect = () => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === 0 || existing.readyState === 1)) return;

    setConnecting(true);
    pushLog(`WS connecting → ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      pushLog("WS connected");

      // Identify as UI (server will reply with TD_STATUS)
      ws.send(JSON.stringify({ type: "UI_HELLO" }));
      pushLog('TX {"type":"UI_HELLO"}');
    };

    ws.onmessage = (evt) => {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        pushLog(`RX (non-json) ${String(evt.data).slice(0, 120)}`);
        return;
      }

      // Presence only (no state yet)
      if (msg?.type === "TD_STATUS") {
        setTdOnline(!!msg.connected);
        pushLog(`TD_STATUS → ${msg.connected ? "online" : "offline"}`);
      } else {
        pushLog(`RX ${JSON.stringify(msg)}`);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      setTdOnline(false);
      pushLog("WS disconnected");
    };

    ws.onerror = () => {
      // onclose will follow
      pushLog("WS error");
    };
  };

  const disconnect = () => {
    const ws = wsRef.current;
    if (!ws) return;
    try {
      ws.close();
    } catch {}
    wsRef.current = null;
  };

  // Auto-connect on mount + when url changes
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  const send = (obj) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) {
      pushLog("TX blocked (not connected)");
      return false;
    }

    // IMPORTANT: no GET_STATE in Step 1.
    if (obj?.type === "GET_STATE") {
      pushLog("TX blocked (GET_STATE disabled in Step 1)");
      return false;
    }

    ws.send(JSON.stringify(obj));
    pushLog(`TX ${JSON.stringify(obj)}`);
    return true;
  };

  const value = useMemo(
    () => ({
      wsUrl,
      setWsUrl,
      connected,
      connecting,
      tdOnline,
      connect,
      disconnect,
      send,
      log,
      clearLog: () => setLog([]),
    }),
    [wsUrl, connected, connecting, tdOnline, log]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSimpleWS() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSimpleWS must be used inside <SimpleWSProvider>");
  return ctx;
}
