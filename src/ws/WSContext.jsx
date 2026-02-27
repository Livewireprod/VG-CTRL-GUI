import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getProfile } from "../profiles";

const WSContext = createContext(null);

export function WSProvider({ children }) {
  const profile = getProfile();

  const LS_KEY = `${profile.id}_ws_url`;

  const defaultWsUrl =
    profile?.defaults?.wsUrl ||
    (typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:9900/`
      : "ws://127.0.0.1:9900/");

  // STATE FIRST
  const [wsUrl, setWsUrl] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved || defaultWsUrl;
    } catch {
      return defaultWsUrl;
    }
  });

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tdOnline, setTdOnline] = useState(false);

  const [values, setValues] = useState({});
  const [log, setLog] = useState([]);

  const wsRef = useRef(null);

  // ✅ NOW safe to use connected/profile
  const pollMs = profile?.defaults?.pollMs ?? 2000;

  function addLog(line) {
    setLog((l) => [String(line), ...l].slice(0, 12));
  }

  function send(obj) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) {
      addLog("Not connected");
      return false;
    }
    ws.send(JSON.stringify(obj));
    return true;
  }

  function cmd(id, payload = {}) {
    send({ type: "CMD", id, ...payload });
  }

  function setValue(id, value) {
    send({ type: "SET", id, value });
  }

  function connect(url = wsUrl) {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    setConnecting(true);

    ws.onopen = () => {
      setConnecting(false);
      setConnected(true);
      addLog("Connected");

      send({ type: "UI_HELLO" });
      send({ type: "GET_STATE" });
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === "STATE") {
          setTdOnline(!!msg.tdOnline);
          setValues((v) => ({ ...v, ...(msg.values || {}) }));
        }

        if (msg.type === "ACK") addLog(msg.message);
        if (msg.type === "ERR") addLog(msg.error);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      setTdOnline(false);
      addLog("Disconnected");
    };
  }

  function disconnect() {
    wsRef.current?.close();
    wsRef.current = null;
  }

  useEffect(() => {
    if (!connected) return;
    if (!pollMs) return;

    const id = setInterval(() => {
      send({ type: "GET_STATE" });
    }, pollMs);

    return () => clearInterval(id);
  }, [connected, pollMs]);

  const api = useMemo(
    () => ({
      wsUrl,
      setWsUrl,
      connected,
      connecting,
      tdOnline,
      values,
      cmd,
      setValue,
      connect,
      disconnect,
      log,
    }),
    [wsUrl, connected, connecting, tdOnline, values, log]
  );

  return <WSContext.Provider value={api}>{children}</WSContext.Provider>;
}

export function useWS() {
  return useContext(WSContext);
}
