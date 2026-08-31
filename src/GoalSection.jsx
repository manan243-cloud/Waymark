import React from "react";
import { Plus } from "./icons.jsx";
import GoalCard from "./GoalCard.jsx";

export default function GoalSection({
  label, sub, timeframe, visibleGoals, categories, activeView, expanded, setExpanded, taskDraft, setTaskDraft,
  addingGoalFor, setAddingGoalFor, newGoalTitle, setNewGoalTitle, newGoalDeadline, setNewGoalDeadline,
  newGoalCategory, setNewGoalCategory, addGoal, addTask, cycleStatus, onGoalMenu, onTaskMenu,
}) {
  const list = visibleGoals.filter((g) => g.timeframe === timeframe);
  const showPicker = activeView === "overview";
  const forcedCategory = activeView === "overview" || activeView === "unsorted" ? null : activeView;
  const showTag = activeView === "overview";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="wm-display text-xl">{label}</h2>
          <p className="text-xs" style={{ color: "#6b6355" }}>{sub}</p>
        </div>
        <button
          onClick={() => setAddingGoalFor(addingGoalFor === timeframe ? null : timeframe)}
          className="wm-btn-ghost text-xs px-3 py-1.5 rounded-sm flex items-center gap-1"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {addingGoalFor === timeframe && (
        <div className="wm-card rounded-sm p-3 mb-3 flex flex-col sm:flex-row gap-2">
          <input
            autoFocus
            className="wm-input rounded-sm px-2 py-1.5 text-sm flex-1 min-w-0"
            placeholder={timeframe === "long" ? "e.g. Learn to sail" : "e.g. Renew passport"}
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addGoal(timeframe, showPicker ? newGoalCategory || null : forcedCategory);
            }}
          />
          {showPicker && categories.length > 0 && (
            <select
              className="wm-input rounded-sm px-2 py-1.5 text-sm"
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value)}
            >
              <option value="">Unsorted</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            className="wm-input rounded-sm px-2 py-1.5 text-sm wm-mono"
            value={newGoalDeadline}
            onChange={(e) => setNewGoalDeadline(e.target.value)}
          />
          <button
            onClick={() => addGoal(timeframe, showPicker ? newGoalCategory || null : forcedCategory)}
            className="wm-btn rounded-sm px-3 py-1.5 text-sm shrink-0"
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-3">
        {list.length === 0 && (
          <p className="text-sm italic" style={{ color: "#8a8272" }}>
            No {label.toLowerCase()} here yet.
          </p>
        )}
        {list.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            category={categories.find((c) => c.id === g.category) || null}
            showTag={showTag}
            expanded={!!expanded[g.id]}
            onToggle={() => setExpanded((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
            draft={taskDraft[g.id] || { title: "", due: "" }}
            setDraft={(d) => setTaskDraft((prev) => ({ ...prev, [g.id]: d }))}
            addTask={() => addTask(g.id)}
            cycleStatus={(tid) => cycleStatus(g.id, tid)}
            onGoalMenu={() => onGoalMenu(g.id)}
            onTaskMenu={(tid) => onTaskMenu(g.id, tid)}
          />
        ))}
      </div>
    </div>
  );
}
