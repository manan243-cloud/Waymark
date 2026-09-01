import React, { useState } from "react";

// A small bottom-sheet form used for editing/renaming/reassigning things.
// `fields`: [{ key, label, type: 'text'|'date'|'select', options?, placeholder? }]
//
// Note: the parent should mount this with a `key` that changes whenever the
// target changes (e.g. `${form.kind}-${form.id}`). That way React remounts
// fresh state from `initial` exactly once per target, instead of an effect
// re-syncing from a new `initial` object reference on every unrelated parent
// re-render — which was silently discarding in-progress edits.
export default function FormSheet({ open, title, fields, initial, submitLabel = "Save", onSubmit, onClose }) {
  const [values, setValues] = useState(initial || {});

  if (!open) return null;

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const submit = () => {
    onSubmit(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: "rgba(38,49,58,0.4)" }}
      onClick={onClose}
    >
      <div
        className="wm-card w-full sm:w-96 sm:rounded-sm rounded-t-2xl p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="text-sm font-medium mb-3">{title}</div>}
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              {f.label && (
                <label className="text-xs block mb-1" style={{ color: "#6b6355" }}>
                  {f.label}
                </label>
              )}
              {f.type === "select" ? (
                <select
                  className="wm-input rounded-sm px-2 py-2 text-sm w-full"
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  rows={3}
                  className="wm-input rounded-sm px-2 py-2 text-sm w-full resize-none"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  autoFocus={f.autoFocus}
                  type={f.type === "date" ? "date" : "text"}
                  className={`wm-input rounded-sm px-2 py-2 text-sm w-full ${f.type === "date" ? "wm-mono" : ""}`}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="wm-btn-ghost rounded-sm px-3 py-2 text-sm flex-1">
            Cancel
          </button>
          <button onClick={submit} className="wm-btn rounded-sm px-3 py-2 text-sm flex-1">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
