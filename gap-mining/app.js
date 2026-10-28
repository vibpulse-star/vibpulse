import { el } from '../shared/dom.js';
import { loadState, saveState, wireBackup } from '../shared/store.js';
import { FACTORS, GAP_TYPES, scoreGap } from './score.js';

const KEY = 'gap-mining';
let gaps = loadState(KEY, []);

function commit() { saveState(KEY, gaps); render(); }

const ratings = () => Object.fromEntries(Object.keys(FACTORS).map((k) => [k, Number(document.getElementById(k).value)]));
const preview = () => { document.getElementById('preview').textContent = `Score ${scoreGap(ratings())}/100`; };
const band = (s) => (s >= 70 ? 'var(--accent)' : s >= 50 ? 'var(--warn)' : 'var(--danger)');

function render() {
  const ranked = gaps.map((g) => ({ ...g, score: scoreGap(g.ratings) })).sort((a, b) => b.score - a.score);
  document.getElementById('list').replaceChildren(...ranked.map((g) => el('li', { style: 'margin:8px 0' },
    el('div', { className: 'row' },
      el('strong', { textContent: `${g.score}`, style: `color:${band(g.score)};min-width:3ch` }),
      el('span', { textContent: g.name, style: 'flex:1 1 160px' }),
      el('span', { className: 'muted', textContent: g.type }),
      el('button', { type: 'button', className: 'danger', textContent: '✕', ariaLabel: `Delete ${g.name}`,
        onclick: () => { gaps = gaps.filter((x) => x.id !== g.id); commit(); } })),
    el('div', { className: 'muted', textContent: Object.entries(g.ratings).map(([k, v]) => `${FACTORS[k].split(' (')[0]} ${v}`).join(' · ') }))));
  if (!ranked.length) document.getElementById('list').append(el('li', { className: 'muted', textContent: 'No gaps yet — score your first one above.' }));
}

document.getElementById('type').append(...GAP_TYPES.map((t) => el('option', { value: t, textContent: `${t} gap` })));
document.getElementById('sliders').append(...Object.entries(FACTORS).map(([k, label]) => el('label', { className: 'row', style: 'margin-bottom:8px' },
  el('span', { textContent: label, style: 'flex:1 1 200px' }),
  el('input', { id: k, type: 'range', min: 1, max: 10, value: 5, oninput: (e) => { e.target.nextSibling.textContent = e.target.value; preview(); } }),
  el('output', { textContent: '5', style: 'min-width:2ch' }))));
preview();

document.getElementById('add').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('name');
  gaps.push({ id: crypto.randomUUID(), name: name.value.trim(), type: document.getElementById('type').value, ratings: ratings() });
  name.value = '';
  commit();
};

wireBackup(KEY, () => gaps,
  (d) => Array.isArray(d) && d.every((g) => typeof g.name === 'string' && Object.keys(FACTORS).every((k) => Number.isFinite(g.ratings?.[k]))),
  (d) => { gaps = d; commit(); });
render();
