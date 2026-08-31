export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
  return { categories: sampleCategories(), goals: sampleGoals() };
}

export function goalProgress(goal) {
  if (!goal.tasks.length) return 0;
  return Math.round((goal.tasks.filter((t) => t.status === "done").length / goal.tasks.length) * 100);
}

export function isOverdue(task) {
  return !!task.due && task.due < todayStr() && task.status !== "done" && task.status !== "failed";
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
