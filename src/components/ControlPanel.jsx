import React, { useEffect, useMemo, useState } from "react";
import { useSimpleWS } from "../ws/SimpleWSContext";

//localStorage helpers 
function safeJsonParse(s, fallback) {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Default layout if none saved
function defaultLayout() {
  return {
    pages: [
      {
        id: "page_" + uid(),
        title: "Page 1",
        gridCols: 4,
        gridRows: 2,
        buttons: [],
      },
    ],
  };
}

export default function ControlPanel({
  title = "Control Panel",
  storageKey = "controlpanel.layout.v2", 
}) {
  const { connected, tdOnline, wsUrl, send } = useSimpleWS();
  const controlsEnabled = connected && tdOnline;

  // layout state 
  const [layout, setLayout] = useState(() => {
    const saved = safeJsonParse(localStorage.getItem(storageKey), null);
    return saved?.pages?.length ? saved : defaultLayout();
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [layout, storageKey]);

  const [activePageId, setActivePageId] = useState(() => layout.pages[0]?.id);
  useEffect(() => {
    if (!layout.pages.some((p) => p.id === activePageId)) {
      setActivePageId(layout.pages[0]?.id);
    }
  }, [layout.pages, activePageId]);

  const activePage = useMemo(
    () => layout.pages.find((p) => p.id === activePageId) || layout.pages[0],
    [layout.pages, activePageId]
  );

  //  edit mode 
  const [editMode, setEditMode] = useState(false);
  const [selectedBtnId, setSelectedBtnId] = useState(null);

  const selectedBtn = useMemo(() => {
    const page = activePage;
    if (!page) return null;
    return (page.buttons || []).find((b) => b.id === selectedBtnId) || null;
  }, [activePage, selectedBtnId]);

  // actions 
  const runButton = (btn) => {
    if (!btn?.message) return;
    if (!controlsEnabled) return;
    send(btn.message);
  };

  const addButton = (slotIndex = null) => {
    let createdId = null;
    setLayout((prev) => {
      const pages = prev.pages.map((p) => {
        if (p.id !== activePageId) return p;
        const pageCols = Number(p.gridCols) || 4;
        const pageRows = Number(p.gridRows) || 2;
        const pageCapacity = Math.max(1, pageCols * pageRows);
        const existing = p.buttons || [];
        if (existing.length >= pageCapacity) return p;
        const next = {
          id: "btn_" + uid(),
          title: "New Button",
          message: { type: "CMD", id: "new_action" },
        };
        createdId = next.id;
        if (slotIndex === null) {
          return { ...p, buttons: [...existing, next] };
        }
        const insertAt = Math.max(0, Math.min(slotIndex, existing.length));
        const buttons = [...existing];
        buttons.splice(insertAt, 0, next);
        return { ...p, buttons };
      });
      return { ...prev, pages };
    });
    if (createdId) setSelectedBtnId(createdId);
  };

  const removeButton = (btnId) => {
    setLayout((prev) => {
      const pages = prev.pages.map((p) => {
        if (p.id !== activePageId) return p;
        return { ...p, buttons: (p.buttons || []).filter((b) => b.id !== btnId) };
      });
      return { ...prev, pages };
    });
    if (selectedBtnId === btnId) setSelectedBtnId(null);
  };

  const updateSelected = (patch) => {
    if (!selectedBtnId) return;
    setLayout((prev) => {
      const pages = prev.pages.map((p) => {
        if (p.id !== activePageId) return p;
        const buttons = (p.buttons || []).map((b) => (b.id === selectedBtnId ? { ...b, ...patch } : b));
        return { ...p, buttons };
      });
      return { ...prev, pages };
    });
  };

  const updateSelectedMessage = (msgPatch) => {
    if (!selectedBtnId) return;
    setLayout((prev) => {
      const pages = prev.pages.map((p) => {
        if (p.id !== activePageId) return p;
        const buttons = (p.buttons || []).map((b) => {
          if (b.id !== selectedBtnId) return b;
          return { ...b, message: { ...(b.message || {}), ...msgPatch } };
        });
        return { ...p, buttons };
      });
      return { ...prev, pages };
    });
  };

  const updatePage = (patch) => {
    setLayout((prev) => {
      const pages = prev.pages.map((p) => (p.id === activePageId ? { ...p, ...patch } : p));
      return { ...prev, pages };
    });
  };

  const addPage = () => {
    const newPage = {
      id: "page_" + uid(),
      title: "New Page",
      gridCols: 4,
      gridRows: 2,
      buttons: [],
    };
    setLayout((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageId(newPage.id);
    setSelectedBtnId(null);
  };

  const removePage = () => {
    if (!activePageId) return;
    setLayout((prev) => {
      if (prev.pages.length <= 1) return prev;
      const pages = prev.pages.filter((p) => p.id !== activePageId);
      return { ...prev, pages };
    });
    setSelectedBtnId(null);
  };

  const Dot = ({ on }) => (
    <span className={["inline-block h-2.5 w-2.5 rounded-full", on ? "bg-emerald-400" : "bg-zinc-500"].join(" ")} />
  );

  const cols = activePage?.gridCols || 4;
  const rows = activePage?.gridRows || 2;
  const capacity = Math.max(1, cols * rows);
  const buttons = activePage?.buttons || [];
  const fittedButtons = buttons.slice(0, capacity);
  const placeholderCount = Math.max(0, capacity - fittedButtons.length);
  const displayButtons = [
    ...fittedButtons,
    ...Array.from({ length: placeholderCount }, (_, i) => ({ id: `empty_${i}`, __placeholder: true })),
  ];
  const pagesForPills = layout.pages.filter((p) => {
    const t = String(p.title || "").trim().toLowerCase();
    return t !== "presets" && t !== "utilities";
  });

  useEffect(() => {
    if (!pagesForPills.length) return;
    const activeHidden = !pagesForPills.some((p) => p.id === activePageId);
    if (activeHidden) setActivePageId(pagesForPills[0].id);
  }, [pagesForPills, activePageId]);

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
              <span className="inline-flex items-center gap-2">
                <Dot on={connected} /> WS: {connected ? "Online" : "Offline"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Dot on={tdOnline} /> TD: {tdOnline ? "Online" : "Offline"}
              </span>
             
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                editMode ? "border-white/20 bg-white/10" : "border-white/10 bg-black/20 hover:brightness-110",
              ].join(" ")}
            >
              {editMode ? "Done" : "Edit"}
            </button>

            <button
              type="button"
              onClick={() => send({ type: "PING", ts: Date.now() })}
              disabled={!connected}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                "border-white/10 bg-black/20",
                connected ? "hover:brightness-110" : "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              Ping
            </button>
          </div>
        </div>

        {/* Pages row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {pagesForPills.map((p) => {
            const active = p.id === activePageId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePageId(p.id);
                  setSelectedBtnId(null);
                }}
                className={[
                  "rounded-xl border px-3 py-1.5 text-sm font-medium transition",
                  active ? "border-white/20 bg-white/10" : "border-white/10 bg-black/20 hover:brightness-110",
                ].join(" ")}
              >
                {p.title}
              </button>
            );
          })}

          {editMode && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={addPage}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-medium hover:brightness-110"
              >
                + Page
              </button>
              <button
                type="button"
                onClick={removePage}
                disabled={layout.pages.length <= 1}
                className={[
                  "rounded-xl border px-3 py-1.5 text-sm font-medium transition",
                  "border-white/10 bg-black/20",
                  layout.pages.length > 1 ? "hover:brightness-110" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                − Page
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* StreamDeck grid */}
          <div className={editMode ? "md:col-span-2" : "md:col-span-3"}>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {displayButtons.map((b, i) => {
                if (b.__placeholder) {
                  if (!editMode) {
                    return (
                      <div
                        key={b.id}
                        className="aspect-square rounded-xl sm:rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:p-3 md:p-4"
                      />
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => addButton(i)}
                      key={b.id}
                      className="aspect-square rounded-xl sm:rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:p-3 md:p-4 text-left hover:brightness-110"
                    >
                      <div className="flex h-full items-center justify-center text-xs sm:text-sm md:text-base font-semibold">
                        + Add button
                      </div>
                    </button>
                  );
                }
                const selected = editMode && b.id === selectedBtnId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      if (editMode) {
                        setSelectedBtnId(b.id);
                      } else {
                        runButton(b);
                      }
                    }}
                    disabled={!editMode && !controlsEnabled}
                    className={[
                      "aspect-square rounded-xl sm:rounded-2xl border text-left p-2.5 sm:p-3 md:p-4 transition select-none",
                      selected ? "border-white/30 bg-white/10" : "border-white/10 bg-black/25",
                      editMode ? "hover:brightness-110" : controlsEnabled ? "hover:brightness-110 active:scale-[0.985]" : "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                    title={b.message ? JSON.stringify(b.message) : b.id}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="text-xs sm:text-sm md:text-base font-semibold leading-snug">{b.title}</div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs opacity-60">
                        {b.message?.type || "—"} · {b.message?.id || "—"}
                      </div>
                    </div>
                  </button>
                );
              })}

            </div>

            {!tdOnline && connected && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs opacity-80">
                TD is offline — controls are disabled until TD reconnects.
              </div>
            )}
          </div>

          {/* Editor panel */}
          {editMode && (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="mb-3 text-sm font-semibold">Edit</div>

              {/* Page settings */}
              <div className="mb-4 rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                  Page
                </div>

                <label className="block text-xs opacity-80">Title</label>
                <input
                  value={activePage?.title || ""}
                  onChange={(e) => updatePage({ title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs opacity-80">Grid columns</label>
                    <select
                      value={activePage?.gridCols || 4}
                      onChange={(e) => updatePage({ gridCols: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} 
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs opacity-80">Grid rows</label>
                    <select
                      value={activePage?.gridRows || 2}
                      onChange={(e) => updatePage({ gridRows: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} 
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {buttons.length > capacity && (
                  <div className="mt-2 text-[11px] opacity-70">
                    Showing {capacity} of {buttons.length} buttons for this page size.
                  </div>
                )}
              </div>

              {/* Button settings */}
              {!selectedBtn ? (
                <div className="text-sm opacity-70">
                  Select a button to edit its title and message.
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                    Button
                  </div>

                  <label className="block text-xs opacity-80">Title</label>
                  <input
                    value={selectedBtn.title || ""}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                  />

                  <label className="mt-3 block text-xs opacity-80">Message type</label>
                  <select
                    value={selectedBtn.message?.type || "CMD"}
                    onChange={(e) => updateSelectedMessage({ type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                  >
                    {["CMD", "SET"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <label className="mt-3 block text-xs opacity-80">Message id</label>
                  <input
                    value={selectedBtn.message?.id || ""}
                    onChange={(e) => updateSelectedMessage({ id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    placeholder="preset_1"
                  />

                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
                    <div className="text-[11px] opacity-70">Will send</div>
                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedBtn.message || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => removeButton(selectedBtn.id)}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110"
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={() => controlsEnabled && send(selectedBtn.message)}
                      disabled={!controlsEnabled}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm font-medium transition",
                        "border-white/10 bg-black/20",
                        controlsEnabled ? "hover:brightness-110" : "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                    >
                      Test Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional: keep sliders for now (separate from editable buttons) */}
        {/* We can also make sliders editable later exactly the same way */}
      </div>
    </div>
  );
}
