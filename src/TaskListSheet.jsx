import React from "react";
import { MoreVertical } from "./icons.jsx";
import StatusBox from "./StatusBox.jsx";
import { useLongPress } from "./hooks.js";
import { isOverdue } from "./utils.js";

function Row({ t, showTag, cat, onCycle, onMenu }) {
  const lp = useLongPress(onMenu, null);
  return (
    <div {...lp} className="flex items-center gap-2 select-none py-1">
      <StatusBox size={16} status={t.status} onClick={(e) => { e.stopPropagation(); onCycle(); }} />
      <span
        className="text-sm flex-1 truncate"
        style={{
          color: t.status === "done" ? "#8a8272" : t.status === "failed" ? "#A2452F" : "#26313A",
          textDecoration: t.status === "done" ? "line-through" : "none",
        }}
      >
        {t.title}
      </span>
      {t.due && (
        <span className="wm-mono text-xs shrink-0" style={{ color: isOverdue(t) ? "#A2452F" : "#8a8272" }}>
          {t.due}
        </span>
      )}
      {showTag && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
          style={{ background: cat ? cat.color : "#C9C2AF" }}
          title={cat ? cat.name : "Unsorted"}
        />
      )}
      <span className="text-xs truncate max-w-[90px] shrink-0" style={{ color: "#8a8272" }}>
        {t.goalTitle}
      </span>
      <button onClick={onMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
        <MoreVertical size={12} />
      </button>
    </div>
  );
}

// Bottom sheet listing every task matching whichever stat card was tapped
// (Total tasks / Done / In progress / Not started / Overdue / Task failed).
export default function TaskListSheet({ open, title, tasks, categories, showTag, onCycle, onMenu, onClose }) {
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
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="text-sm font-medium">{title}</div>
          <span className="wm-mono text-xs" style={{ color: "#6b6355" }}>{tasks.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 divide-y wm-hairline">
          {tasks.length === 0 ? (
            <p className="text-sm italic py-6 text-center" style={{ color: "#8a8272" }}>
              Nothing here.
            </p>
          ) : (
            tasks.map((t) => (
              <Row
                key={t.id}
                t={t}
                showTag={showTag}
                cat={categories.find((c) => c.id === t.goalCategory)}
                onCycle={() => onCycle(t.goalId, t.id)}
                onMenu={() => onMenu(t.goalId, t.id)}
              />
            ))
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full text-center px-3 py-2.5 mt-3 border-t wm-hairline text-sm shrink-0"
          style={{ color: "#6b6355" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
