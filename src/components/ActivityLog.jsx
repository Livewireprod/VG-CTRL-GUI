import { useSimpleWS } from "../ws/SimpleWSContext";
import { getProfile } from "../profiles";

export default function ActivityLog() {
  const { log, clearLog } = useSimpleWS();
  const profile = getProfile();
  const classes = profile.ui?.classes || {};

  return (
    <div className={classes.panelContainer ?? "bg-neutral-900/40 ring-1 ring-neutral-800"}>
      <div
        className={
          classes.panelHeader ??
          "flex items-center justify-between border-b border-[var(--tertiary)] px-5 py-4"
        }
      >
        <h2 className={classes.panelTitle ?? "text-sm font-medium"}>Activity</h2>
        <button
          onClick={clearLog}
          className={classes.panelAction ?? "text-xs opacity-70 hover:opacity-100"}
        >
          Clear
        </button>
      </div>

      <div className={classes.panelBody ?? "space-y-2 p-5 text-xs"}>
        {log.length ? (
          log.map((l, i) => (
            <div key={i} className={classes.panelItem ?? "px-3 py-2 ring-1 ring-neutral-800"}>
              {l}
            </div>
          ))
        ) : (
          <p className={classes.panelEmpty ?? "text-neutral-500"}>No events yet.</p>
        )}
      </div>
    </div>
  );
}
