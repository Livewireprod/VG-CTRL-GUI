import { useMemo, useState } from "react";
import { useWS } from "../ws/WSContext";
import { getProfile } from "../profiles";

/*
  Generic control grid:
  - Buttons send: { type:"CMD", id:"..." }
  - Slider sends: { type:"SET", id:"volume", value: ... }
 
   TD decides what each id means (mapping table per team).
 */

export default function PresetGrid() {
  const profile = getProfile();
  const { cmd, setValue, values, connected, tdOnline } = useWS();

  const defaultControls = useMemo(
    () => [
      { id: "preset_1", type: "button", label: "Preset 1" },
      { id: "preset_2", type: "button", label: "Preset 2" },
      { id: "preset_3", type: "button", label: "Preset 3" },
      { id: "preset_4", type: "button", label: "Preset 4" },

      { id: "volume", type: "slider", label: "Volume", min: 0, max: 100, step: 1 },
    ],
    []
  );

  const controls = profile?.controls?.length ? profile.controls : defaultControls;

  // Slider UI value: prefer TD state if present, otherwise local fallback
  const tdVolume = typeof values?.volume === "number" ? values.volume : null;
  const [localVolume, setLocalVolume] = useState(50);
  const volumeValue = tdVolume ?? localVolume;

  const activePreset = values?.activePreset;

  return (
    <div className="bg-neutral-900/40 ring-1 ring-neutral-800">
      <div className="border-b border-neutral-800 px-5 py-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          Controls{" "}
          <span className="text-xs font-normal text-neutral-500">
            ({profile?.id || "profile"})
          </span>
        </h2>

        <div className="text-xs text-neutral-500">
          {connected ? (tdOnline ? "TD Online" : "TD Offline") : "Disconnected"}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {controls
            .filter((c) => c.type === "button")
            .map((c) => {
              const active =
                typeof activePreset === "string" && activePreset === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => cmd(c.id)}
                  className={[
                    "px-3 py-3 text-sm ring-1 transition",
                    active
                      ? "bg-neutral-200 text-neutral-900 ring-neutral-200"
                      : "bg-neutral-950/50 text-neutral-100 ring-neutral-800 hover:bg-neutral-900/60",
                   
                  ].join(" ")}
                  title={c.id}
                >
                  <div className="font-medium">{c.label ?? c.id}</div>
                  <div className="mt-1 text-[10px] text-neutral-500 truncate">
                    {c.id}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          {controls
            .filter((c) => c.type === "slider")
            .map((c) => {
              const min = c.min ?? 0;
              const max = c.max ?? 100;
              const step = c.step ?? 1;

              const current =
                c.id === "volume"
                  ? volumeValue
                  : typeof values?.[c.id] === "number"
                  ? values[c.id]
                  : min;

              return (
                <div
                  key={c.id}
                  className="bg-neutral-950/50 ring-1 ring-neutral-800 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.label ?? c.id}</div>
                    <div className="text-xs text-neutral-400 tabular-nums">
                      {current}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={current}
               
                    onChange={(e) => {
                      const v = Number(e.target.value);

                      if (c.id === "volume") setLocalVolume(v);

                      setValue(c.id, v);
                    }}
                    className="mt-3 w-full"
                  />
                  
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
