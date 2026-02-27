import json
import time


def _log(*a):
    print("[WS]", *a)


def _send(dat, obj):
    try:
        dat.sendText(json.dumps(obj))
        return True
    except Exception as e:
        _log("send failed:", e)
        return False


def _state():
    return {
        "type": "STATE",
        "tdOnline": True,
        "values": {
            "ping": int(time.time()),
        },
    }


def _handle_text(dat, text):
    _log("rx:", text)

    try:
        msg = json.loads(text)
    except:
        return

    t = msg.get("type")

    if t == "GET_STATE":
        _send(dat, _state())
        return

    if t == "CMD":
        cmd_id = msg.get("id")
        _log("CMD:", cmd_id)
        _send(dat, {"type": "ACK", "message": "CMD_OK"})
        return

    if t == "SET":
        set_id = msg.get("id")
        val = msg.get("value")
        _log("SET:", "{}={}".format(set_id, val))
        _send(dat, {"type": "ACK", "message": "SET_OK"})
        return


def onConnect(dat):
    _log("connected")
    _send(dat, {"type": "TD_HELLO"})
    _send(dat, _state())
    return


def onDisconnect(dat):
    _log("disconnected")
    return


def onError(dat, message):
    _log("error:", message)
    return




def onReceiveText(dat, text, peer):
    _handle_text(dat, text)
    return


def onReceiveBinary(dat, rowIndex, contents):
    return
