import { el } from '../shared/dom.js';
import { loadState, saveState, wireBackup } from '../shared/store.js';

const KEY = 'war-room';
const STATUSES = ['todo', 'doing', 'blocked', 'done'];
const LABEL = { todo: 'To do', doing: 'In progress', blocked: 'Blocked', done: 'Done' };
const COLOUR = { todo: 'var(--text)', doing: 'var(--accent)', blocked: 'var(--danger)', done: 'var(--muted)' };
let state = loadState(KEY, { mission: '', tasks: [] });

function commit() { saveState(KEY, state); render(); }

function card(t) {
  const next = STATUSES[(STATUSES.indexOf(t.status) + 1) % STATUSES.length];
  return el('li', { className: 'row', style: 'margin:6px 0' },
    el('span', { textContent: `P${t.priority}`, style: t.priority === 1 ? 'color:var(--warn);font-weight:bold' : 'color:var(--muted)' }),
    el('span', { textContent: t.text, style: `flex:1 1 160px;${t.status === 'done' ? 'text-decoration:line-through;color:var(--muted)' : ''}` }),
    el('button', { type: 'button', textContent: LABEL[t.status], style: `border-color:${COLOUR[t.status]};color:${COLOUR[t.status]}`,
      ariaLabel: `${t.text}: ${LABEL[t.status]}, move to ${LABEL[next]}`, onclick: () => { t.status = next; commit(); } }),
    el('button', { type: 'button', className: 'danger', textContent: '✕', ariaLabel: `Delete ${t.text}`,
      onclick: () => { state.tasks = state.tasks.filter((x) => x !== t); commit(); } }));
}

function render() {
  document.getElementById('mission').value = state.mission;
  document.getElementById('board').replaceChildren(...STATUSES.flatMap((s) => {
    const tasks = state.tasks.filter((t) => t.status === s).sort((a, b) => a.priority - b.priority);
    return tasks.length ? [el('h3', { textContent: LABEL[s], className: 'muted', style: 'margin:12px 0 4px' }), el('ul', { className: 'plain' }, ...tasks.map(card))] : [];
  }));
  const n = (s) => state.tasks.filter((t) => t.status === s).length;
  document.getElementById('counts').textContent = `· ${n('done')}/${state.tasks.length} done · ${n('blocked')} blocked`;
}

document.getElementById('today').textContent = `· ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}`;
document.getElementById('mission').oninput = (e) => { state.mission = e.target.value; saveState(KEY, state); };
document.getElementById('add').onsubmit = (e) => {
  e.preventDefault();
  const text = document.getElementById('text');
  state.tasks.push({ id: crypto.randomUUID(), text: text.value.trim(), priority: Number(document.getElementById('priority').value), status: 'todo' });
  text.value = '';
  commit();
};
document.getElementById('clear-done').onclick = () => { state.tasks = state.tasks.filter((t) => t.status !== 'done'); commit(); };

wireBackup(KEY, () => state,
  (d) => d && typeof d.mission === 'string' && Array.isArray(d.tasks) && d.tasks.every((t) => STATUSES.includes(t.status)),
  (d) => { state = d; commit(); });
render();
