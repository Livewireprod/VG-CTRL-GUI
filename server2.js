import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const PORT = 9900;
const DIST_DIR = "dist"; 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app 
const app = express();
app.use(express.static(path.join(__dirname, DIST_DIR)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, DIST_DIR, "index.html"));
});

const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });


let tdSocket = null;

console.log("Starting server...");

wss.on("connection", (ws, req) => {
  console.log("Client connected:", req.socket.remoteAddress);

  ws.on("message", (buf) => {
    let msg;

    try {
      msg = JSON.parse(buf.toString());
    } catch {
      console.log("Invalid JSON received");
      return;
    }

    console.log("Received:", msg);

    // TD identifies itself
    if (msg.type === "TD_HELLO") {
      tdSocket = ws;
      console.log("TouchDesigner registered");
      return;
    }

    if (tdSocket && tdSocket.readyState === 1) {
      tdSocket.send(JSON.stringify(msg));
      console.log("Forwarded to TD");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    if (ws === tdSocket) {
      tdSocket = null;
      console.log("TouchDesigner disconnected");
    }
  });
});

// start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`ws://localhost:${PORT}`);
});