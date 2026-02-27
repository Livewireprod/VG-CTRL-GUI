import { useSimpleWS } from "../ws/SimpleWSContext";
import { getProfile } from "../profiles";

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
  } = useSimpleWS();

  const status = connecting
    ? "Connecting…"
    : !connected
    ? "Disconnected"
    : tdOnline
    ? "Connected · TD Online"
    : "Connected · TD Offline";

  return (
    <div className="flex items-center border-b border-[var(--tertiary)] justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-4">
        <img
          src={profile.brand.assets.connectionBar ?? profile.brand.assets.logo}
          alt=""
          className={profile.ui.classes.connectionBarLogo}
        />

        <div>
          <div className="text-sm font-medium">{profile.brand.orgName}</div>
          <div className="text-xs opacity-70">{status}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          className="w-[320px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          placeholder="ws://localhost:9900"
        />

        {!connected ? (
          <button
            onClick={connect}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}