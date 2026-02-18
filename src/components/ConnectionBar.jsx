import { useWS } from "../ws/WSContext";
import {getProfile} from "../profiles";

export default function ConnectionBar() {

const profile = getProfile();

  const {
    wsUrl,
    setWsUrl,
    connected,
    connecting,
    tdOnline,
    connect,
    disconnect,
  } = useWS();

  const status = connecting
    ? "Connecting…"
    : !connected
    ? "Disconnected"
    : tdOnline
    ? "Connected · TD Online"
    : "Connected · TD Offline";

  return (
    <div className="flex items-center border-b border-[var(--tertiary)] justify-between gap-4 px-6 py-4">

      <div>

       <img
         src={profile.brand.assets.connectionBar ?? profile.brand.assets.logo}
         alt={`${profile.brand.assets.connectionBar ?? profile.brand.assets.logo} logo`}
         className={profile.ui.classes.connectionBar}
         />

      </div>

      <div className="flex items-center gap-2">

        <input
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          className="w-72 bg-neutral-900 px-3 py-2 text-sm
                     ring-1 ring-neutral-800 focus:ring-neutral-600
                     outline-none"
          placeholder="ws://192.168.1.105:9982"
        />

        {!connected ? (
          <button
            onClick={() => connect()}
            className="bg-neutral-100 px-4 py-2
                       text-sm font-medium text-neutral-950"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="bg-neutral-900 px-4 py-2
                       text-sm font-medium ring-1 ring-neutral-800"
          >
            Disconnect
          </button>
          
        )}
        <p className="text-sm text-neutral-400">{status}</p>

      </div>
    </div>
  );
}
