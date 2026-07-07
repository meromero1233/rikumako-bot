// メモリ内ストレージ（再起動でリセットされる簡易版）
// 将来的にJSONファイル or DBに移行可能

const state = {
  subscribers: 0,          // 現在の登録者数
  tasks: [],               // { id, text, done, createdAt, doneAt }
  nextTaskId: 1,
  weeklyPosts: 0,          // 今週の投稿本数
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

export function getTasks() {
  return state.tasks;
}

export function getPendingTasks() {
  return state.tasks.filter((t) => !t.done);
}

// ── 登録者数 ────────────────────────────────────────────────────────────────────

export function setSubscribers(n) {
  const prev = state.subscribers;
  state.subscribers = n;
  return { prev, current: n };
}

export function getSubscribers() {
  return state.subscribers;
}

export function getNextMilestone() {
  return state.milestones.find((m) => m > state.subscribers) ?? null;
}

// ── 投稿本数 ────────────────────────────────────────────────────────────────────

export function incrementWeeklyPosts() {
  state.weeklyPosts++;
}

export function getWeeklyPosts() {
  return state.weeklyPosts;
}

export function resetWeeklyPosts() {
  state.weeklyPosts = 0;
}
