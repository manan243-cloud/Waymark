import React from "react";
import { Flag, MapPin, MoreVertical, AlertTriangle, Repeat, Check, X } from "./icons.jsx";
import { CategoryTag } from "./Charts.jsx";
import StatusBox from "./StatusBox.jsx";
import { useLongPress, useSwipe } from "./hooks.js";
import { goalProgress, isOverdue, isUrgent, goalNeedsAttention } from "./utils.js";

function TaskRow({ task, onCycle, onMarkDone, onMenu }) {
  const lp = useLongPress(onMenu, null);
  const swipe = useSwipe(
    () => task.status !== "done" && onMarkDone(),
    () => onMenu()
  );
  const overdue = isOverdue(task);
  const urgent = !overdue && isUrgent(task);
  const done = task.status === "done";

  return (
    <div className="relative overflow-hidden rounded-sm">
      {swipe.offset !== 0 && (
        <div
          className="absolute inset-0 flex items-center rounded-sm"
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
        {...swipe.handlers}
        className="relative flex items-center gap-2 pl-3 py-1 select-none touch-pan-y"
        style={{ transform: `translateX(${swipe.offset}px)`, background: "#F7F4EC", opacity: done ? 0.65 : 1 }}
      >
        <StatusBox status={task.status} onClick={(e) => { e.stopPropagation(); onCycle(); }} />
        <span
          className="text-sm flex-1"
          style={{
            color: done ? "#8a8272" : task.status === "failed" ? "#A2452F" : "#26313A",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </span>
        {task.recurrence && task.recurrence !== "none" && <Repeat size={11} style={{ color: "#6b6355" }} />}
        {task.notes && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#9C9585" }} title="Has notes" />}
        {task.due && (
          <span className="flex items-center gap-1">
            {urgent && <Flag size={11} strokeWidth={2} style={{ color: "#B8843C" }} />}
            <span
              className="wm-mono text-xs"
              style={{ color: overdue ? "#A2452F" : urgent ? "#B8843C" : "#8a8272", fontWeight: urgent ? 600 : 400 }}
            >
              {task.due}
            </span>
          </span>
        )}
        <button onClick={onMenu} className="opacity-40 hover:opacity-100 shrink-0 p-0.5">
          <MoreVertical size={13} />
        </button>
      </div>
    </div>
  );
}

export default function GoalCard({ goal, category, showTag, expanded, onToggle, draft, setDraft, addTask, cycleStatus, onMarkTaskDone, onGoalMenu, onTaskMenu }) {
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
          {goal.notes && (
            <p className="text-xs mt-1 line-clamp-1" style={{ color: "#6b6355" }}>
              {goal.notes}
            </p>
          )}
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
              onMarkDone={() => onMarkTaskDone(t.id)}
              onMenu={() => onTaskMenu(t.id)}
            />
          ))}
          <div className="flex flex-wrap gap-2 pl-3 pt-2">
            <input
              className="wm-input rounded-sm px-2 py-1 text-xs flex-1 min-w-[120px]"
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
            <select
              className="wm-input rounded-sm px-2 py-1 text-xs"
              value={draft.recurrence || "none"}
              onChange={(e) => setDraft({ ...draft, recurrence: e.target.value })}
              title="Repeats"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button onClick={addTask} className="wm-btn rounded-sm px-2 py-1 text-xs shrink-0">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
