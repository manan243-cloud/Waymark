import React, { useState, useEffect } from "react";
import { MoreVertical, Flag, Repeat, Check } from "./icons.jsx";
import StatusBox from "./StatusBox.jsx";
import { useLongPress, useSwipe } from "./hooks.js";
import { isOverdue, isUrgent } from "./utils.js";

function Row({ t, showTag, cat, selectMode, selected, onToggleSelect, onCycle, onMarkDone, onMenu }) {
  const lp = useLongPress(onMenu, selectMode ? onToggleSelect : null);
  const swipe = useSwipe(
    () => !selectMode && t.status !== "done" && onMarkDone(),
    () => !selectMode && onMenu()
  );
  const overdue = isOverdue(t);
  const urgent = !overdue && isUrgent(t);

  return (
    <div className="relative overflow-hidden">
      {!selectMode && swipe.offset !== 0 && (
        <div
          className="absolute inset-0 flex items-center"
          style={{
            justifyContent: swipe.offset > 0 ? "flex-start" : "flex-end",
            background: swipe.offset > 0 ? "#4F6B5233" : "#26313A22",
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          {swipe.offset > 0 ? <Check size={14} style={{ color: "#4F6B52" }} /> : <MoreVertical size={14} />}
        </div>
      )}
      <div
        {...lp}
        {...(selectMode ? {} : swipe.handlers)}
        className="relative flex items-center gap-2 select-none py-1.5 touch-pan-y"
        style={{ transform: selectMode ? "none" : `translateX(${swipe.offset}px)`, background: "#F7F4EC" }}
      >
        {selectMode ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="shrink-0 rounded-[5px] flex items-center justify-center" style={{ width: 18, height: 18, background: selected ? "#4F6B52" : "transparent", border: `1.5px solid ${selected ? "#4F6B52" : "#9C9585"}` }}>
            {selected && <Check size={12} strokeWidth={3} style={{ color: "#F7F4EC" }} />}
          </button>
        ) : (
          <StatusBox size={16} status={t.status} onClick={(e) => { e.stopPropagation(); onCycle(); }} />
        )}
        <span
          className="text-sm flex-1 truncate"
          style={{
            color: t.status === "done" ? "#8a8272" : t.status === "failed" ? "#A2452F" : "#26313A",
            textDecoration: t.status === "done" ? "line-through" : "none",
          }}
        >
          {t.title}
        </span>
        {t.recurrence && t.recurrence !== "none" && <Repeat size={11} style={{ color: "#6b6355" }} />}
        {t.due && (
          <span className="flex items-center gap-1 shrink-0">
            {urgent && <Flag size={11} strokeWidth={2} style={{ color: "#B8843C" }} />}
            <span
              className="wm-mono text-xs"
              style={{ color: overdue ? "#A2452F" : urgent ? "#B8843C" : "#8a8272", fontWeight: urgent ? 600 : 400 }}
            >
              {t.due}
            </span>
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
        {!selectMode && (
          <button onClick={onMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
            <MoreVertical size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// Bottom sheet listing every task matching whichever stat card was tapped.
// Supports swipe-to-complete / swipe-to-menu per row, and a "Select" mode
// for bulk actions across several steps at once.
export default function TaskListSheet({ open, title, tasks, categories, showTag, onCycle, onMarkDone, onMenu, onBulkAction, onClose }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (open) {
      setSelectMode(false);
      setSelectedIds([]);
    }
  }, [open, title]);

  if (!open) return null;

  const toggleId = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectedTasks = tasks.filter((t) => selectedIds.includes(t.id));

  const runBulk = (action) => {
    onBulkAction(action, selectedTasks.map((t) => ({ goalId: t.goalId, id: t.id })));
    setSelectMode(false);
    setSelectedIds([]);
  };

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
        <div className="flex items-center justify-between mb-2 shrink-0 gap-2">
          <div className="text-sm font-medium">{title}</div>
          <div className="flex items-center gap-3">
            <span className="wm-mono text-xs" style={{ color: "#6b6355" }}>{tasks.length}</span>
            {tasks.length > 0 && (
              <button
                onClick={() => { setSelectMode((v) => !v); setSelectedIds([]); }}
                className="text-xs font-medium"
                style={{ color: "#4F6B52" }}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
            )}
          </div>
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
                selectMode={selectMode}
                selected={selectedIds.includes(t.id)}
                onToggleSelect={() => toggleId(t.id)}
                onCycle={() => onCycle(t.goalId, t.id)}
                onMarkDone={() => onMarkDone(t.goalId, t.id)}
                onMenu={() => onMenu(t.goalId, t.id)}
              />
            ))
          )}
        </div>

        {selectMode && selectedIds.length > 0 ? (
          <div className="flex gap-2 mt-3 pt-3 border-t wm-hairline shrink-0">
            <button onClick={() => runBulk("done")} className="wm-btn rounded-sm px-2 py-2 text-xs flex-1">
              Mark done
            </button>
            <button onClick={() => runBulk("failed")} className="wm-btn-ghost rounded-sm px-2 py-2 text-xs flex-1">
              Mark failed
            </button>
            <button onClick={() => runBulk("delete")} className="rounded-sm px-2 py-2 text-xs flex-1" style={{ border: "1px solid #A2452F55", color: "#A2452F" }}>
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full text-center px-3 py-2.5 mt-3 border-t wm-hairline text-sm shrink-0"
            style={{ color: "#6b6355" }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
