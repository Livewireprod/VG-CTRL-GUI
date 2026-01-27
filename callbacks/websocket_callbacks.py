import json

#config
PRESET_TABLE_PATH = "/prj/control/control_page6/preset_bank/null1"
CODE_MODULE_NAME = "code"
ACTIVE_PRESET_DAT_PATH = ""
_active_preset = None


def _log(msg):
    print("[WS]", msg)

def _safe_json(s):
    try:
        return json.loads(s)
    except:
        return None

def _send(dat, obj):
    """
    websocketDAT has no .status member.
    sendText returns bytes sent, or negative on error.  :contentReference[oaicite:2]{index=2}
    """
    try:
        n = dat.sendText(json.dumps(obj))
        if n < 0:
            _log("sendText returned error ({})".format(n))
    except Exception as e:
        _log("Send failed: {}".format(e))

def _preset_table():
    return op(PRESET_TABLE_PATH)


def _get_presets():
    """
    Returns:
      [ { "name": "Preset1.dat" }, ... ]
    Reads column 'name' from PRESET_TABLE_PATH.
    """
    t = _preset_table()
    if not t:
        return []

    try:
        name_col = t.col("name")
    except:

        return []

    out = []
    for c in name_col[1:]: 
        if c.val:
            out.append({"name": c.val})
    return out

def _set_active(name):
    global _active_preset
    _active_preset = name

    if ACTIVE_PRESET_DAT_PATH:
        d = op(ACTIVE_PRESET_DAT_PATH)
        if d:
            try:
                d.clear()
                d.appendRow([name])
            except:
                pass

def _get_active():
    if ACTIVE_PRESET_DAT_PATH:
        d = op(ACTIVE_PRESET_DAT_PATH)
        if d and d.numRows and d.numCols:
            v = d[0, 0].val
            return v if v else None
    t = _preset_table()
    if t:
        try:
            name_col = t.col("name")
            active_col = t.col("active")
        except:
            active_col = None
            name_col = None

        if name_col and active_col:
            for name_cell, active_cell in zip(name_col[1:], active_col[1:]):
                v = str(active_cell.val).strip().lower()
                if v and v not in ("0", "false", "no", "off"):
                    return name_cell.val if name_cell.val else None

    return _active_preset


def _publish_state(dat):
    _send(dat, {
        "type": "STATE",
        "state": {
            "presets": _get_presets(),
            "activePreset": _get_active(),
        }
    })


def _apply_preset(name):
    t = _preset_table()
    if not t:
        return False, "PRESET_TABLE_NOT_FOUND"

    try:
        name_col = t.col("name")
    except:
        return False, "PRESET_TABLE_MISSING_NAME_COL"

    found = any(c.val == name for c in name_col[1:])
    if not found:
        return False, "PRESET_NOT_FOUND"

    try:
        code = op.sys.mod(CODE_MODULE_NAME)
    except:
        code = None

    if not code or not hasattr(code, "loadSelectedPreset"):
        return False, "CODE_MODULE_OR_FUNCTION_NOT_FOUND"

    try:
        code.loadSelectedPreset(presetFile=name)
        _set_active(name)
        return True, None
    except Exception as e:
        _log("loadSelectedPreset error: {}".format(e))
        return False, "LOAD_FAILED"



def onConnect(dat):
    _log("connected")


    _send(dat, {"type": "TD_HELLO"})

   
    _publish_state(dat)
    return

def onDisconnect(dat):
    _log("disconnected")
    return

def onReceiveText(dat, rowIndex, message):
    msg = _safe_json(message)
    if not msg:
        return

    t = msg.get("type")

    if t == "GET_STATE":
        _publish_state(dat)
        return

    if t == "APPLY_PRESET":
        name = msg.get("name")
        if not name:
            _send(dat, {"type": "ERR", "error": "MISSING_PRESET_NAME"})
            return

        ok, err = _apply_preset(name)

        if ok:
            _send(dat, {"type": "ACK", "message": "Applied {}".format(name)})
            _publish_state(dat)
        else:
            _send(dat, {"type": "ERR", "error": err})

        return

    return

def onReceiveBinary(dat, contents):
    return

def onReceivePing(dat, contents):

    try:
        dat.sendPong(contents)
    except:
        pass
    return

def onReceivePong(dat, contents):
    return

def onMonitorMessage(dat, message):
   
    return
