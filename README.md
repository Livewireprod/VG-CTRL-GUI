## TD Websocket Setup

1) Websocket DAT:
- Netwrok Address = ws://127.0.0.1
- Network Port - 9900
- Point callback file (websocket_callbacks.py)

## Plug n play 

cd alpinetd

1) Install dependencies
   - `npm install`

2) Build the UI
   - `npm run build`

3) Start the server (serves UI + WS on one URL)
   - `node server.js`

4) Open the UI
   - `http://127.0.0.1:9900`

The UI connects to the WS endpoint on the same host/port by default.

Notes:
- `dist/` must exist for the UI to load (created by `npm run build`).
- `node_modules/` is required to run the server.
- The TouchDesigner websocket callbacks must be running and reachable from this server.

## Environment variables

- `PORT` (default: 9900) - HTTP + WebSocket port
- `UI_DIST` (default: `dist`) - folder containing the built UI
- `TD_POLL_MS` (default: 2000) - how often the server asks TD for state
