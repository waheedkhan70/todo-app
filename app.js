const seedTasks = [
  { id: 1, title: 'Review Q3 project notes', priority: 'high', due: '2026-10-12', list: 'Work', done: false },
  { id: 2, title: 'Book a table for Friday dinner', priority: 'medium', due: '2026-10-12', list: 'Personal', done: false },
  { id: 3, title: 'Pick up dry cleaning', priority: 'low', due: '2026-10-13', list: 'Personal', done: false },
  { id: 4, title: 'Outline ideas for the new website', priority: 'medium', due: '2026-10-15', list: 'Ideas', done: false },
  { id: 5, title: 'Send invoice to Northstar Studio', priority: 'high', due: '2026-10-10', list: 'Work', done: true }
];

let tasks = JSON.parse(localStorage.getItem('daymark-tasks') || 'null') || seedTasks;
let currentView = 'all';
let currentFilter = 'all';
let currentList = null;
let sortMode = 'Priority';
const priorityRank = { high: 0, medium: 1, low: 2 };
const today = '2026-10-12';

const $ = (selector) => document.querySelector(selector);
const taskList = $('#taskList');
const emptyState = $('#emptyState');

function formatDue(date) {
  if (!date) return 'No date';
  if (date === today) return 'Today';
  const dateObject = new Date(`${date}T12:00:00`);
  return dateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function visibleTasks() {
  const query = $('#searchInput')?.value.toLowerCase().trim() || '';
  return tasks.filter((task) => {
    const matchesView = currentView === 'all' || (currentView === 'today' && task.due === today) || (currentView === 'upcoming' && task.due > today && !task.done) || (currentView === 'completed' && task.done);
    const matchesFilter = currentFilter === 'all' || (currentFilter === 'active' && !task.done) || (currentFilter === 'completed' && task.done);
    const matchesList = !currentList || task.list === currentList;
    return matchesView && matchesFilter && matchesList && task.title.toLowerCase().includes(query);
  }).sort((a, b) => {
    if (sortMode === 'Priority') return priorityRank[a.priority] - priorityRank[b.priority];
    return (a.due || '9999').localeCompare(b.due || '9999');
  });
}

function render() {
  const shown = visibleTasks();
  taskList.innerHTML = shown.map((task, index) => `
    <article class="task-row ${task.done ? 'done' : ''}" style="animation-delay: ${index * 35}ms">
      <button class="task-check" data-action="toggle" data-id="${task.id}" aria-label="Mark ${task.done ? 'incomplete' : 'complete'}">${task.done ? '✓' : ''}</button>
      <div class="task-content"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta"><span class="priority ${task.priority}">${task.priority[0].toUpperCase() + task.priority.slice(1)}</span><span>${formatDue(task.due)}</span></div></div>
      <div class="task-actions"><span class="list-tag">${task.list}</span><button class="delete-button" data-action="delete" data-id="${task.id}" aria-label="Delete task">×</button></div>
    </article>`).join('');
  emptyState.classList.toggle('hidden', shown.length > 0);
  taskList.classList.toggle('hidden', shown.length === 0);
  updateCounts();
}

function updateCounts() {
  const active = tasks.filter((task) => !task.done).length;
  const completed = tasks.filter((task) => task.done).length;
  $('#allCount').textContent = tasks.length;
  $('#todayCount').textContent = tasks.filter((task) => task.due === today && !task.done).length;
  $('#completedCount').textContent = completed;
  $('#tabAll').textContent = tasks.length;
  $('#tabActive').textContent = active;
  $('#tabDone').textContent = completed;
  $('#taskCountFooter').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  $('#taskSummary').textContent = `${active} ${active === 1 ? 'task' : 'tasks'} in progress · ${completed} completed`;
  localStorage.setItem('daymark-tasks', JSON.stringify(tasks));
}

function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function setView(view) {
  currentView = view; currentList = null;
  const titles = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', completed: 'Completed' };
  $('#pageTitle').textContent = titles[view]; $('#headerView').textContent = titles[view];
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  document.querySelectorAll('.project-item').forEach((item) => item.classList.remove('active-project'));
  render();
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.filter-tab').forEach((button) => button.addEventListener('click', () => { currentFilter = button.dataset.filter; document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('active', tab === button)); render(); }));
document.querySelectorAll('.project-item').forEach((button) => button.addEventListener('click', () => { currentList = button.dataset.list; currentView = 'all'; $('#pageTitle').textContent = button.dataset.list; $('#headerView').textContent = button.dataset.list; document.querySelectorAll('.project-item').forEach((item) => item.classList.toggle('active-project', item === button)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active')); render(); }));

taskList.addEventListener('click', (event) => { const button = event.target.closest('button'); if (!button) return; const id = Number(button.dataset.id); if (button.dataset.action === 'toggle') tasks = tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task); if (button.dataset.action === 'delete') tasks = tasks.filter((task) => task.id !== id); render(); });
$('#taskForm').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#taskInput'); if (!input.value.trim()) return; tasks.unshift({ id: Date.now(), title: input.value.trim(), priority: $('#priorityInput').value, due: $('#dateInput').value || today, list: currentList || 'Personal', done: false }); input.value = ''; $('#dateInput').value = ''; render(); input.focus(); });
$('#sortButton').addEventListener('click', () => { sortMode = sortMode === 'Priority' ? 'Due date' : 'Priority'; $('#sortButton').innerHTML = `Sort: <strong>${sortMode}</strong> <span>⌄</span>`; render(); });
$('#searchToggle').addEventListener('click', () => { $('#searchRow').classList.remove('hidden'); $('#searchInput').focus(); });
$('#closeSearch').addEventListener('click', () => { $('#searchRow').classList.add('hidden'); $('#searchInput').value = ''; render(); });
$('#searchInput').addEventListener('input', render);
$('#addTopButton').addEventListener('click', () => { $('#taskInput').focus(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); });
$('#emptyAdd').addEventListener('click', () => $('#taskInput').focus());
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') $('#taskForm').requestSubmit(); });
render();
