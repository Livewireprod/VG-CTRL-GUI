# VG-CTRL-GUI Setup Instructions

## 1. Clone the repository

```powershell
git clone https://github.com/Livewireprod/VG-CTRL-GUI
cd VG-CTRL-GUI
```

## 2. Install dependencies

```powershell
npm install
```

## 3. Build the frontend

```powershell
npm run build
```

This creates the `dist/` folder used by the server.

## 4. Launch `server3`

```powershell
node server3.js
```

By default, the server runs on `http://127.0.0.1:9900`. The UI will also be served here.

## Optional: run on a different port

```powershell
$env:PORT=3000
node server3.js
```

## 5. TD Setup

Drop a Websocket DAT:

URL - ws://127.0.0.1
Port - 9900

Callback file - callbacks\wscallbacks.py