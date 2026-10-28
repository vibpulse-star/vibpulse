import { el } from '../shared/dom.js';
import { loadState, saveState, wireBackup } from '../shared/store.js';

const KEY = 'skill-tree';
const MAX = 5;
const SEED = [
  { id: 'core', name: 'Core', parent: null, level: 1 },
  { id: 'build', name: 'Build', parent: 'core', level: 0 },
  { id: 'sell', name: 'Sell', parent: 'core', level: 0 },
];
let skills = loadState(KEY, SEED);

const byId = (id) => skills.find((s) => s.id === id);
const unlocked = (s) => !s.parent || (byId(s.parent)?.level ?? 0) >= 1;
const descendants = (id) => skills.filter((s) => s.parent === id).flatMap((c) => [c.id, ...descendants(c.id)]);

function commit() { saveState(KEY, skills); render(); }

function node(s) {
  const open = unlocked(s);
  const pips = '●'.repeat(s.level) + '○'.repeat(MAX - s.level);
  const li = el('li', { style: 'margin:8px 0' },
    el('div', { className: 'row', style: open ? '' : 'opacity:.5' },
      el('strong', { textContent: s.name }),
      el('span', { textContent: pips, style: 'color:var(--accent)', ariaLabel: `Level ${s.level} of ${MAX}` }),
      el('button', { type: 'button', textContent: '+', ariaLabel: `Level up ${s.name}`, disabled: !open || s.level >= MAX,
        onclick: () => { s.level++; commit(); } }),
      el('button', { type: 'button', textContent: '−', ariaLabel: `Level down ${s.name}`, disabled: s.level <= 0,
        onclick: () => { s.level--; commit(); } }),
      el('button', { type: 'button', className: 'danger', textContent: '✕', ariaLabel: `Delete ${s.name}`,
        onclick: () => {
          const gone = [s.id, ...descendants(s.id)];
          if (confirm(`Delete ${s.name}${gone.length > 1 ? ` and ${gone.length - 1} sub-skill(s)` : ''}?`)) {
            skills = skills.filter((x) => !gone.includes(x.id));
            commit();
          }
        } }),
      open ? '' : el('span', { className: 'muted', textContent: 'locked' })));
  const kids = skills.filter((c) => c.parent === s.id);
  if (kids.length) li.append(el('ul', { style: 'border-left:1px solid var(--line);padding-left:16px;list-style:none' }, ...kids.map(node)));
  return li;
}

function render() {
  document.getElementById('tree').replaceChildren(el('ul', { className: 'plain' }, ...skills.filter((s) => !s.parent).map(node)));
  document.getElementById('xp').textContent = `· ${skills.reduce((t, s) => t + s.level, 0)} XP`;
  document.getElementById('parent').replaceChildren(
    el('option', { value: '', textContent: '— root —' }),
    ...skills.map((s) => el('option', { value: s.id, textContent: s.name })));
}

document.getElementById('add').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('name');
  skills.push({ id: crypto.randomUUID(), name: name.value.trim(), parent: document.getElementById('parent').value || null, level: 0 });
  name.value = '';
  commit();
};

wireBackup(KEY, () => skills,
  (d) => Array.isArray(d) && d.every((s) => typeof s.id === 'string' && typeof s.name === 'string' && Number.isInteger(s.level)),
  (d) => { skills = d; commit(); });
render();
