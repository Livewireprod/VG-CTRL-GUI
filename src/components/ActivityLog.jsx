import { useWS } from "../ws/WSContext";

export default function ActivityLog() {
  const { log } = useWS();

  return (
    <div className="bg-neutral-900/40 ring-1 ring-neutral-800">

      <div className="border-b border-[var(--tertiary)] px-5 py-4">
        <h2 className="text-sm font-medium">Activity</h2>
      </div>

      <div className="p-5 space-y-2 text-xs">

        {log.length ? (
          log.map((l, i) => (
            <div
              key={i}
              className=" px-3 py-2
                         ring-1 ring-neutral-800"
            >
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
