import { useSimpleWS } from "../ws/SimpleWSContext";

export default function ActivityLog() {
  const { log, clearLog } = useSimpleWS();

  return (
    <div className="bg-neutral-900/40 ring-1 ring-neutral-800">
      <div className="border-b border-[var(--tertiary)] px-5 py-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">Activity</h2>
        <button
          onClick={clearLog}
          className="text-xs opacity-70 hover:opacity-100"
        >
          Clear
        </button>
      </div>

      <div className="p-5 space-y-2 text-xs">
        {log.length ? (
          log.map((l, i) => (
            <div key={i} className="px-3 py-2 ring-1 ring-neutral-800">
              {l}
            </div>
          ))
        ) : (
          <p className="text-neutral-500">No events yet.</p>
        )}
      </div>
    </div>
  );
}