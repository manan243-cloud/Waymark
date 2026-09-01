import React from "react";
import { RotateCcw, Trash2 } from "./icons.jsx";

export default function ArchiveSheet({ open, goals, categories, onRestore, onDeleteForever, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: "rgba(38,49,58,0.4)" }}
      onClick={onClose}
    >
      <div
        className="wm-card w-full sm:w-[28rem] sm:rounded-sm rounded-t-2xl p-4 flex flex-col"
        style={{ maxHeight: "80vh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium mb-1">Archived goals</div>
        <p className="text-xs mb-2" style={{ color: "#6b6355" }}>
          Archived goals are hidden from your lists but not deleted.
        </p>
        <div className="overflow-y-auto flex-1 divide-y wm-hairline">
          {goals.length === 0 ? (
            <p className="text-sm italic py-6 text-center" style={{ color: "#8a8272" }}>
              Nothing archived.
            </p>
          ) : (
            goals.map((g) => {
              const cat = categories.find((c) => c.id === g.category);
              return (
                <div key={g.id} className="flex items-center gap-2 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{g.title}</div>
                    <div className="text-xs" style={{ color: "#6b6355" }}>
                      {cat ? cat.name : "Unsorted"} · {g.tasks.length} step{g.tasks.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button onClick={() => onRestore(g.id)} className="wm-btn-ghost rounded-sm px-2 py-1.5 text-xs flex items-center gap-1 shrink-0">
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button onClick={() => onDeleteForever(g.id)} className="p-1.5 shrink-0" style={{ color: "#A2452F" }} title="Delete forever">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <button onClick={onClose} className="w-full text-center px-3 py-2.5 mt-3 border-t wm-hairline text-sm shrink-0" style={{ color: "#6b6355" }}>
          Close
        </button>
      </div>
    </div>
  );
}
