import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getProfile } from "../profiles";

const WSContext = createContext(null);

const LS_KEY = "alpine_ws_url";

export function WSProvider({ children }) {

const profile = getProfile();

const LS_KEY = `${profile.id}_ws_url`; // instead of "alpine_ws_url"

const defaultWsUrl = (() => {
    // 1) profile explicit default wins (best for kit deployments)
  if (profile?.defaults?.wsUrl) return profile.defaults.wsUrl;

    // 2) otherwise same-origin websocket (nice for single-machine dev)
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }

    // 3) final fallback
    return "ws://127.0.0.1:9982";
  })();

  const [wsUrl, setWsUrl] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return saved;

    if (typeof window !== "undefined") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.host}`;
    }

    return "ws://127.0.0.1:9982";
  });

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tdOnline, setTdOnline] = useState(false);

  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);

  const [log, setLog] = useState([]);

  const wsRef = useRef(null);


  useEffect(() => {
    if (!connected) return;

    const id = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "GET_STATE" }));
      }
    }, 2000);

    return () => clearInterval(id);
  }, [connected]);


  function addLog(line) {
    setLog((l) => [line, ...l].slice(0, 12));
  }


  function connect(url = wsUrl) {
    let parsed;

    try {
      parsed = new URL(url);
      if (!["ws:", "wss:"].includes(parsed.protocol)) throw 0;
    } catch {
      addLog(`Invalid URL: ${url}`);
      return;
    }

    localStorage.setItem(LS_KEY, url);
    setWsUrl(url);

    setConnecting(true);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnecting(false);
      setConnected(true);
      addLog("Connected");

      send({ type: "UI_HELLO" });
      send({ type: "GET_STATE" });
    };

    ws.onmessage = (e) => {
      let msg;

      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      handleMessage(msg);
    };

    ws.onerror = () => {
      addLog("Socket error");
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



  function send(obj) {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== 1) {
      addLog("Not connected");
      return;
    }

    ws.send(JSON.stringify(obj));
  }


  function handleMessage(msg) {
    switch (msg.type) {
      case "SERVER_HELLO":
        setTdOnline(!!msg.tdOnline);
        break;

      case "STATE":
        setTdOnline(!!msg.tdOnline);

        if (Array.isArray(msg.presets)) {
          setPresets(msg.presets);
        }

        if ("activePreset" in msg) {
          setActivePreset(msg.activePreset);
        }

        break;

      case "ERR":
        addLog(`${msg.error}`);
        break;

      case "ACK":
        addLog(`${msg.message || "OK"}`);
        break;
    }
  }

  function applyPreset(name) {
    setActivePreset(name); 
    send({ type: "APPLY_PRESET", name });
    addLog(`Apply ${name}`);
  }

  return (
    <WSContext.Provider
      value={{
        wsUrl,
        setWsUrl,

        connected,
        connecting,
        tdOnline,

        presets,
        activePreset,

        connect,
        disconnect,
        applyPreset,

        log,
      }}
    >
      {children}
    </WSContext.Provider>
  );
}


export function useWS() {
  return useContext(WSContext);
}
