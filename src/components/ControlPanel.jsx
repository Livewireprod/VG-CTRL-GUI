import React, { useEffect, useMemo, useState } from "react";
import { useSimpleWS } from "../ws/SimpleWSContext";
import { getProfile } from "../profiles";

// localStorage helpers
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

function isLegacySeedButton(btn) {
  const id = String(btn?.message?.id || "");
  const title = String(btn?.title || "").trim().toLowerCase();
  if (id === "new_action" && title === "new button") return true;
  return /^preset_\d+$/i.test(id) && /^preset\s*\d+$/i.test(title);
}

function isLegacySeedLayout(layout) {
  const pages = layout?.pages;
  if (!Array.isArray(pages) || pages.length !== 1) return false;
  const page = pages[0];
  const pageTitle = String(page?.title || "").trim().toLowerCase();
  const buttons = Array.isArray(page?.buttons) ? page.buttons : [];
  if (pageTitle !== "page 1" || buttons.length === 0) return false;
  return buttons.every(isLegacySeedButton);
}

// Normalise message before sending (so SET values are correctly typed)
function normaliseMessage(msg) {
  if (!msg || typeof msg !== "object") return msg;

  const type = msg.type || "CMD";
  if (type !== "SET") return msg;

  const valueType = msg.valueType || "number"; // number | string | boolean | json
  let value = msg.value;

  // If value is undefined/null, leave it (TD can decide defaults)
  if (value === undefined) return msg;

  try {
    if (valueType === "number") {
      // Allow empty -> 0, and strings -> number
      if (value === "") value = 0;
      const n = Number(value);
      value = Number.isFinite(n) ? n : 0;
    } else if (valueType === "boolean") {
      if (typeof value === "boolean") {
        // keep
      } else {
        const s = String(value).trim().toLowerCase();
        value = s === "true" || s === "1" || s === "on" || s === "yes";
      }
    } else if (valueType === "json") {
    
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        value = parsed;
      }
    } else {
      value = value == null ? "" : String(value);
    }
  } catch {
    if (valueType === "json") value = null;
  }

  return { ...msg, value };
}

export default function ControlPanel({
  title = "Control Panel",
  storageKey = "controlpanel.layout.v2",
}) {
  const profile = getProfile();
  const classes = profile.ui?.classes || {};
  const { connected, tdOnline, wsUrl, send } = useSimpleWS();
  const controlsEnabled = connected && tdOnline;

  const panelContainerClass =
    classes.panelContainer ?? "bg-neutral-900/40 ring-1 ring-neutral-800";
  const panelHeaderClass =
    classes.panelHeader ??
    "flex items-center justify-between border-b border-[var(--tertiary)] px-5 py-4";
  const panelTitleClass = classes.panelTitle ?? "text-sm font-medium";
  const controlButtonClass =
    classes.controlButton ??
    "border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium hover:brightness-110";

  const [layout, setLayout] = useState(() => {
    const saved = safeJsonParse(localStorage.getItem(storageKey), null);
    if (!saved?.pages?.length) return defaultLayout();
    if (isLegacySeedLayout(saved)) return defaultLayout();
    return saved;
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

  const [editMode, setEditMode] = useState(false);
  const [selectedBtnId, setSelectedBtnId] = useState(null);

  const selectedBtn = useMemo(() => {
    const page = activePage;
    if (!page) return null;
    return (page.buttons || []).find((b) => b.id === selectedBtnId) || null;
  }, [activePage, selectedBtnId]);

  // actions
  const runButton = (btn) => {
    const msg = btn?.message;
    if (!msg) return;
    if (!controlsEnabled) return;
    send(normaliseMessage(msg));
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
        return {
          ...p,
          buttons: (p.buttons || []).filter((b) => b.id !== btnId),
        };
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
        const buttons = (p.buttons || []).map((b) =>
          b.id === selectedBtnId ? { ...b, ...patch } : b
        );
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

          const nextMsg = { ...(b.message || {}), ...msgPatch };

       
          if (msgPatch.type === "SET") {
            if (nextMsg.valueType == null) nextMsg.valueType = "number";
            if (nextMsg.value == null) nextMsg.value = 0;
          }
          if (msgPatch.type === "CMD") {
          }

          return { ...b, message: nextMsg };
        });
        return { ...p, buttons };
      });
      return { ...prev, pages };
    });
  };

  const updatePage = (patch) => {
    setLayout((prev) => {
      const pages = prev.pages.map((p) =>
        p.id === activePageId ? { ...p, ...patch } : p
      );
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
    <span
      className={[
        "inline-block rounded-full h-2.5 w-2.5",
        on ? "bg-emerald-400" : "bg-zinc-500",
      ].join(" ")}
    />
  );

  const cols = activePage?.gridCols || 4;
  const rows = activePage?.gridRows || 2;
  const capacity = Math.max(1, cols * rows);

  const buttons = activePage?.buttons || [];
  const fittedButtons = buttons.slice(0, capacity);
  const placeholderCount = Math.max(0, capacity - fittedButtons.length);

  const displayButtons = [
    ...fittedButtons,
    ...Array.from({ length: placeholderCount }, (_, i) => ({
      id: `empty_${i}`,
      __placeholder: true,
    })),
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

  const selectedMsg = selectedBtn?.message || {};
  const isSet = (selectedMsg?.type || "CMD") === "SET";

  return (
    <div className="w-full [font-size:clamp(0.75rem,0.35vw+0.65rem,1rem)]">
      <div className={panelContainerClass}>
        {/* Header */}
        <div
          className={`${panelHeaderClass} flex-wrap items-start gap-3 min-[770px]:flex-nowrap min-[770px]:gap-4`}
        >
          <div className="min-w-0 flex-1">
            <div
              className={`${panelTitleClass} text-[clamp(1.05rem,0.9vw+0.75rem,1.6rem)]`}
            >
              {title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-70">
              <span className="inline-flex items-center gap-2">
                <Dot on={connected} /> WS: {connected ? "Online" : "Offline"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Dot on={tdOnline} /> TD: {tdOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 min-[770px]:w-auto">
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={[
                controlButtonClass,
                "text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] transition",
                editMode ? "brightness-110" : "",
              ].join(" ")}
            >
              {editMode ? "Done" : "Edit"}
            </button>

            <button
              type="button"
              onClick={() => send({ type: "PING", ts: Date.now() })}
              disabled={!connected}
              className={[
                controlButtonClass,
                "text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] transition",
                connected ? "" : "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              Ping
            </button>
          </div>
        </div>

        <div className="p-5">
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
                    controlButtonClass,
                    "px-3 py-1.5 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] transition",
                    active ? "brightness-110" : "",
                  ].join(" ")}
                >
                  {p.title}
                </button>
              );
            })}

            {editMode && (
              <div className="flex w-full items-center gap-2 min-[770px]:ml-auto min-[770px]:w-auto">
                <button
                  type="button"
                  onClick={addPage}
                  className={`${controlButtonClass} px-3 py-1.5 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)]`}
                >
                  + Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (layout.pages.length <= 1) return;
                    if (!window.confirm("Are you sure you want to delete this page?"))
                      return;
                    removePage();
                  }}
                  disabled={layout.pages.length <= 1}
                  className={[
                    controlButtonClass,
                    "px-3 py-1.5 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] transition",
                    layout.pages.length > 1 ? "" : "opacity-50 cursor-not-allowed",
                  ].join(" ")}
                >
                  − Page
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {/* StreamDeck grid */}
            <div>
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
                          className="aspect-square bg-neutral-950/50 p-2.5 ring-1 ring-neutral-800 min-[770px]:p-3 min-[1024px]:p-4"
                        />
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => addButton(i)}
                        key={b.id}
                        className="aspect-square bg-neutral-950/50 p-2.5 text-left ring-1 ring-neutral-800 hover:brightness-110 min-[770px]:p-3 min-[1024px]:p-4"
                      >
                        <div className="flex h-full items-center justify-center text-[clamp(0.8rem,0.45vw+0.65rem,1.2rem)] font-semibold">
                          + Add button
                        </div>
                      </button>
                    );
                  }

                  const selected = editMode && b.id === selectedBtnId;
                  const msgType = b.message?.type || "—";
                  const msgId = b.message?.id || "—";
                  const msgVal =
                    (b.message?.type === "SET" && b.message?.value !== undefined)
                      ? ` · ${String(b.message.value)}`
                      : "";

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (editMode) setSelectedBtnId(b.id);
                        else runButton(b);
                      }}
                      disabled={!editMode && !controlsEnabled}
                      className={[
                        "aspect-square bg-neutral-950/50 text-left p-2.5 ring-1 ring-neutral-800 transition select-none min-[770px]:p-3 min-[1024px]:p-4",
                        selected ? "brightness-110 ring-[var(--tertiary)]" : "",
                        editMode
                          ? "hover:brightness-110"
                          : controlsEnabled
                          ? "hover:brightness-110 active:scale-[0.985]"
                          : "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                      title={b.message ? JSON.stringify(b.message) : b.id}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="text-[clamp(0.8rem,0.45vw+0.65rem,1.2rem)] font-semibold leading-snug">
                          {b.title}
                        </div>
                        <div className="text-[clamp(0.58rem,0.28vw+0.5rem,0.84rem)] opacity-60">
                          {msgType} · {msgId}{msgVal}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!tdOnline && connected && (
                <div className="mt-3 bg-neutral-950/50 px-3 py-2 text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80 ring-1 ring-neutral-800">
                  TD is offline — controls are disabled until TD reconnects.
                </div>
              )}
            </div>

            {/* Editor panel */}
            {editMode && (
              <div className="bg-neutral-950/50 p-4 ring-1 ring-neutral-800">
                <div className="mb-3 text-[clamp(0.82rem,0.33vw+0.7rem,1.1rem)] font-semibold">
                  Edit
                </div>

                {/* Page settings */}
                {!selectedBtn && (
                  <div className="mb-4 bg-neutral-950/50 p-3 ring-1 ring-neutral-800">
                    <div className="mb-2 text-[clamp(0.68rem,0.18vw+0.62rem,0.86rem)] font-semibold uppercase tracking-wide opacity-70">
                      Page
                    </div>

                    <label className="block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                      Title
                    </label>
                    <input
                      value={activePage?.title || ""}
                      onChange={(e) => updatePage({ title: e.target.value })}
                      className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                    />

                    <div className="mt-3 grid grid-cols-1 gap-3 min-[1200px]:grid-cols-2">
                      <div>
                        <label className="block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                          Columns
                        </label>
                        <select
                          value={activePage?.gridCols || 4}
                          onChange={(e) =>
                            updatePage({ gridCols: Number(e.target.value) })
                          }
                          className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                        >
                          {[2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                          Rows
                        </label>
                        <select
                          value={activePage?.gridRows || 2}
                          onChange={(e) =>
                            updatePage({ gridRows: Number(e.target.value) })
                          }
                          className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
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
                      <div className="mt-2 text-[clamp(0.62rem,0.18vw+0.56rem,0.8rem)] opacity-70">
                        Showing {capacity} of {buttons.length} buttons for this page
                        size.
                      </div>
                    )}
                  </div>
                )}

                {/* Button settings */}
                {!selectedBtn ? (
                  <div className="text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] opacity-70">
                    Select a button to edit its title and message.
                  </div>
                ) : (
                  <div className="bg-neutral-950/50 p-3 ring-1 ring-neutral-800">
                    <div className="mb-2 text-[clamp(0.68rem,0.18vw+0.62rem,0.86rem)] font-semibold uppercase tracking-wide opacity-70">
                      Button
                    </div>

                    <label className="block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                      Title
                    </label>
                    <input
                      value={selectedBtn.title || ""}
                      onChange={(e) => updateSelected({ title: e.target.value })}
                      className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                    />

                    <label className="mt-3 block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                      Message type
                    </label>
                    <select
                      value={selectedBtn.message?.type || "CMD"}
                      onChange={(e) => updateSelectedMessage({ type: e.target.value })}
                      className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                    >
                      {["CMD", "SET"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <label className="mt-3 block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                      Message id
                    </label>
                    <input
                      value={selectedBtn.message?.id || ""}
                      onChange={(e) => updateSelectedMessage({ id: e.target.value })}
                      className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                      placeholder="Flagstatus"
                    />

                    {/* SET value editor */}
                    {isSet && (
                      <div className="mt-3 bg-neutral-950/50 p-3 ring-1 ring-neutral-800">
                        <div className="mb-2 text-[clamp(0.68rem,0.18vw+0.62rem,0.86rem)] font-semibold uppercase tracking-wide opacity-70">
                          Value
                        </div>

                        <label className="block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                          Value type
                        </label>
                        <select
                          value={selectedBtn.message?.valueType || "number"}
                          onChange={(e) =>
                            updateSelectedMessage({ valueType: e.target.value })
                          }
                          className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                        >
                          {["number", "string", "boolean", "json"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        <label className="mt-3 block text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] opacity-80">
                          Value
                        </label>

                        {selectedBtn.message?.valueType === "boolean" ? (
                          <select
                            value={String(selectedBtn.message?.value ?? false)}
                            onChange={(e) =>
                              updateSelectedMessage({ value: e.target.value === "true" })
                            }
                            className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                          >
                            <option value="false">false</option>
                            <option value="true">true</option>
                          </select>
                        ) : selectedBtn.message?.valueType === "json" ? (
                          <textarea
                            value={
                              typeof selectedBtn.message?.value === "string"
                                ? selectedBtn.message.value
                                : JSON.stringify(selectedBtn.message?.value ?? null, null, 2)
                            }
                            onChange={(e) => updateSelectedMessage({ value: e.target.value })}
                            className="mt-1 w-full bg-neutral-950/50 px-3 py-2 font-mono text-[clamp(0.7rem,0.2vw+0.65rem,0.9rem)] outline-none ring-1 ring-neutral-800"
                            rows={4}
                            placeholder={`{\n  "some": "json"\n}`}
                          />
                        ) : (
                          <input
                            value={selectedBtn.message?.value ?? ""}
                            onChange={(e) => updateSelectedMessage({ value: e.target.value })}
                            className="mt-1 w-full bg-neutral-950/50 px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] outline-none ring-1 ring-neutral-800"
                            placeholder="2"
                          />
                        )}

                        <div className="mt-2 text-[clamp(0.62rem,0.18vw+0.56rem,0.8rem)] opacity-70">
                          Sent as:{" "}
                          <span className="font-mono">
                            {JSON.stringify(normaliseMessage(selectedBtn.message), null, 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 bg-neutral-950/50 p-2 ring-1 ring-neutral-800">
                      <div className="text-[clamp(0.62rem,0.18vw+0.56rem,0.8rem)] opacity-70">
                        Will send
                      </div>
                      <pre className="mt-1 text-[clamp(0.68rem,0.18vw+0.62rem,0.86rem)] whitespace-pre-wrap break-words">
                        {JSON.stringify(normaliseMessage(selectedBtn.message || {}), null, 2)}
                      </pre>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
                      <button
                        type="button"
                        onClick={() => removeButton(selectedBtn.id)}
                        className={`${controlButtonClass} w-full px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] min-[1200px]:w-auto`}
                      >
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => controlsEnabled && send(normaliseMessage(selectedBtn.message))}
                        disabled={!controlsEnabled}
                        className={[
                          controlButtonClass,
                          "w-full px-3 py-2 text-[clamp(0.75rem,0.3vw+0.65rem,1rem)] transition min-[1200px]:w-auto",
                          controlsEnabled ? "" : "opacity-50 cursor-not-allowed",
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
        </div>
      </div>
    </div>
  );
}
