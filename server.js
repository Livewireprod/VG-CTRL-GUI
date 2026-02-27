import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT ? Number(process.env.PORT) : 9900;
const TD_POLL_MS_RAW = process.env.TD_POLL_MS;
const TD_POLL_MS = TD_POLL_MS_RAW === undefined ? 0 : Number(TD_POLL_MS_RAW);
const DIST_DIR = process.env.UI_DIST || "dist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, DIST_DIR);

const app = express();
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let tdSocket = null;
let lastState = {
  tdOnline: false,
  presets: [],
  activePreset: null,
  updatedAt: null,
};


function send(ws, obj) {
  if (ws?.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcastToUIs(obj) {
  wss.clients.forEach((ws) => {
    if (ws.readyState !== 1) return;
    if (ws.clientType === "UI") send(ws, obj);
  });
}

function publishState() {
  const payload = { type: "STATE", ...lastState };
  broadcastToUIs(payload);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

wss.on("connection", (ws, req) => {
  ws.clientType = "UNKNOWN";
  ws.ip = req.socket.remoteAddress;

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      send(ws, { type: "ERR", error: "INVALID_JSON" });
      return;
    }

    if (msg.type === "UI_HELLO") {
      ws.clientType = "UI";
      send(ws, { type: "STATE", ...lastState });
      return;
    }

    if (msg.type === "TD_HELLO") {
      ws.clientType = "TD";
      tdSocket = ws;
      lastState.tdOnline = true;
      lastState.updatedAt = new Date().toISOString();
      console.log("TD connected from", ws.ip);
      publishState();
      return;
    }

    if (msg.type === "GET_STATE") {
      if (ws.clientType === "UI" && tdSocket && tdSocket.readyState === 1) {
        send(tdSocket, msg);
      }

      send(ws, { type: "STATE", ...lastState });
      return;
    }

    if (ws.clientType === "TD" && (msg.type === "STATE" || msg.type === "STATE_PATCH")) {
      const patch =
        msg.type === "STATE_PATCH"
          ? (msg.patch && typeof msg.patch === "object" ? msg.patch : null)
          : (msg.state && typeof msg.state === "object" ? msg.state : null);

      if (!patch) {
        return;
      }

      lastState = {
        ...lastState,
        ...patch,
        tdOnline: true,
        updatedAt: new Date().toISOString(),
      };
      publishState();
      return;
    }

    if (ws.clientType === "UI") {
      if (!tdSocket || tdSocket.readyState !== 1) {
        send(ws, { type: "ERR", error: "TD_NOT_CONNECTED" });
        return;
      }

      send(tdSocket, msg);
      return;
    }
  });

  ws.on("close", () => {
    if (ws === tdSocket) {
      tdSocket = null;
      lastState.tdOnline = false;
      lastState.updatedAt = new Date().toISOString();
      console.log("TD disconnected");
      publishState();
    }
  });
});