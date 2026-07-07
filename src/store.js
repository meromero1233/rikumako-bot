const state = {
  subscribers: 0,
  tasks: [],
  nextTaskId: 1,
  weeklyPosts: 0,
  lastPostedAt: null,      // 最後に動画投稿した日時
  reachedMilestones: new Set(), // 祝福済みマイルストーン
  milestones: [1000, 5000, 10000, 50000, 100000, 500000, 1000000],
};

// ── タスク管理 ──────────────────────────────────────────────────────────────────

export function addTask(text) {
  const task = { id: state.nextTaskId++, text, done: false, createdAt: new Date() };
  state.tasks.push(task);
  return task;
}

export function completeTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || task.done) return null;
  task.done = true;
  task.doneAt = new Date();
  return task;
}

export function deleteTask(id) {
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  state.tasks.splice(idx, 1);
  return true;
}

export function getTasks() { return state.tasks; }
export function getPendingTasks() { return state.tasks.filter((t) => !t.done); }

// 2日以上放置されている未完了タスクを返す
export function getStaleTasks(days = 2) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return state.tasks.filter((t) => !t.done && new Date(t.createdAt).getTime() < threshold);
}

// ── 登録者数 ────────────────────────────────────────────────────────────────────

export function setSubscribers(n) {
  const prev = state.subscribers;
  state.subscribers = n;
  return { prev, current: n };
}

export function getSubscribers() { return state.subscribers; }

export function getNextMilestone() {
  return state.milestones.find((m) => m > state.subscribers) ?? null;
}

// 新たに到達したマイルストーンを返す（祝福済みは除外）
export function checkNewMilestone(prev, current) {
  for (const m of state.milestones) {
    if (prev < m && current >= m && !state.reachedMilestones.has(m)) {
      state.reachedMilestones.add(m);
      return m;
    }
  }
  return null;
}

// ── 投稿記録 ────────────────────────────────────────────────────────────────────

export function recordPost() {
  state.weeklyPosts++;
  state.lastPostedAt = new Date();
}

export function getLastPostedAt() { return state.lastPostedAt; }

export function getDaysSinceLastPost() {
  if (!state.lastPostedAt) return null;
  return (Date.now() - new Date(state.lastPostedAt).getTime()) / (1000 * 60 * 60 * 24);
}

export function incrementWeeklyPosts() { state.weeklyPosts++; }
export function getWeeklyPosts() { return state.weeklyPosts; }
export function resetWeeklyPosts() { state.weeklyPosts = 0; }
