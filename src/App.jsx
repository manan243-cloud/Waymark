import React, { useState, useEffect } from "react";
import { Compass, MapPin, Flag, Plus, X, RotateCcw } from "./icons.jsx";

const localStore = {
  async get(key) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return { key, value: raw };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value };
  },
};

const STORAGE_KEY = "waymark-data-v2";
const CATEGORY_PALETTE = ["#4B8B8C", "#5B7A99", "#8A6D3B", "#C08585", "#5B5EA6", "#7C7C4A", "#C4735B", "#8B6F9E"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function sampleCategories() {
  return [
    { id: "cat-health", name: "Health", color: "#4B8B8C" },
    { id: "cat-career", name: "Career", color: "#5B7A99" },
    { id: "cat-finance", name: "Finance", color: "#8A6D3B" },
    { id: "cat-relationships", name: "Relationships", color: "#C08585" },
  ];
}

function sampleGoals() {
  const iso = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return [
    {
      id: uid(),
      title: "Run a half marathon",
      timeframe: "long",
      deadline: iso(120),
      category: "cat-health",
      tasks: [
        { id: uid(), title: "Build base mileage (15mi/wk)", status: "done", due: iso(-30) },
        { id: uid(), title: "Run first 10K", status: "done", due: iso(-10) },
        { id: uid(), title: "Long run: 12 miles", status: "doing", due: iso(3) },
        { id: uid(), title: "Taper week", status: "todo", due: iso(110) },
      ],
    },
    {
      id: uid(),
      title: "Ship the freelance portfolio site",
      timeframe: "long",
      deadline: iso(45),
      category: "cat-career",
      tasks: [
        { id: uid(), title: "Write case studies", status: "doing", due: iso(-2) },
        { id: uid(), title: "Design homepage", status: "done", due: iso(-15) },
        { id: uid(), title: "Set up hosting", status: "todo", due: iso(20) },
      ],
    },
    {
      id: uid(),
      title: "Finish tax paperwork",
      timeframe: "short",
      deadline: iso(6),
      category: "cat-finance",
      tasks: [
        { id: uid(), title: "Gather receipts", status: "done", due: iso(-3) },
        { id: uid(), title: "Fill out forms", status: "todo", due: iso(4) },
      ],
    },
    {
      id: uid(),
      title: "Plan mom's birthday",
      timeframe: "short",
      deadline: iso(9),
      category: "cat-relationships",
      tasks: [
        { id: uid(), title: "Book restaurant", status: "todo", due: iso(-1) },
        { id: uid(), title: "Order cake", status: "todo", due: iso(6) },
      ],
    },
  ];
}

function sampleStore() {
  return { categories: sampleCategories(), goals: sampleGoals() };
}

function goalProgress(goal) {
  if (!goal.tasks.length) return 0;
  return Math.round((goal.tasks.filter((t) => t.status === "done").length / goal.tasks.length) * 100);
}

function isOverdue(task) {
  return !!task.due && task.due < todayStr() && task.status !== "done";
}

function nextStatus(s) {
  return s === "todo" ? "doing" : s === "doing" ? "done" : "todo";
}

function groupTasks(tasks) {
  const today = todayStr();
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7s = in7.toISOString().slice(0, 10);
  const groups = { Overdue: [], Today: [], "This week": [], Later: [], Done: [] };
  tasks.forEach((t) => {
    if (t.status === "done") groups.Done.push(t);
    else if (t.due && t.due < today) groups.Overdue.push(t);
    else if (t.due === today) groups.Today.push(t);
    else if (t.due && t.due <= in7s) groups["This week"].push(t);
    else groups.Later.push(t);
  });
  return groups;
}

function ElevationHero({ goals }) {
  const slotW = 130;
  const pad = 20;
  const width = goals.length * slotW + pad * 2;
  const height = 170;
  const baseY = height - 30;

  const points = goals.map((g, i) => {
    const prog = goalProgress(g);
    const peakBoost = g.timeframe === "long" ? 95 : 55;
    const peakY = baseY - peakBoost * (0.22 + (prog / 100) * 0.78);
    const x = pad + i * slotW + slotW / 2;
    return { x, y: peakY, g, prog };
  });

  const start = { x: pad, y: baseY };
  const end = { x: width - pad, y: baseY };
  const all = [start, ...points, end];
  let d = `M ${all[0].x},${all[0].y}`;
  for (let i = 0; i < all.length - 1; i++) {
    const cur = all[i];
    const next = all[i + 1];
    const mid = { x: (cur.x + next.x) / 2, y: (cur.y + next.y) / 2 };
    d += ` Q ${cur.x},${cur.y} ${mid.x},${mid.y}`;
  }
  d += ` T ${end.x},${end.y}`;
  const areaPath = `${d} L ${end.x},${baseY} L ${start.x},${baseY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F6B52" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4F6B52" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <line x1={pad} y1={baseY} x2={width - pad} y2={baseY} stroke="#9C9585" strokeWidth="1" />
      <path d={areaPath} fill="url(#skyline)" />
      <path d={d} fill="none" stroke="#26313A" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.prog === 100 ? 5 : 4}
            fill={p.prog === 100 ? "#4F6B52" : "#F7F4EC"}
            stroke="#26313A"
            strokeWidth="1.5"
          />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="#26313A">
            {p.prog}%
          </text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Sans" fill="#26313A">
            {p.g.title.length > 16 ? p.g.title.slice(0, 15) + "…" : p.g.title}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatusDonut({ counts, total }) {
  const size = 108;
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = [
    { key: "done", color: "#4F6B52", value: counts.done },
    { key: "doing", color: "#B8843C", value: counts.doing },
    { key: "todo", color: "#C9C2AF", value: counts.todo },
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DFD1" strokeWidth={stroke} />
        {segments.map((seg) => {
          const frac = total ? seg.value / total : 0;
          const len = frac * c;
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x={size / 2} y={size / 2 - 3} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fill="#26313A">
        {total}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontFamily="IBM Plex Sans" fontSize="9" fill="#6b6355">
        tasks
      </text>
    </svg>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />
      {label}
    </div>
  );
}

function CategoryTag({ category }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#6b6355" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: category ? category.color : "#C9C2AF" }} />
      {category ? category.name : "Unsorted"}
    </span>
  );
}

function GoalCard({ goal, category, showTag, expanded, onToggle, draft, setDraft, addTask, cycleStatus, deleteTask, deleteGoal }) {
  const prog = goalProgress(goal);
  const overdueInGoal = goal.tasks.filter(isOverdue).length;
  return (
    <div className="wm-card rounded-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onToggle} className="text-left flex-1">
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
          </div>
        </button>
        <button onClick={deleteGoal} className="opacity-40 hover:opacity-100 shrink-0">
          <X size={14} />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pl-1 border-l wm-hairline space-y-2">
          {goal.tasks.length === 0 && (
            <p className="text-xs italic pl-3" style={{ color: "#8a8272" }}>
              No steps yet.
            </p>
          )}
          {goal.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 pl-3 group">
              <button
                onClick={() => cycleStatus(t.id)}
                className={`w-3 h-3 rounded-full shrink-0 status-dot-${t.status}`}
                title="Click to change status"
              />
              <span
                className="text-sm flex-1"
                style={{
                  color: t.status === "done" ? "#8a8272" : "#26313A",
                  textDecoration: t.status === "done" ? "line-through" : "none",
                }}
              >
                {t.title}
              </span>
              {t.due && (
                <span className="wm-mono text-xs" style={{ color: isOverdue(t) ? "#A2452F" : "#8a8272" }}>
                  {t.due}
                </span>
              )}
              <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-60 hover:opacity-100 shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pl-3 pt-1">
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

function GoalSection({
  label, sub, timeframe, visibleGoals, categories, activeView, expanded, setExpanded, taskDraft, setTaskDraft,
  addingGoalFor, setAddingGoalFor, newGoalTitle, setNewGoalTitle, newGoalDeadline, setNewGoalDeadline,
  newGoalCategory, setNewGoalCategory, addGoal, addTask, cycleStatus, deleteTask, deleteGoal,
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
            deleteTask={(tid) => deleteTask(g.id, tid)}
            deleteGoal={() => deleteGoal(g.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TrailLog({ tasks, categories, showTag, onCycle, onDelete }) {
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
            {groups[k].map((t) => {
              const cat = categories.find((c) => c.id === t.goalCategory);
              return (
                <div key={t.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => onCycle(t.goalId, t.id)}
                    className={`w-2.5 h-2.5 rounded-full shrink-0 status-dot-${t.status}`}
                  />
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
                  <button
                    onClick={() => onDelete(t.goalId, t.id)}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function NavTabs({ categories, goals, activeView, setActiveView, addingCategory, setAddingCategory, newCategoryName, setNewCategoryName, addCategory, deleteCategory }) {
  const hasUnsorted = goals.some((g) => !g.category);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button
        onClick={() => setActiveView("overview")}
        className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${activeView === "overview" ? "wm-tab-active" : "wm-tab"}`}
      >
        <Compass size={12} /> Overview
      </button>
      {categories.map((c) => (
        <div key={c.id} className="relative group">
          <button
            onClick={() => setActiveView(c.id)}
            className={`text-xs pl-3 pr-2 py-1.5 rounded-full flex items-center gap-1.5 ${activeView === c.id ? "wm-tab-active" : "wm-tab"}`}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.color }} />
            {c.name}
          </button>
          <button
            onClick={() => deleteCategory(c.id)}
            className="absolute -right-1 -top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-70 hover:opacity-100"
            style={{ background: "#26313A", color: "#F7F4EC" }}
            title="Delete category"
          >
            <X size={9} />
          </button>
        </div>
      ))}
      {hasUnsorted && (
        <button
          onClick={() => setActiveView("unsorted")}
          className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${activeView === "unsorted" ? "wm-tab-active" : "wm-tab"}`}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#C9C2AF" }} />
          Unsorted
        </button>
      )}
      {addingCategory ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="wm-input rounded-full px-3 py-1 text-xs w-32"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory(newCategoryName);
              if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); }
            }}
          />
          <button onClick={() => addCategory(newCategoryName)} className="wm-btn rounded-full px-2.5 py-1 text-xs">
            Add
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingCategory(true)} className="wm-btn-ghost w-6 h-6 rounded-full flex items-center justify-center" title="Add category">
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [categories, setCategories] = useState(null);
  const [goals, setGoals] = useState(null);
  const [activeView, setActiveView] = useState("overview");

  const [addingGoalFor, setAddingGoalFor] = useState(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("");
  const [taskDraft, setTaskDraft] = useState({});
  const [expanded, setExpanded] = useState({});

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await localStore.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setCategories(parsed.categories || []);
          setGoals(parsed.goals || []);
        } else {
          const seed = sampleStore();
          setCategories(seed.categories);
          setGoals(seed.goals);
          await localStore.set(STORAGE_KEY, JSON.stringify(seed));
        }
      } catch (e) {
        console.error("Failed to load saved data:", e);
        const seed = sampleStore();
        setCategories(seed.categories);
        setGoals(seed.goals);
      }
    })();
  }, []);

  const persist = async (nextCategories, nextGoals) => {
    setCategories(nextCategories);
    setGoals(nextGoals);
    try {
      const result = await localStore.set(STORAGE_KEY, JSON.stringify({ categories: nextCategories, goals: nextGoals }));
      if (!result) console.error("Save did not confirm — data may not persist.");
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  };

  const addGoal = (timeframe, categoryId) => {
    if (!newGoalTitle.trim()) return;
    const g = { id: uid(), title: newGoalTitle.trim(), timeframe, deadline: newGoalDeadline || "", category: categoryId || null, tasks: [] };
    persist(categories, [...goals, g]);
    setNewGoalTitle("");
    setNewGoalDeadline("");
    setNewGoalCategory("");
    setAddingGoalFor(null);
    setExpanded((prev) => ({ ...prev, [g.id]: true }));
  };

  const addTask = (goalId) => {
    const draft = taskDraft[goalId];
    if (!draft || !draft.title || !draft.title.trim()) return;
    const next = goals.map((g) =>
      g.id === goalId
        ? { ...g, tasks: [...g.tasks, { id: uid(), title: draft.title.trim(), status: "todo", due: draft.due || "" }] }
        : g
    );
    persist(categories, next);
    setTaskDraft((prev) => ({ ...prev, [goalId]: { title: "", due: "" } }));
  };

  const cycleStatus = (goalId, taskId) => {
    const next = goals.map((g) =>
      g.id !== goalId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus(t.status) } : t)) }
    );
    persist(categories, next);
  };

  const deleteTask = (goalId, taskId) => {
    const next = goals.map((g) => (g.id !== goalId ? g : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) }));
    persist(categories, next);
  };

  const deleteGoal = (goalId) => {
    persist(categories, goals.filter((g) => g.id !== goalId));
  };

  const addCategory = (name) => {
    if (!name.trim()) return;
    const color = CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length];
    const c = { id: uid(), name: name.trim(), color };
    persist([...categories, c], goals);
    setNewCategoryName("");
    setAddingCategory(false);
    setActiveView(c.id);
  };

  const deleteCategory = (id) => {
    const nextGoals = goals.map((g) => (g.category === id ? { ...g, category: null } : g));
    const nextCategories = categories.filter((c) => c.id !== id);
    persist(nextCategories, nextGoals);
    if (activeView === id) setActiveView("overview");
  };

  const resetData = () => {
    const seed = sampleStore();
    persist(seed.categories, seed.goals);
    setActiveView("overview");
  };

  const loading = categories === null || goals === null;
  const currentCategory = !loading ? categories.find((c) => c.id === activeView) || null : null;
  const visibleGoals = loading
    ? []
    : activeView === "overview"
    ? goals
    : activeView === "unsorted"
    ? goals.filter((g) => !g.category)
    : goals.filter((g) => g.category === activeView);

  return (
    <div className="wm-root min-h-screen p-6 md:p-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .wm-root { background:#EFEBE0; color:#26313A; font-family:'IBM Plex Sans', sans-serif; }
        .wm-display { font-family:'Fraunces', serif; }
        .wm-mono { font-family:'IBM Plex Mono', monospace; }
        .wm-card { background:#F7F4EC; border:1px solid #DCD5C4; }
        .wm-hairline { border-color:#DCD5C4; }
        .wm-btn { background:#26313A; color:#F7F4EC; transition:background .15s; }
        .wm-btn:hover { background:#3a4854; }
        .wm-btn-ghost { border:1px solid #26313A40; color:#26313A; background:transparent; transition:background .15s; }
        .wm-btn-ghost:hover { background:#26313A0d; }
        .wm-input { background:#FBF9F3; border:1px solid #DCD5C4; color:#26313A; }
        .wm-input:focus { outline:2px solid #4F6B52; outline-offset:1px; }
        .wm-tab { background:transparent; border:1px solid #DCD5C4; color:#26313A; transition:background .15s; }
        .wm-tab:hover { background:#26313A0d; }
        .wm-tab-active { background:#26313A; border:1px solid #26313A; color:#F7F4EC; }
        .status-dot-todo { background:#C9C2AF; }
        .status-dot-doing { background:#B8843C; }
        .status-dot-done { background:#4F6B52; }
        .wm-track { background:#E4DFD1; }
      `}</style>

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p className="wm-mono text-sm">Loading your trail…</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <header className="flex items-start justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass size={22} strokeWidth={1.5} />
                <h1 className="wm-display text-3xl" style={{ fontWeight: 600 }}>Waymark</h1>
              </div>
              <p className="text-sm" style={{ color: "#6b6355" }}>
                {activeView === "overview"
                  ? "Where your goals stand, and what's next on the trail."
                  : activeView === "unsorted"
                  ? "Goals without a category."
                  : `Your ${currentCategory ? currentCategory.name : ""} goals, at a glance.`}
              </p>
            </div>
            <button onClick={resetData} className="wm-btn-ghost text-xs px-3 py-1.5 rounded-sm flex items-center gap-1 shrink-0">
              <RotateCcw size={13} /> Restore sample data
            </button>
          </header>

          <NavTabs
            categories={categories} goals={goals} activeView={activeView} setActiveView={setActiveView}
            addingCategory={addingCategory} setAddingCategory={setAddingCategory}
            newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
            addCategory={addCategory} deleteCategory={deleteCategory}
          />

          <section className="wm-card rounded-sm p-4 md:p-6 mb-8 overflow-x-auto">
            {visibleGoals.length > 0 ? (
              <ElevationHero goals={visibleGoals} />
            ) : (
              <p className="text-sm italic py-10 text-center" style={{ color: "#8a8272" }}>
                No goals here yet — add an expedition or waypoint below.
              </p>
            )}
          </section>

          {(() => {
            const allTasks = visibleGoals.flatMap((g) => g.tasks.map((t) => ({ ...t, goalTitle: g.title, goalId: g.id, goalCategory: g.category })));
            const counts = {
              done: allTasks.filter((t) => t.status === "done").length,
              doing: allTasks.filter((t) => t.status === "doing").length,
              todo: allTasks.filter((t) => t.status === "todo").length,
            };
            const overdueCount = allTasks.filter(isOverdue).length;
            const total = allTasks.length;
            const showTag = activeView === "overview";

            return (
              <>
                <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total tasks", value: total },
                    { label: "Done", value: counts.done },
                    { label: "In progress", value: counts.doing },
                    { label: "Overdue", value: overdueCount, alert: overdueCount > 0 },
                  ].map((s, i) => (
                    <div key={i} className="wm-card rounded-sm p-4">
                      <div className="wm-mono text-2xl" style={{ color: s.alert ? "#A2452F" : "#26313A" }}>{s.value}</div>
                      <div className="text-xs mt-1" style={{ color: "#6b6355" }}>{s.label}</div>
                    </div>
                  ))}
                </section>

                <div className="grid md:grid-cols-5 gap-6">
                  <div className="md:col-span-3 space-y-8">
                    <GoalSection
                      label="Expeditions" sub="Long-term goals" timeframe="long"
                      visibleGoals={visibleGoals} categories={categories} activeView={activeView}
                      expanded={expanded} setExpanded={setExpanded} taskDraft={taskDraft} setTaskDraft={setTaskDraft}
                      addingGoalFor={addingGoalFor} setAddingGoalFor={setAddingGoalFor}
                      newGoalTitle={newGoalTitle} setNewGoalTitle={setNewGoalTitle}
                      newGoalDeadline={newGoalDeadline} setNewGoalDeadline={setNewGoalDeadline}
                      newGoalCategory={newGoalCategory} setNewGoalCategory={setNewGoalCategory}
                      addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus} deleteTask={deleteTask} deleteGoal={deleteGoal}
                    />
                    <GoalSection
                      label="Waypoints" sub="Short-term goals" timeframe="short"
                      visibleGoals={visibleGoals} categories={categories} activeView={activeView}
                      expanded={expanded} setExpanded={setExpanded} taskDraft={taskDraft} setTaskDraft={setTaskDraft}
                      addingGoalFor={addingGoalFor} setAddingGoalFor={setAddingGoalFor}
                      newGoalTitle={newGoalTitle} setNewGoalTitle={setNewGoalTitle}
                      newGoalDeadline={newGoalDeadline} setNewGoalDeadline={setNewGoalDeadline}
                      newGoalCategory={newGoalCategory} setNewGoalCategory={setNewGoalCategory}
                      addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus} deleteTask={deleteTask} deleteGoal={deleteGoal}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="wm-card rounded-sm p-5">
                      <div className="flex items-center gap-4 mb-5">
                        <StatusDonut counts={counts} total={total} />
                        <div className="text-xs space-y-1.5">
                          <Legend color="#4F6B52" label={`Done · ${counts.done}`} />
                          <Legend color="#B8843C" label={`In progress · ${counts.doing}`} />
                          <Legend color="#C9C2AF" label={`Not started · ${counts.todo}`} />
                        </div>
                      </div>
                      <h2 className="wm-display text-lg mb-3">Trail log</h2>
                      <TrailLog tasks={allTasks} categories={categories} showTag={showTag} onCycle={cycleStatus} onDelete={deleteTask} />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
