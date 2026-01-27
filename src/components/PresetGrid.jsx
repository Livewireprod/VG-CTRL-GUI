import { useWS } from "../ws/WSContext";

export default function PresetGrid() {
  const { presets, activePreset, applyPreset, tdOnline } = useWS();

  if (!presets.length) {
    return (
      <div className="bg-neutral-900/40 p-6 ring-1 ring-neutral-800">
        <p className="text-sm text-neutral-400">
          No presets received yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/40 ring-1 ring-neutral-800">

      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <h2 className="text-sm font-medium">Presets</h2>

        <div className="text-xs text-neutral-400">
          TD: {tdOnline ? "Online" : "Offline"}
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

        {presets.map((p) => {
          const name = p.name || p;
          const displayName = String(p.label || name).replace(/\.dat$/i, "");

          const active = activePreset === name;

          return (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={[
                "px-4 py-4 text-left ring-1 transition",

                active
                  ? "bg-neutral-100 text-neutral-950 ring-neutral-200"
                  : "bg-neutral-950/50 text-neutral-100 ring-neutral-800 hover:ring-neutral-600",
              ].join(" ")}
            >
              <div className="text-sm font-medium">
                {displayName}
              </div>

            </button>
          );
        })}

      </div>
    </div>
  );
}
