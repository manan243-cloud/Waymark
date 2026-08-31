import React, { useState, useEffect } from "react";
import { Compass, Menu, RotateCcw, Plus } from "./icons.jsx";
import { ElevationHero, StatusDonut, Legend } from "./Charts.jsx";
import CategoryProgress from "./CategoryProgress.jsx";
import GoalSection from "./GoalSection.jsx";
import NavTabs from "./NavTabs.jsx";
import LifeLog from "./LifeLog.jsx";
import ActionSheet from "./ActionSheet.jsx";
import FormSheet from "./FormSheet.jsx";
import { useLongPress } from "./hooks.js";
import { uid, sampleStore, goalProgress, isOverdue, nextStatus } from "./utils.js";

const STORAGE_KEY = "waymark-data-v2";
const CATEGORY_PALETTE = ["#4B8B8C", "#5B7A99", "#8A6D3B", "#C08585", "#5B5EA6", "#7C7C4A", "#C4735B", "#8B6F9E"];

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

  // menu = { kind: 'category'|'goal'|'task'|'app', id, goalId? }
  const [menu, setMenu] = useState(null);
  // form = { kind, id, goalId?, initial }
  const [form, setForm] = useState(null);

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

  // ---------- goals & tasks ----------

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

  const setTaskStatus = (goalId, taskId, status) => {
    const next = goals.map((g) =>
      g.id !== goalId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }
    );
    persist(categories, next);
  };

  const updateTask = (goalId, taskId, patch) => {
    const next = goals.map((g) =>
      g.id !== goalId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
    );
    persist(categories, next);
  };

  const reassignTask = (fromGoalId, taskId, toGoalId) => {
    if (fromGoalId === toGoalId) return;
    const fromGoal = goals.find((g) => g.id === fromGoalId);
    const task = fromGoal && fromGoal.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = goals.map((g) => {
      if (g.id === fromGoalId) return { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) };
      if (g.id === toGoalId) return { ...g, tasks: [...g.tasks, task] };
      return g;
    });
    persist(categories, next);
    setExpanded((prev) => ({ ...prev, [toGoalId]: true }));
  };

  const deleteTask = (goalId, taskId) => {
    const next = goals.map((g) => (g.id !== goalId ? g : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) }));
    persist(categories, next);
  };

  const updateGoal = (goalId, patch) => {
    persist(categories, goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)));
  };

  const toggleGoalTimeframe = (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { timeframe: goal.timeframe === "long" ? "short" : "long" });
  };

  const deleteGoal = (goalId) => {
    persist(categories, goals.filter((g) => g.id !== goalId));
  };

  // ---------- categories ----------

  const addCategory = (name) => {
    if (!name.trim()) return;
    const color = CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length];
    const c = { id: uid(), name: name.trim(), color };
    persist([...categories, c], goals);
    setNewCategoryName("");
    setAddingCategory(false);
    setActiveView(c.id);
  };

  const renameCategory = (id, name) => {
    if (!name.trim()) return;
    persist(categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)), goals);
  };

  const moveCategory = (id, direction) => {
    const idx = categories.findIndex((c) => c.id === id);
    const newIdx = idx + direction;
    if (idx < 0 || newIdx < 0 || newIdx >= categories.length) return;
    const next = [...categories];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    persist(next, goals);
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

  // ---------- confirmations ----------

  const confirmAndDeleteCategory = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (window.confirm(`Delete "${cat ? cat.name : "this category"}"? Its goals will become unsorted, not deleted.`)) {
      deleteCategory(id);
    }
  };

  const confirmAndDeleteGoal = (goalId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (window.confirm(`Delete "${goal ? goal.title : "this goal"}" and all of its steps? This can't be undone.`)) {
      deleteGoal(goalId);
    }
  };

  const confirmAndDeleteTask = (goalId, taskId) => {
    if (window.confirm("Delete this step? This can't be undone.")) {
      deleteTask(goalId, taskId);
    }
  };

  const confirmAndResetData = () => {
    if (window.confirm("Restore sample data? This replaces everything currently in Waymark and can't be undone.")) {
      resetData();
    }
  };

  // ---------- menu / form wiring ----------

  const closeMenu = () => setMenu(null);
  const closeForm = () => setForm(null);

  const getMenuProps = () => {
    if (!menu) return { open: false, actions: [] };

    if (menu.kind === "app") {
      return {
        open: true,
        title: "Waymark",
        actions: [
          { label: "Add a category", onClick: () => setAddingCategory(true) },
          { divider: true },
          { label: "Restore sample data", danger: true, icon: <RotateCcw size={15} />, onClick: confirmAndResetData },
        ],
      };
    }

    if (menu.kind === "category") {
      const idx = categories.findIndex((c) => c.id === menu.id);
      const cat = categories[idx];
      if (!cat) return { open: false, actions: [] };
      return {
        open: true,
        title: cat.name,
        actions: [
          { label: "Rename", onClick: () => setForm({ kind: "rename-category", id: cat.id, initial: { name: cat.name } }) },
          { label: "Move earlier", disabled: idx === 0, onClick: () => moveCategory(cat.id, -1) },
          { label: "Move later", disabled: idx === categories.length - 1, onClick: () => moveCategory(cat.id, 1) },
          { divider: true },
          { label: "Delete category", danger: true, onClick: () => confirmAndDeleteCategory(cat.id) },
        ],
      };
    }

    if (menu.kind === "goal") {
      const goal = goals.find((g) => g.id === menu.id);
      if (!goal) return { open: false, actions: [] };
      return {
        open: true,
        title: goal.title,
        subtitle: goal.timeframe === "long" ? "Expedition" : "Waypoint",
        actions: [
          { label: "Edit details", onClick: () => setForm({ kind: "edit-goal", id: goal.id, initial: { title: goal.title, deadline: goal.deadline || "" } }) },
          { label: "Reassign category", onClick: () => setForm({ kind: "reassign-goal-category", id: goal.id, initial: { category: goal.category || "" } }) },
          { label: goal.timeframe === "long" ? "Move to Waypoints" : "Move to Expeditions", onClick: () => toggleGoalTimeframe(goal.id) },
          { divider: true },
          { label: "Delete goal", danger: true, onClick: () => confirmAndDeleteGoal(goal.id) },
        ],
      };
    }

    if (menu.kind === "task") {
      const goal = goals.find((g) => g.id === menu.goalId);
      const task = goal && goal.tasks.find((t) => t.id === menu.id);
      if (!goal || !task) return { open: false, actions: [] };
      return {
        open: true,
        title: task.title,
        subtitle: `From "${goal.title}"`,
        actions: [
          { label: "Mark not started", disabled: task.status === "todo", onClick: () => setTaskStatus(goal.id, task.id, "todo") },
          { label: "Mark in progress", disabled: task.status === "doing", onClick: () => setTaskStatus(goal.id, task.id, "doing") },
          { label: "Mark done", disabled: task.status === "done", onClick: () => setTaskStatus(goal.id, task.id, "done") },
          { divider: true },
          { label: "Edit", onClick: () => setForm({ kind: "edit-task", goalId: goal.id, id: task.id, initial: { title: task.title, due: task.due || "" } }) },
          {
            label: "Reassign to another goal",
            disabled: goals.length < 2,
            onClick: () => setForm({ kind: "reassign-task-goal", goalId: goal.id, id: task.id, initial: { targetGoal: goal.id } }),
          },
          { divider: true },
          { label: "Delete step", danger: true, onClick: () => confirmAndDeleteTask(goal.id, task.id) },
        ],
      };
    }

    return { open: false, actions: [] };
  };

  const getFormProps = () => {
    if (!form) return { open: false, fields: [] };

    if (form.kind === "rename-category") {
      return {
        open: true,
        title: "Rename category",
        fields: [{ key: "name", type: "text", autoFocus: true, placeholder: "Category name" }],
        initial: form.initial,
        onSubmit: (v) => renameCategory(form.id, v.name || ""),
      };
    }

    if (form.kind === "edit-goal") {
      return {
        open: true,
        title: "Edit goal",
        fields: [
          { key: "title", label: "Title", type: "text", autoFocus: true },
          { key: "deadline", label: "Deadline", type: "date" },
        ],
        initial: form.initial,
        onSubmit: (v) => updateGoal(form.id, { title: (v.title || "").trim() || form.initial.title, deadline: v.deadline || "" }),
      };
    }

    if (form.kind === "reassign-goal-category") {
      return {
        open: true,
        title: "Reassign category",
        fields: [
          {
            key: "category",
            label: "Category",
            type: "select",
            options: [{ value: "", label: "Unsorted" }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
          },
        ],
        initial: form.initial,
        onSubmit: (v) => updateGoal(form.id, { category: v.category || null }),
      };
    }

    if (form.kind === "edit-task") {
      return {
        open: true,
        title: "Edit step",
        fields: [
          { key: "title", label: "Title", type: "text", autoFocus: true },
          { key: "due", label: "Due date", type: "date" },
        ],
        initial: form.initial,
        onSubmit: (v) => updateTask(form.goalId, form.id, { title: (v.title || "").trim() || form.initial.title, due: v.due || "" }),
      };
    }

    if (form.kind === "reassign-task-goal") {
      return {
        open: true,
        title: "Reassign step",
        fields: [
          {
            key: "targetGoal",
            label: "Move to goal",
            type: "select",
            options: goals.map((g) => ({ value: g.id, label: `${g.timeframe === "long" ? "Expedition" : "Waypoint"} — ${g.title}` })),
          },
        ],
        initial: form.initial,
        onSubmit: (v) => reassignTask(form.goalId, form.id, v.targetGoal),
      };
    }

    return { open: false, fields: [] };
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

  const appMenuLongPress = useLongPress(() => setMenu({ kind: "app" }), () => setMenu({ kind: "app" }));

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
            <button
              {...appMenuLongPress}
              className="wm-btn-ghost w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
              title="Menu"
            >
              <Menu size={17} />
            </button>
          </header>

          <NavTabs
            categories={categories} goals={goals} activeView={activeView} setActiveView={setActiveView}
            addingCategory={addingCategory} setAddingCategory={setAddingCategory}
            newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
            addCategory={addCategory}
            onCategoryMenu={(id) => setMenu({ kind: "category", id })}
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

          {activeView === "overview" && (
            <CategoryProgress categories={categories} goals={goals} onSelect={setActiveView} />
          )}

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
                      addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus}
                      onGoalMenu={(id) => setMenu({ kind: "goal", id })}
                      onTaskMenu={(goalId, id) => setMenu({ kind: "task", goalId, id })}
                    />
                    <GoalSection
                      label="Waypoints" sub="Short-term goals" timeframe="short"
                      visibleGoals={visibleGoals} categories={categories} activeView={activeView}
                      expanded={expanded} setExpanded={setExpanded} taskDraft={taskDraft} setTaskDraft={setTaskDraft}
                      addingGoalFor={addingGoalFor} setAddingGoalFor={setAddingGoalFor}
                      newGoalTitle={newGoalTitle} setNewGoalTitle={setNewGoalTitle}
                      newGoalDeadline={newGoalDeadline} setNewGoalDeadline={setNewGoalDeadline}
                      newGoalCategory={newGoalCategory} setNewGoalCategory={setNewGoalCategory}
                      addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus}
                      onGoalMenu={(id) => setMenu({ kind: "goal", id })}
                      onTaskMenu={(goalId, id) => setMenu({ kind: "task", goalId, id })}
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
                      <h2 className="wm-display text-lg mb-3">Life log</h2>
                      <LifeLog
                        tasks={allTasks} categories={categories} showTag={showTag}
                        onCycle={cycleStatus}
                        onMenu={(goalId, id) => setMenu({ kind: "task", goalId, id })}
                      />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <ActionSheet {...getMenuProps()} onClose={closeMenu} />
      <FormSheet {...getFormProps()} onClose={closeForm} />
    </div>
  );
}
