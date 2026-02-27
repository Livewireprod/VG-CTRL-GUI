import json
import time

def _send(dat, obj):
    try:
        dat.sendText(json.dumps(obj))
    except Exception as e:
        debug("send failed: {}".format(e))

def _state():
    return {
        "type": "STATE",
        "tdOnline": True,
        "values": {
            "ping": int(time.time()),
        },
    }

# --- WebSocket DAT callbacks ---

def onConnect(dat):
    debug("TD connected -> sending TD_HELLO")
    _send(dat, {"type": "TD_HELLO"})
    _send(dat, _state())
    return

def onDisconnect(dat):
    debug("TD disconnected")
    return

def onReceive(dat, rowIndex, message):
    # TD WebSocket DAT uses onReceive (not onReceiveText)
    try:
        msg = json.loads(message)
    except:
        debug("RX (non-json): {}".format(message))
        return

    t = msg.get("type")

    # Node bridge hello; ignore to avoid log spam
    if t == "SERVER_HELLO":
        return
    # UI/server requesting state
    if t == "GET_STATE":
        _send(dat, _state())
        return

    # Generic commands (buttons)
    if t == "CMD":
        cmd_id = msg.get("id")
        debug("RX CMD: {}".format(cmd_id))
        _send(dat, {"type": "ACK", "message": "CMD_OK"})
        # optionally publish state after actions later
        return

    # Generic values (sliders)
    if t == "SET":
        set_id = msg.get("id")
        val = msg.get("value")
        debug("RX SET: {}={}".format(set_id, val))
        _send(dat, {"type": "ACK", "message": "SET_OK"})
        return

    # optional: ignore other messages
    debug("RX type: {}".format(t))
    return

def onReceiveBinary(dat, rowIndex, contents):
    return
