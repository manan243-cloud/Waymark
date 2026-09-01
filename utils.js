export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Format a Date using its LOCAL calendar date (not UTC) as YYYY-MM-DD, so it
// matches what a native <input type="date"> produces and what the person
// actually sees on their clock.
function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return localDateStr(new Date());
}

export function addDaysStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export function sampleCategories() {
  return [
    { id: "cat-health", name: "Health", color: "#4B8B8C" },
    { id: "cat-career", name: "Career", color: "#5B7A99" },
    { id: "cat-finance", name: "Finance", color: "#8A6D3B" },
    { id: "cat-relationships", name: "Relationships", color: "#C08585" },
  ];
}

export function sampleGoals() {
  const iso = addDaysStr;
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

export function sampleStore() {
  return { categories: sampleCategories(), goals: sampleGoals(), activityLog: [], templates: [], weekly: null };
}

export function goalProgress(goal) {
  if (!goal.tasks.length) return 0;
  return Math.round((goal.tasks.filter((t) => t.status === "done").length / goal.tasks.length) * 100);
}

export function isOverdue(task) {
  return !!task.due && task.due < todayStr() && task.status !== "done" && task.status !== "failed";
}

// Due today through the next 7 days (and not already finished/failed).
export function isDueThisWeek(task) {
  return !!task.due && task.status !== "done" && task.status !== "failed" && task.due >= todayStr() && task.due <= addDaysStr(7);
}

// Due within the next 48 hours (and not already overdue, finished, or failed) —
// used to flag tasks with an urgent deadline.
export function isUrgent(task) {
  return !!task.due && task.status !== "done" && task.status !== "failed" && task.due >= todayStr() && task.due <= addDaysStr(2);
}

export function nextStatus(s) {
  if (s === "todo") return "doing";
  if (s === "doing") return "done";
  if (s === "done") return "failed";
  return "todo";
}

export const STATUS_LABEL = { todo: "Not started", doing: "In progress", done: "Done", failed: "Failed" };

// A goal "needs attention" if it has overdue steps, or its deadline is close
// but progress is still low — i.e. it looks like it's being neglected.
export function goalNeedsAttention(goal) {
  const overdueCt = goal.tasks.filter(isOverdue).length;
  if (overdueCt > 0) return true;
  const prog = goalProgress(goal);
  if (goal.deadline && goal.deadline <= addDaysStr(7) && goal.deadline >= todayStr() && prog < 50) return true;
  if (goal.tasks.length === 0) return false;
  return false;
}

// ---------- recurring steps ----------

export const RECURRENCE_LABEL = { none: "Doesn't repeat", daily: "Repeats daily", weekly: "Repeats weekly", monthly: "Repeats monthly" };

export function advanceDate(dateStr, recurrence) {
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  if (recurrence === "daily") base.setDate(base.getDate() + 1);
  else if (recurrence === "weekly") base.setDate(base.getDate() + 7);
  else if (recurrence === "monthly") base.setMonth(base.getMonth() + 1);
  return localDateStr(base);
}

// ---------- activity log & streaks ----------
// A tiny, deduped log of "something happened in category X on date Y" used
// to compute how many consecutive days you've touched a category.

export function logActivity(activityLog, categoryId) {
  const key = categoryId || "unsorted";
  const today = todayStr();
  if (activityLog.some((e) => e.date === today && e.category === key)) return activityLog;
  return [...activityLog, { date: today, category: key }].slice(-2000); // cap growth
}

export function currentStreak(activityLog, categoryId) {
  const key = categoryId || "unsorted";
  const days = new Set(activityLog.filter((e) => e.category === key).map((e) => e.date));
  if (days.size === 0) return 0;
  let streak = 0;
  let cursor = new Date();
  // If nothing logged today yet, a streak can still be "alive" through yesterday.
  if (!days.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---------- weekly review ----------

export function computeCounts(goals) {
  const tasks = goals.flatMap((g) => g.tasks);
  return {
    done: tasks.filter((t) => t.status === "done").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };
}
