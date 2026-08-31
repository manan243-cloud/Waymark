import React from "react";
import { MoreVertical } from "./icons.jsx";
import StatusBox from "./StatusBox.jsx";
import { useLongPress } from "./hooks.js";
import { groupTasks } from "./utils.js";

function LogRow({ t, showTag, cat, onCycle, onMenu }) {
  const lp = useLongPress(onMenu, null);
  return (
    <div {...lp} className="flex items-center gap-2 select-none">
      <StatusBox size={15} status={t.status} onClick={(e) => { e.stopPropagation(); onCycle(); }} />
      <span
        className="text-sm flex-1 truncate"
        style={{
          color: t.status === "done" ? "#8a8272" : "#26313A",
          textDecoration: t.status === "done" ? "line-through" : "none",
        }}
      >
        {t.title}
      </span>
      {showTag && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
          style={{ background: cat ? cat.color : "#C9C2AF" }}
          title={cat ? cat.name : "Unsorted"}
        />
      )}
      <span className="text-xs truncate max-w-[80px] shrink-0" style={{ color: "#8a8272" }}>
        {t.goalTitle}
      </span>
      <button onClick={onMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
        <MoreVertical size={12} />
      </button>
    </div>
  );
}

export default function LifeLog({ tasks, categories, showTag, onCycle, onMenu }) {
  const groups = groupTasks(tasks);
  const order = ["Overdue", "Today", "This week", "Later", "Done"];
  const active = order.filter((k) => groups[k].length);
  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
      {active.length === 0 && (
        <p className="text-sm italic" style={{ color: "#8a8272" }}>
          No tasks here yet — add a step to a goal to see it here.
        </p>
      )}
      {active.map((k) => (
        <div key={k}>
          <div className="text-xs mb-1.5" style={{ color: k === "Overdue" ? "#A2452F" : "#8a8272" }}>
            {k} · {groups[k].length}
          </div>
          <div className="space-y-1.5">
            {groups[k].map((t) => (
              <LogRow
                key={t.id}
                t={t}
                showTag={showTag}
                cat={categories.find((c) => c.id === t.goalCategory)}
                onCycle={() => onCycle(t.goalId, t.id)}
                onMenu={() => onMenu(t.goalId, t.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
