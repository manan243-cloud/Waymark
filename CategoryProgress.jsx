import React from "react";
import { AlertTriangle, Flame } from "./icons.jsx";
import { goalProgress, isOverdue, goalNeedsAttention, currentStreak } from "./utils.js";

// Per-category dashboard: how much of each category's work is done, and a
// flag for categories that look neglected (overdue steps, or a deadline
// coming up with little progress made).
export default function CategoryProgress({ categories, goals, activityLog, onSelect }) {
  const hasUnsorted = goals.some((g) => !g.category);
  const rows = [
    ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    ...(hasUnsorted ? [{ id: "unsorted", name: "Unsorted", color: "#C9C2AF" }] : []),
  ];

  const stats = rows.map((row) => {
    const goalsInRow = goals.filter((g) => (row.id === "unsorted" ? !g.category : g.category === row.id));
    const tasks = goalsInRow.flatMap((g) => g.tasks);
    const done = tasks.filter((t) => t.status === "done").length;
    const doing = tasks.filter((t) => t.status === "doing").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const total = tasks.length;
    const overdue = tasks.filter(isOverdue).length;
    const attention = overdue > 0 || goalsInRow.some(goalNeedsAttention) || (goalsInRow.length > 0 && total === 0);
    const streak = currentStreak(activityLog || [], row.id === "unsorted" ? null : row.id);
    return { ...row, goalCount: goalsInRow.length, done, doing, todo, total, overdue, attention, streak };
  });

  if (stats.length === 0) return null;

  return (
    <div className="wm-card rounded-sm p-4 md:p-5 mb-8">
      <h2 className="wm-display text-lg mb-1">Where your attention is going</h2>
      <p className="text-xs mb-4" style={{ color: "#6b6355" }}>
        Progress by category — flagged rows could use a closer look.
      </p>
      <div className="space-y-3">
        {stats.map((s) => {
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full text-left flex items-center gap-3 group"
            >
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: s.color }} />
              <span className="text-sm w-28 shrink-0 truncate flex items-center gap-1">
                {s.name}
                {s.streak >= 2 && (
                  <span className="flex items-center gap-0.5 shrink-0" style={{ color: "#B8843C" }} title={`${s.streak}-day streak`}>
                    <Flame size={10} />
                    <span className="wm-mono text-[10px]">{s.streak}</span>
                  </span>
                )}
              </span>
              <div className="flex-1 h-2.5 wm-track rounded-full overflow-hidden flex">
                {s.total === 0 ? (
                  <div className="h-full w-full" style={{ background: "repeating-linear-gradient(45deg, #E4DFD1, #E4DFD1 4px, #DCD5C4 4px, #DCD5C4 8px)" }} />
                ) : (
                  <>
                    <div className="h-full" style={{ width: `${(s.done / s.total) * 100}%`, background: "#4F6B52" }} />
                    <div className="h-full" style={{ width: `${(s.doing / s.total) * 100}%`, background: "#B8843C" }} />
                    <div className="h-full" style={{ width: `${(s.todo / s.total) * 100}%`, background: "#C9C2AF" }} />
                  </>
                )}
              </div>
              <span className="wm-mono text-xs w-9 text-right shrink-0" style={{ color: "#6b6355" }}>
                {s.total ? `${pct}%` : "—"}
              </span>
              <span className="w-5 shrink-0 flex justify-center">
                {s.attention && <AlertTriangle size={14} style={{ color: "#A2452F" }} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
