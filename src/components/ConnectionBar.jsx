import { useSimpleWS } from "../ws/SimpleWSContext";
import { getProfile } from "../profiles";

export default function ConnectionBar() {
  const profile = getProfile();
  const classes = profile.ui?.classes || {};

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
    <div
      className={
        classes.connectionBarContainer ??
        "flex items-center justify-between gap-4 border-b border-[var(--tertiary)] px-6 py-4"
      }
    >
      <div className="flex items-center gap-4">
        <img
          src={profile.brand.assets.connectionBar ?? profile.brand.assets.logo}
          alt=""
          className={classes.connectionBar ?? "h-8 w-auto"}
        />

        <div>
          <div className={classes.connectionBarOrgName ?? "text-sm font-medium"}>
            {profile.brand.orgName}
          </div>
          <div className={classes.connectionBarStatus ?? "text-xs opacity-70"}>
            {status}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          className={
            classes.controlInput ??
            "w-[320px] border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          }
          placeholder="ws://localhost:9900"
        />

        {!connected ? (
          <button
            onClick={connect}
            className={
              classes.controlButton ??
              "border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110"
            }
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className={
              classes.controlButton ??
              "border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110"
            }
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
