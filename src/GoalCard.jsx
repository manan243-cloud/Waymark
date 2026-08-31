import React from "react";
import { Flag, MapPin, MoreVertical, AlertTriangle } from "./icons.jsx";
import { CategoryTag } from "./Charts.jsx";
import StatusBox from "./StatusBox.jsx";
import { useLongPress } from "./hooks.js";
import { goalProgress, isOverdue, goalNeedsAttention } from "./utils.js";

function TaskRow({ task, onCycle, onMenu }) {
  const lp = useLongPress(onMenu, null);
  return (
    <div {...lp} className="flex items-center gap-2 pl-3 py-0.5 select-none">
      <StatusBox status={task.status} onClick={(e) => { e.stopPropagation(); onCycle(); }} />
      <span
        className="text-sm flex-1"
        style={{
          color: task.status === "done" ? "#8a8272" : task.status === "failed" ? "#A2452F" : "#26313A",
          textDecoration: task.status === "done" ? "line-through" : "none",
        }}
      >
        {task.title}
      </span>
      {task.due && (
        <span className="wm-mono text-xs" style={{ color: isOverdue(task) ? "#A2452F" : "#8a8272" }}>
          {task.due}
        </span>
      )}
      <button onClick={onMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
        <MoreVertical size={13} />
      </button>
    </div>
  );
}

export default function GoalCard({ goal, category, showTag, expanded, onToggle, draft, setDraft, addTask, cycleStatus, onGoalMenu, onTaskMenu }) {
  const prog = goalProgress(goal);
  const overdueInGoal = goal.tasks.filter(isOverdue).length;
  const attention = !overdueInGoal && goalNeedsAttention(goal);
  const lp = useLongPress(onGoalMenu, onToggle);

  return (
    <div className="wm-card rounded-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div {...lp} className="text-left flex-1 select-none cursor-pointer">
          <div className="flex items-center gap-2 flex-wrap">
            {goal.timeframe === "long" ? <Flag size={14} /> : <MapPin size={14} />}
            <span className="text-sm font-medium">{goal.title}</span>
            {showTag && <CategoryTag category={category} />}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="h-1.5 wm-track rounded-full overflow-hidden w-32">
              <div
                className="h-full"
                style={{ width: `${prog}%`, background: prog === 100 ? "#4F6B52" : "#B8843C" }}
              />
            </div>
            <span className="wm-mono text-xs" style={{ color: "#6b6355" }}>
              {prog}%
            </span>
            {goal.deadline && (
              <span className="wm-mono text-xs" style={{ color: "#6b6355" }}>
                · {goal.deadline}
              </span>
            )}
            {overdueInGoal > 0 && (
              <span className="text-xs" style={{ color: "#A2452F" }}>
                · {overdueInGoal} overdue
              </span>
            )}
            {attention && (
              <span className="text-xs flex items-center gap-1" style={{ color: "#A2452F" }}>
                <AlertTriangle size={11} /> Needs attention
              </span>
            )}
          </div>
        </div>
        <button onClick={onGoalMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
          <MoreVertical size={15} />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pl-1 border-l wm-hairline space-y-1">
          {goal.tasks.length === 0 && (
            <p className="text-xs italic pl-3" style={{ color: "#8a8272" }}>
              No steps yet.
            </p>
          )}
          {goal.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onCycle={() => cycleStatus(t.id)}
              onMenu={() => onTaskMenu(t.id)}
            />
          ))}
          <div className="flex gap-2 pl-3 pt-2">
            <input
              className="wm-input rounded-sm px-2 py-1 text-xs flex-1 min-w-0"
              placeholder="Add a step…"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
            />
            <input
              type="date"
              className="wm-input rounded-sm px-2 py-1 text-xs wm-mono"
              value={draft.due}
              onChange={(e) => setDraft({ ...draft, due: e.target.value })}
            />
            <button onClick={addTask} className="wm-btn rounded-sm px-2 py-1 text-xs shrink-0">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
