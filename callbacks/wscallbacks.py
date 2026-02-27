import json

def onConnect(dat):
    print("WS connected to Node")


    hello = { "type": "TD_HELLO" }
    dat.sendText(json.dumps(hello))

    return


def onDisconnect(dat):
    print("WS disconnected from Node")
    return


def onReceiveText(dat, rowIndex, message):
    try:
        msg = json.loads(message)
    except:
        print("Invalid JSON:", message)
        return

    msgType = msg.get("type")


    if msgType == "CMD":
        cmd_id = msg.get("id")
        print("CMD received:", cmd_id)


        if cmd_id == "preset_1":
            print("Trigger preset 1")
           

        elif cmd_id == "preset_2":
            print("Trigger preset 2")


        ack = { "type": "ACK", "id": cmd_id }
        dat.sendText(json.dumps(ack))


 
    elif msgType == "SET":
        key = msg.get("id")
        value = msg.get("value")

        print("SET received:", key, value)

     
        if key == "volume":
           
            pass

        ack = { "type": "ACK", "id": key }
        dat.sendText(json.dumps(ack))


  
    elif msgType == "PING":
        pong = { "type": "PONG", "ts": msg.get("ts") }
        dat.sendText(json.dumps(pong))


    else:
        print("Unknown message type:", msgType)

    return