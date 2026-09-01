import React, { useState, useEffect, useRef } from "react";
import { Compass, Menu, RotateCcw, Search, Archive as ArchiveIcon, Layers, X } from "./icons.jsx";
import { StatusDonut, Legend } from "./Charts.jsx";
import CategoryProgress from "./CategoryProgress.jsx";
import GoalSection from "./GoalSection.jsx";
import GoalCard from "./GoalCard.jsx";
import NavTabs from "./NavTabs.jsx";
import TaskListSheet from "./TaskListSheet.jsx";
import ArchiveSheet from "./ArchiveSheet.jsx";
import TemplatesSheet from "./TemplatesSheet.jsx";
import UndoToast from "./UndoToast.jsx";
import ActionSheet from "./ActionSheet.jsx";
import FormSheet from "./FormSheet.jsx";
import { useLongPress } from "./hooks.js";
import {
  uid, sampleStore, todayStr, addDaysStr, isOverdue, isDueThisWeek, nextStatus,
  advanceDate, logActivity, computeCounts, RECURRENCE_LABEL,
} from "./utils.js";

const STORAGE_KEY = "waymark-data-v2";
const CATEGORY_PALETTE = ["#4B8B8C", "#5B7A99", "#8A6D3B", "#C08585", "#5B5EA6", "#7C7C4A", "#C4735B", "#8B6F9E"];
const RECURRENCE_OPTIONS = Object.entries(RECURRENCE_LABEL).map(([value, label]) => ({ value, label }));

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

const writeAll = async (obj) => {
  try {
    const result = await localStore.set(STORAGE_KEY, JSON.stringify(obj));
    if (!result) console.error("Save did not confirm — data may not persist.");
  } catch (e) {
    console.error("Failed to save data:", e);
  }
};

export default function App() {
  const [categories, setCategories] = useState(null);
  const [goals, setGoals] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [reviewBanner, setReviewBanner] = useState(null);
  const [activeView, setActiveView] = useState("overview");

  const [addingGoalFor, setAddingGoalFor] = useState(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("");
  const [taskDraft, setTaskDraft] = useState({});
  const [expanded, setExpanded] = useState({});

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [menu, setMenu] = useState(null);
  const [form, setForm] = useState(null);
  const [taskListKey, setTaskListKey] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [undo, setUndo] = useState(null);

  const goalsRef = useRef([]);
  const categoriesRef = useRef([]);
  const undoTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => { goalsRef.current = goals || []; }, [goals]);
  useEffect(() => { categoriesRef.current = categories || []; }, [categories]);

  useEffect(() => {
    (async () => {
      try {
        const res = await localStore.get(STORAGE_KEY);
        let data;
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          data = {
            categories: parsed.categories || [],
            goals: parsed.goals || [],
            activityLog: parsed.activityLog || [],
            templates: parsed.templates || [],
            weekly: parsed.weekly || null,
          };
        } else {
          data = sampleStore();
        }

        // Weekly review: compare current counts to a snapshot taken at
        // least 7 days ago, then refresh the snapshot to today.
        const counts = computeCounts(data.goals);
        if (!data.weekly) {
          data = { ...data, weekly: { date: todayStr(), ...counts } };
        } else if (data.weekly.date <= addDaysStr(-7)) {
          setReviewBanner({ doneDelta: counts.done - data.weekly.done, failedDelta: counts.failed - data.weekly.failed });
          data = { ...data, weekly: { date: todayStr(), ...counts } };
        }

        setCategories(data.categories);
        setGoals(data.goals);
        setActivityLog(data.activityLog);
        setTemplates(data.templates);
        setWeekly(data.weekly);
        await writeAll(data);
      } catch (e) {
        console.error("Failed to load saved data:", e);
        const seed = sampleStore();
        setCategories(seed.categories);
        setGoals(seed.goals);
        setActivityLog(seed.activityLog);
        setTemplates(seed.templates);
        setWeekly(seed.weekly);
      }
    })();
  }, []);

  const persist = async (nextCategories, nextGoals, extra = {}) => {
    const nextActivityLog = extra.activityLog !== undefined ? extra.activityLog : activityLog;
    const nextTemplates = extra.templates !== undefined ? extra.templates : templates;
    const nextWeekly = extra.weekly !== undefined ? extra.weekly : weekly;
    setCategories(nextCategories);
    setGoals(nextGoals);
    if (extra.activityLog !== undefined) setActivityLog(nextActivityLog);
    if (extra.templates !== undefined) setTemplates(nextTemplates);
    if (extra.weekly !== undefined) setWeekly(nextWeekly);
    await writeAll({ categories: nextCategories, goals: nextGoals, activityLog: nextActivityLog, templates: nextTemplates, weekly: nextWeekly });
  };

  // ---------- undo ----------

  const showUndo = (message, restore) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndo({ message, restore });
    undoTimerRef.current = setTimeout(() => setUndo(null), 5000);
  };
  const runUndo = () => {
    if (undo) undo.restore();
    setUndo(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  // ---------- goals & tasks ----------

  const addGoal = (timeframe, categoryId) => {
    if (!newGoalTitle.trim()) return;
    const g = { id: uid(), title: newGoalTitle.trim(), timeframe, deadline: newGoalDeadline || "", category: categoryId || null, archived: false, notes: "", tasks: [] };
    persist(categoriesRef.current, [...goalsRef.current, g], { activityLog: logActivity(activityLog, categoryId) });
    setNewGoalTitle("");
    setNewGoalDeadline("");
    setNewGoalCategory("");
    setAddingGoalFor(null);
    setExpanded((prev) => ({ ...prev, [g.id]: true }));
  };

  const addTask = (goalId) => {
    const draft = taskDraft[goalId];
    if (!draft || !draft.title || !draft.title.trim()) return;
    const goal = goalsRef.current.find((g) => g.id === goalId);
    const next = goalsRef.current.map((g) =>
      g.id === goalId
        ? { ...g, tasks: [...g.tasks, { id: uid(), title: draft.title.trim(), status: "todo", due: draft.due || "", recurrence: draft.recurrence || "none", notes: "" }] }
        : g
    );
    persist(categoriesRef.current, next, { activityLog: logActivity(activityLog, goal ? goal.category : null) });
    setTaskDraft((prev) => ({ ...prev, [goalId]: { title: "", due: "", recurrence: "none" } }));
  };

  const applyTaskStatus = (goalId, taskId, status) => {
    let categoryId = null;
    const next = goalsRef.current.map((g) => {
      if (g.id !== goalId) return g;
      categoryId = g.category;
      let newTasks = g.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
      if (status === "done") {
        const original = g.tasks.find((t) => t.id === taskId);
        if (original && original.recurrence && original.recurrence !== "none") {
          newTasks = [
            ...newTasks,
            {
              id: uid(),
              title: original.title,
              status: "todo",
              due: original.due ? advanceDate(original.due, original.recurrence) : "",
              recurrence: original.recurrence,
              notes: original.notes || "",
            },
          ];
        }
      }
      return { ...g, tasks: newTasks };
    });
    persist(categoriesRef.current, next, { activityLog: logActivity(activityLog, categoryId) });
  };

  const cycleStatus = (goalId, taskId) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
    const task = goal && goal.tasks.find((t) => t.id === taskId);
    if (!task) return;
    applyTaskStatus(goalId, taskId, nextStatus(task.status));
  };

  const setTaskStatus = (goalId, taskId, status) => applyTaskStatus(goalId, taskId, status);
  const markTaskDone = (goalId, taskId) => applyTaskStatus(goalId, taskId, "done");

  const updateTask = (goalId, taskId, patch) => {
    const next = goalsRef.current.map((g) =>
      g.id !== goalId ? g : { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
    );
    persist(categoriesRef.current, next);
  };

  const reassignTask = (fromGoalId, taskId, toGoalId) => {
    if (fromGoalId === toGoalId) return;
    const fromGoal = goalsRef.current.find((g) => g.id === fromGoalId);
    const task = fromGoal && fromGoal.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = goalsRef.current.map((g) => {
      if (g.id === fromGoalId) return { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) };
      if (g.id === toGoalId) return { ...g, tasks: [...g.tasks, task] };
      return g;
    });
    persist(categoriesRef.current, next);
    setExpanded((prev) => ({ ...prev, [toGoalId]: true }));
  };

  const deleteTask = (goalId, taskId) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
    const idx = goal ? goal.tasks.findIndex((t) => t.id === taskId) : -1;
    const removed = goal ? goal.tasks[idx] : null;
    persist(categoriesRef.current, goalsRef.current.map((g) => (g.id !== goalId ? g : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) })));
    if (removed) {
      showUndo("Step deleted.", () => {
        const restored = goalsRef.current.map((g) => {
          if (g.id !== goalId) return g;
          const copy = [...g.tasks];
          copy.splice(Math.min(idx, copy.length), 0, removed);
          return { ...g, tasks: copy };
        });
        persist(categoriesRef.current, restored);
      });
    }
  };

  const handleBulkAction = (action, items) => {
    if (items.length === 0) return;
    if (action === "delete") {
      if (!window.confirm(`Delete ${items.length} step${items.length === 1 ? "" : "s"}? This can't be undone.`)) return;
      let next = goalsRef.current;
      items.forEach(({ goalId, id }) => {
        next = next.map((g) => (g.id !== goalId ? g : { ...g, tasks: g.tasks.filter((t) => t.id !== id) }));
      });
      persist(categoriesRef.current, next);
      return;
    }
    const status = action === "done" ? "done" : "failed";
    let next = goalsRef.current;
    let nextLog = activityLog;
    items.forEach(({ goalId, id }) => {
      next = next.map((g) => {
        if (g.id !== goalId) return g;
        nextLog = logActivity(nextLog, g.category);
        let tasks = g.tasks.map((t) => (t.id === id ? { ...t, status } : t));
        if (status === "done") {
          const original = g.tasks.find((t) => t.id === id);
          if (original && original.recurrence && original.recurrence !== "none") {
            tasks = [...tasks, { id: uid(), title: original.title, status: "todo", due: original.due ? advanceDate(original.due, original.recurrence) : "", recurrence: original.recurrence, notes: original.notes || "" }];
          }
        }
        return { ...g, tasks };
      });
    });
    persist(categoriesRef.current, next, { activityLog: nextLog });
  };

  const updateGoal = (goalId, patch) => {
    persist(categoriesRef.current, goalsRef.current.map((g) => (g.id === goalId ? { ...g, ...patch } : g)));
  };

  const toggleGoalTimeframe = (goalId) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { timeframe: goal.timeframe === "long" ? "short" : "long" });
  };

  const archiveGoal = (goalId) => {
    updateGoal(goalId, { archived: true });
    showUndo("Goal archived.", () => updateGoal(goalId, { archived: false }));
  };

  const deleteGoal = (goalId) => {
    const idx = goalsRef.current.findIndex((g) => g.id === goalId);
    const removed = goalsRef.current[idx];
    persist(categoriesRef.current, goalsRef.current.filter((g) => g.id !== goalId));
    if (removed) {
      showUndo("Goal deleted.", () => {
        const copy = [...goalsRef.current];
        copy.splice(Math.min(idx, copy.length), 0, removed);
        persist(categoriesRef.current, copy);
      });
    }
  };

  const saveAsTemplate = (goalId, name) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
    if (!goal) return;
    const tmpl = { id: uid(), name: (name || goal.title).trim(), timeframe: goal.timeframe, steps: goal.tasks.map((t) => ({ title: t.title, recurrence: t.recurrence || "none" })) };
    persist(categoriesRef.current, goalsRef.current, { templates: [...templates, tmpl] });
  };

  const deleteTemplate = (id) => {
    persist(categoriesRef.current, goalsRef.current, { templates: templates.filter((t) => t.id !== id) });
  };

  const createFromTemplate = (templateId, timeframe, title, categoryId, deadline) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    const newGoal = {
      id: uid(),
      title: (title || tmpl.name).trim(),
      timeframe,
      deadline: deadline || "",
      category: categoryId || null,
      archived: false,
      notes: "",
      tasks: tmpl.steps.map((s) => ({ id: uid(), title: s.title, status: "todo", due: "", recurrence: s.recurrence || "none", notes: "" })),
    };
    persist(categoriesRef.current, [...goalsRef.current, newGoal], { activityLog: logActivity(activityLog, categoryId) });
    setExpanded((prev) => ({ ...prev, [newGoal.id]: true }));
  };

  const onUseTemplate = (timeframe) => {
    const opts = templates.filter((t) => t.timeframe === timeframe);
    if (opts.length === 0) return;
    setForm({ kind: "use-template", timeframe, initial: { templateId: opts[0].id, title: "", category: "", deadline: "" } });
  };

  // ---------- categories ----------

  const addCategory = (name) => {
    if (!name.trim()) return;
    const color = CATEGORY_PALETTE[categoriesRef.current.length % CATEGORY_PALETTE.length];
    const c = { id: uid(), name: name.trim(), color };
    persist([...categoriesRef.current, c], goalsRef.current);
    setNewCategoryName("");
    setAddingCategory(false);
    setActiveView(c.id);
  };

  const renameCategory = (id, name) => {
    if (!name.trim()) return;
    persist(categoriesRef.current.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)), goalsRef.current);
  };

  const moveCategory = (id, direction) => {
    const idx = categoriesRef.current.findIndex((c) => c.id === id);
    const newIdx = idx + direction;
    if (idx < 0 || newIdx < 0 || newIdx >= categoriesRef.current.length) return;
    const next = [...categoriesRef.current];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    persist(next, goalsRef.current);
  };

  const deleteCategory = (id) => {
    const idx = categoriesRef.current.findIndex((c) => c.id === id);
    const removedCat = categoriesRef.current[idx];
    const affectedGoalIds = goalsRef.current.filter((g) => g.category === id).map((g) => g.id);
    const nextGoals = goalsRef.current.map((g) => (g.category === id ? { ...g, category: null } : g));
    const nextCategories = categoriesRef.current.filter((c) => c.id !== id);
    persist(nextCategories, nextGoals);
    if (activeView === id) setActiveView("overview");
    if (removedCat) {
      showUndo(`"${removedCat.name}" deleted.`, () => {
        const catsCopy = [...categoriesRef.current];
        catsCopy.splice(Math.min(idx, catsCopy.length), 0, removedCat);
        const goalsCopy = goalsRef.current.map((g) => (affectedGoalIds.includes(g.id) ? { ...g, category: removedCat.id } : g));
        persist(catsCopy, goalsCopy);
      });
    }
  };

  const resetData = () => {
    const seed = sampleStore();
    persist(seed.categories, seed.goals, { activityLog: seed.activityLog, templates: seed.templates, weekly: seed.weekly });
    setActiveView("overview");
  };

  // ---------- confirmations ----------

  const confirmAndDeleteCategory = (id) => {
    const cat = categoriesRef.current.find((c) => c.id === id);
    if (window.confirm(`Delete "${cat ? cat.name : "this category"}"? Its goals will become unsorted, not deleted.`)) {
      deleteCategory(id);
    }
  };

  const confirmAndDeleteGoal = (goalId) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
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

  const confirmAndDeleteForever = (goalId) => {
    const goal = goalsRef.current.find((g) => g.id === goalId);
    if (window.confirm(`Permanently delete "${goal ? goal.title : "this goal"}"? This can't be undone.`)) {
      persist(categoriesRef.current, goalsRef.current.filter((g) => g.id !== goalId));
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
          { label: "Archived goals", icon: <ArchiveIcon size={15} />, onClick: () => setArchiveOpen(true) },
          { label: "Manage templates", icon: <Layers size={15} />, onClick: () => setTemplatesOpen(true) },
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
          { label: "Edit details", onClick: () => setForm({ kind: "edit-goal", id: goal.id, initial: { title: goal.title, deadline: goal.deadline || "", notes: goal.notes || "" } }) },
          { label: "Reassign category", onClick: () => setForm({ kind: "reassign-goal-category", id: goal.id, initial: { category: goal.category || "" } }) },
          { label: goal.timeframe === "long" ? "Move to Waypoints" : "Move to Expeditions", onClick: () => toggleGoalTimeframe(goal.id) },
          { divider: true },
          { label: "Save as template", onClick: () => setForm({ kind: "save-template", id: goal.id, initial: { name: goal.title } }) },
          { label: "Archive", onClick: () => archiveGoal(goal.id) },
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
          { label: "Mark failed", disabled: task.status === "failed", danger: task.status !== "failed", onClick: () => setTaskStatus(goal.id, task.id, "failed") },
          { divider: true },
          { label: "Edit", onClick: () => setForm({ kind: "edit-task", goalId: goal.id, id: task.id, initial: { title: task.title, due: task.due || "", recurrence: task.recurrence || "none", notes: task.notes || "" } }) },
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
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Optional notes" },
        ],
        initial: form.initial,
        onSubmit: (v) => updateGoal(form.id, { title: (v.title || "").trim() || form.initial.title, deadline: v.deadline || "", notes: v.notes || "" }),
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

    if (form.kind === "save-template") {
      return {
        open: true,
        title: "Save as template",
        fields: [{ key: "name", label: "Template name", type: "text", autoFocus: true }],
        initial: form.initial,
        submitLabel: "Save template",
        onSubmit: (v) => saveAsTemplate(form.id, v.name || form.initial.name),
      };
    }

    if (form.kind === "use-template") {
      const opts = templates.filter((t) => t.timeframe === form.timeframe);
      const showPicker = activeView === "overview";
      return {
        open: true,
        title: "New goal from template",
        fields: [
          { key: "templateId", label: "Template", type: "select", options: opts.map((t) => ({ value: t.id, label: `${t.name} (${t.steps.length} step${t.steps.length === 1 ? "" : "s"})` })) },
          { key: "title", label: "Title", type: "text", placeholder: "Leave blank to use the template's name" },
          ...(showPicker ? [{ key: "category", label: "Category", type: "select", options: [{ value: "", label: "Unsorted" }, ...categories.map((c) => ({ value: c.id, label: c.name }))] }] : []),
          { key: "deadline", label: "Deadline", type: "date" },
        ],
        initial: form.initial,
        submitLabel: "Create goal",
        onSubmit: (v) =>
          createFromTemplate(
            v.templateId || form.initial.templateId,
            form.timeframe,
            v.title,
            showPicker ? v.category || null : activeView === "unsorted" ? null : activeView,
            v.deadline
          ),
      };
    }

    if (form.kind === "edit-task") {
      return {
        open: true,
        title: "Edit step",
        fields: [
          { key: "title", label: "Title", type: "text", autoFocus: true },
          { key: "due", label: "Due date", type: "date" },
          { key: "recurrence", label: "Repeats", type: "select", options: RECURRENCE_OPTIONS },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Optional notes" },
        ],
        initial: form.initial,
        onSubmit: (v) => updateTask(form.goalId, form.id, { title: (v.title || "").trim() || form.initial.title, due: v.due || "", recurrence: v.recurrence || "none", notes: v.notes || "" }),
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

  // ---------- keyboard shortcuts (desktop) ----------

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchInputRef.current && searchInputRef.current.focus();
      } else if (e.key.toLowerCase() === "n" && !typing && !menu && !form) {
        e.preventDefault();
        setAddingGoalFor("long");
      } else if (e.key === "Escape") {
        if (menu) setMenu(null);
        else if (form) setForm(null);
        else if (taskListKey) setTaskListKey(null);
        else if (search) setSearch("");
        else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menu, form, taskListKey, search]);

  const loading = categories === null || goals === null;
  const currentCategory = !loading ? categories.find((c) => c.id === activeView) || null : null;
  const visibleGoals = loading
    ? []
    : (activeView === "overview"
        ? goals
        : activeView === "unsorted"
        ? goals.filter((g) => !g.category)
        : goals.filter((g) => g.category === activeView)
      ).filter((g) => !g.archived);

  const appMenuLongPress = useLongPress(() => setMenu({ kind: "app" }), () => setMenu({ kind: "app" }));

  const q = search.trim().toLowerCase();
  const searchMatches = !loading && q
    ? goals.filter((g) => !g.archived && (g.title.toLowerCase().includes(q) || g.tasks.some((t) => t.title.toLowerCase().includes(q))))
    : [];

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
          <div className="sticky top-0 z-30 pb-3" style={{ background: "#EFEBE0" }}>
            <header className="flex items-start justify-between mb-4 gap-4">
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

            <div className="relative mb-3">
              <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#8a8272" }} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goals and steps… (press /)"
                className="wm-input rounded-full pl-8 pr-8 py-1.5 text-xs w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute"
                  style={{ right: 10, top: "50%", transform: "translateY(-50%)", color: "#8a8272" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <NavTabs
              categories={categories} goals={goals} activeView={activeView} setActiveView={setActiveView}
              addingCategory={addingCategory} setAddingCategory={setAddingCategory}
              newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
              addCategory={addCategory}
              onCategoryMenu={(id) => setMenu({ kind: "category", id })}
            />
          </div>

          {q ? (
            <div>
              <h2 className="wm-display text-lg mb-3">
                {searchMatches.length} result{searchMatches.length === 1 ? "" : "s"} for "{search.trim()}"
              </h2>
              <div className="space-y-3">
                {searchMatches.length === 0 && (
                  <p className="text-sm italic" style={{ color: "#8a8272" }}>Nothing matches yet.</p>
                )}
                {searchMatches.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    category={categories.find((c) => c.id === g.category) || null}
                    showTag
                    expanded={!!expanded[g.id]}
                    onToggle={() => setExpanded((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
                    draft={taskDraft[g.id] || { title: "", due: "", recurrence: "none" }}
                    setDraft={(d) => setTaskDraft((prev) => ({ ...prev, [g.id]: d }))}
                    addTask={() => addTask(g.id)}
                    cycleStatus={(tid) => cycleStatus(g.id, tid)}
                    onMarkTaskDone={(tid) => markTaskDone(g.id, tid)}
                    onGoalMenu={() => setMenu({ kind: "goal", id: g.id })}
                    onTaskMenu={(tid) => setMenu({ kind: "task", goalId: g.id, id: tid })}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeView === "overview" && reviewBanner && (
                <div className="wm-card rounded-sm p-4 mb-6 flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <strong>This week:</strong>{" "}
                    {reviewBanner.doneDelta > 0
                      ? `${reviewBanner.doneDelta} step${reviewBanner.doneDelta === 1 ? "" : "s"} done`
                      : "no new steps finished"}
                    {reviewBanner.failedDelta > 0 ? `, ${reviewBanner.failedDelta} failed` : ""}.
                  </p>
                  <button onClick={() => setReviewBanner(null)} className="text-xs font-medium shrink-0" style={{ color: "#6b6355" }}>
                    Got it
                  </button>
                </div>
              )}

              {activeView === "overview" && (
                <CategoryProgress categories={categories} goals={goals.filter((g) => !g.archived)} activityLog={activityLog} onSelect={setActiveView} />
              )}

              {(() => {
                const allTasks = visibleGoals.flatMap((g) => g.tasks.map((t) => ({ ...t, goalTitle: g.title, goalId: g.id, goalCategory: g.category })));
                const counts = {
                  done: allTasks.filter((t) => t.status === "done").length,
                  doing: allTasks.filter((t) => t.status === "doing").length,
                  todo: allTasks.filter((t) => t.status === "todo").length,
                  failed: allTasks.filter((t) => t.status === "failed").length,
                };
                const total = allTasks.length;
                const showTag = activeView === "overview";

                const STAT_DEFS = [
                  { key: "total", label: "Total tasks", match: () => true },
                  { key: "done", label: "Done", match: (t) => t.status === "done" },
                  { key: "doing", label: "In progress", match: (t) => t.status === "doing" },
                  { key: "dueSoon", label: "Due this week", match: (t) => isDueThisWeek(t) },
                  { key: "overdue", label: "Overdue", match: (t) => isOverdue(t) },
                  { key: "failed", label: "Task failed", match: (t) => t.status === "failed" },
                ];
                const activeStat = STAT_DEFS.find((s) => s.key === taskListKey);
                const templatesForTimeframe = (tf) => templates.filter((t) => t.timeframe === tf);

                const expeditions = (
                  <GoalSection
                    key="expeditions"
                    label="Expeditions" sub="Long-term goals" timeframe="long"
                    visibleGoals={visibleGoals} categories={categories} activeView={activeView}
                    expanded={expanded} setExpanded={setExpanded} taskDraft={taskDraft} setTaskDraft={setTaskDraft}
                    addingGoalFor={addingGoalFor} setAddingGoalFor={setAddingGoalFor}
                    newGoalTitle={newGoalTitle} setNewGoalTitle={setNewGoalTitle}
                    newGoalDeadline={newGoalDeadline} setNewGoalDeadline={setNewGoalDeadline}
                    newGoalCategory={newGoalCategory} setNewGoalCategory={setNewGoalCategory}
                    addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus} onMarkTaskDone={markTaskDone}
                    onGoalMenu={(id) => setMenu({ kind: "goal", id })}
                    onTaskMenu={(goalId, id) => setMenu({ kind: "task", goalId, id })}
                    templatesForTimeframe={templatesForTimeframe("long")}
                    onUseTemplate={onUseTemplate}
                  />
                );
                const waypoints = (
                  <GoalSection
                    key="waypoints"
                    label="Waypoints" sub="Short-term goals" timeframe="short"
                    visibleGoals={visibleGoals} categories={categories} activeView={activeView}
                    expanded={expanded} setExpanded={setExpanded} taskDraft={taskDraft} setTaskDraft={setTaskDraft}
                    addingGoalFor={addingGoalFor} setAddingGoalFor={setAddingGoalFor}
                    newGoalTitle={newGoalTitle} setNewGoalTitle={setNewGoalTitle}
                    newGoalDeadline={newGoalDeadline} setNewGoalDeadline={setNewGoalDeadline}
                    newGoalCategory={newGoalCategory} setNewGoalCategory={setNewGoalCategory}
                    addGoal={addGoal} addTask={addTask} cycleStatus={cycleStatus} onMarkTaskDone={markTaskDone}
                    onGoalMenu={(id) => setMenu({ kind: "goal", id })}
                    onTaskMenu={(goalId, id) => setMenu({ kind: "task", goalId, id })}
                    templatesForTimeframe={templatesForTimeframe("short")}
                    onUseTemplate={onUseTemplate}
                  />
                );

                return (
                  <>
                    <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0 gap-4 mb-8">
                      {STAT_DEFS.map((s) => {
                        const count = allTasks.filter(s.match).length;
                        const alert = (s.key === "overdue" || s.key === "failed") && count > 0;
                        return (
                          <button
                            key={s.key}
                            onClick={() => setTaskListKey(s.key)}
                            className="wm-card rounded-sm p-4 text-left min-w-[128px] shrink-0 sm:min-w-0 sm:shrink"
                          >
                            <div className="wm-mono text-2xl" style={{ color: alert ? "#A2452F" : "#26313A" }}>{count}</div>
                            <div className="text-xs mt-1" style={{ color: "#6b6355" }}>{s.label}</div>
                          </button>
                        );
                      })}
                    </section>

                    <div className="grid md:grid-cols-5 gap-6">
                      <div className="md:col-span-3 space-y-8">
                        {activeView === "overview" ? (
                          <>
                            {waypoints}
                            {expeditions}
                          </>
                        ) : (
                          <>
                            {expeditions}
                            {waypoints}
                          </>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="wm-card rounded-sm p-5">
                          <div className="flex items-center gap-4">
                            <StatusDonut counts={counts} total={total} />
                            <div className="text-xs space-y-1.5">
                              <Legend color="#4F6B52" label={`Done · ${counts.done}`} />
                              <Legend color="#B8843C" label={`In progress · ${counts.doing}`} />
                              <Legend color="#C9C2AF" label={`Not started · ${counts.todo}`} />
                              <Legend color="#A2452F" label={`Failed · ${counts.failed}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <TaskListSheet
                      open={!!activeStat}
                      title={activeStat ? activeStat.label : ""}
                      tasks={activeStat ? allTasks.filter(activeStat.match) : []}
                      categories={categories}
                      showTag={showTag}
                      onCycle={cycleStatus}
                      onMarkDone={markTaskDone}
                      onMenu={(goalId, id) => { setTaskListKey(null); setMenu({ kind: "task", goalId, id }); }}
                      onBulkAction={handleBulkAction}
                      onClose={() => setTaskListKey(null)}
                    />
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      <ActionSheet {...getMenuProps()} onClose={closeMenu} />
      <FormSheet key={form ? `${form.kind}-${form.id || ""}-${form.goalId || ""}` : "none"} {...getFormProps()} onClose={closeForm} />
      <ArchiveSheet
        open={archiveOpen}
        goals={goals ? goals.filter((g) => g.archived) : []}
        categories={categories || []}
        onRestore={(id) => updateGoal(id, { archived: false })}
        onDeleteForever={confirmAndDeleteForever}
        onClose={() => setArchiveOpen(false)}
      />
      <TemplatesSheet open={templatesOpen} templates={templates} onDelete={deleteTemplate} onClose={() => setTemplatesOpen(false)} />
      <UndoToast toast={undo} onUndo={runUndo} />
    </div>
  );
}
