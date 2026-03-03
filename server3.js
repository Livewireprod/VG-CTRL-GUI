import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT ? Number(process.env.PORT) : 9900;
const HOST = process.env.HOST || "0.0.0.0";
const DIST_DIR = process.env.UI_DIST || "dist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, DIST_DIR);


const app = express();
app.use(express.static(distPath));
app.get(/.*/, (req, res) => res.sendFile(path.join(distPath, "index.html")));
const server = http.createServer(app);


const wss = new WebSocketServer({ server });

/** @type {import("ws").WebSocket|null} */
let tdSocket = null;

function safeSend(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcastToUIs(obj) {
  const data = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (client.clientType === "UI") client.send(data);
  }
}


const KEEPALIVE_MS = Number(process.env.WS_KEEPALIVE_MS || 15000);
const hb = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.clientType !== "UI") continue;

    if (ws.isAlive === false) {
      try {
        ws.terminate();
      } catch {}
      continue;
    }

    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  }
}, KEEPALIVE_MS);

wss.on("connection", (ws, req) => {
  ws.clientType = "UNKNOWN";
  ws.ip = req.socket.remoteAddress;
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      safeSend(ws, { type: "ERR", error: "INVALID_JSON" });
      return;
    }

   
    if (msg.type === "TD_HELLO") {
      ws.clientType = "TD";

     
      if (tdSocket && tdSocket !== ws) {
        try {
          safeSend(tdSocket, { type: "INFO", message: "TD_REPLACED" });
          tdSocket.close(1012, "Replaced by new TD connection");
        } catch {}
      }

      tdSocket = ws;
      console.log("[WS] TD connected from", ws.ip);

      broadcastToUIs({ type: "TD_STATUS", connected: true });
      return;
    }

    
    if (msg.type === "UI_HELLO") {
      ws.clientType = "UI";
      ws.isAlive = true;

      safeSend(ws, { type: "NODE_HELLO", ok: true });
      safeSend(ws, { type: "TD_STATUS", connected: !!tdSocket && tdSocket.readyState === 1 });
      return;
    }


    if (ws.clientType === "TD") {
      broadcastToUIs(msg);
      return;
    }

    if (ws.clientType === "UI") {
      if (!tdSocket || tdSocket.readyState !== 1) {
        safeSend(ws, { type: "ERR", error: "TD_NOT_CONNECTED" });
        return;
      }

   
      if (msg?.type === "GET_STATE") return;

      tdSocket.send(JSON.stringify(msg));
      return;
    }

    safeSend(ws, { type: "ERR", error: "UNKNOWN_CLIENT_TYPE" });
  });

  ws.on("close", () => {
    if (ws === tdSocket) {
      tdSocket = null;
      console.log("[WS] TD disconnected");
      broadcastToUIs({ type: "TD_STATUS", connected: false });
    }
  });

  ws.on("error", (err) => {
    console.log("[WS] socket error:", err?.message || err);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`HTTP: http://${HOST}:${PORT}`);
  console.log(`WS:   ws://${HOST}:${PORT}`);
});

process.on("SIGINT", () => {
  clearInterval(hb);
  process.exit(0);
});