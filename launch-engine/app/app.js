// Launch Engine UI. Logic lives in engine.js; this file only renders state and handles input.
import * as E from './engine.js';

const STORE_KEY = 'launch-engine-v1';
const main = document.getElementById('main');
let TASKS = [];
let CHANNELS = [];
let state = { projects: {}, seeded: [] };
const ui = { filter: 'open' }; // plan filter, kept for the session

// ---------- storage (per device; Export/Import moves it between PC and phone) ----------
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch { toast('Could not save: storage is blocked or full. Export a backup now.'); }
}
const isBackup = (d) => d && typeof d.projects === 'object' && Array.isArray(d.seeded);
const PREV_KEY = `${STORE_KEY}.prev`;
// Import and Reset replace everything; keep one undo snapshot so a wrong file can't wipe the device.
function snapshot() {
  try { localStorage.setItem(PREV_KEY, JSON.stringify(state)); } catch { /* best effort */ }
  document.getElementById('undo').hidden = false;
}

// Repo projects are added once; local edits and deletions are never overwritten by a repo refresh.
function mergeSeed(seedProjects) {
  for (const p of seedProjects) {
    if (state.seeded.includes(p.slug)) continue;
    state.seeded.push(p.slug);
    if (!state.projects[p.slug]) state.projects[p.slug] = structuredClone(p);
  }
}

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const projects = () => Object.values(state.projects).sort((a, b) => a.launch_date.localeCompare(b.launch_date));
const tLabel = (n) => (n === 0 ? 'Launch day' : `T${n > 0 ? '+' : '−'}${Math.abs(n)}`);
const kindLabel = { saas: 'SaaS', digital: 'Digital product', internal: 'Internal tool' };
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function download(name, text, type) {
  // Android WebView can't follow blob downloads; the native shell exposes a save-as bridge instead.
  if (window.AndroidBridge) { window.AndroidBridge.saveFile(name, text, type); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function gateBadge(p) {
  const g = E.gateStatus(TASKS, p);
  const n = g.missing.length + g.blocking.length;
  return g.go ? '<span class="badge go">GO</span>' : `<span class="badge stop">NO-GO · ${n}</span>`;
}

function taskRow(p, t, today, showProject = false) {
  const done = (p.done || []).includes(t.id);
  const due = E.dueDate(p, t);
  const late = !done && due < today;
  const id = `t-${esc(p.slug)}-${esc(t.id)}`;
  return `<li class="task${done ? ' is-done' : ''}">
    <input type="checkbox" id="${id}" data-slug="${esc(p.slug)}" data-task="${esc(t.id)}" ${done ? 'checked' : ''}>
    <label for="${id}">${esc(t.title)}${t.gate ? ' <span class="badge warn">GATE</span>' : ''}</label>
    <div class="sub">
      <span class="${late ? 'overdue' : ''}">${late ? 'Overdue · ' : ''}${esc(due)} (${esc(E.weekday(due).slice(0, 3))})</span>
      <span>${tLabel(t.day)}</span><span>${esc(t.channel)}</span>
      ${showProject ? `<a href="#/p/${esc(p.slug)}/plan">${esc(p.name || p.slug)}</a>` : ''}
    </div>
    ${t.why ? `<details><summary>Why</summary>${esc(t.why)}</details>` : ''}
  </li>`;
}

// ---------- views ----------
function viewHome(today) {
  const ps = projects();
  const sums = ps.map((p) => ({ p, s: E.summarise(TASKS, p, today), g: E.gateStatus(TASKS, p) }));
  const overdue = sums.reduce((n, x) => n + x.s.overdue.length, 0);
  const soon = sums.filter((x) => x.s.tMinus < 0 && x.s.tMinus >= -30).length;
  const go = sums.filter((x) => x.g.go).length;
  const cards = sums.map(({ p, s }) => {
    const pct = s.total ? Math.round((s.doneCount / s.total) * 100) : 0;
    const warns = [...E.weekdayWarnings(TASKS, p), ...E.collisions(ps, p)].length;
    return `<a class="card" href="#/p/${esc(p.slug)}/plan">
      <div class="card-head"><h3>${esc(p.name || p.slug)}</h3>${gateBadge(p)}</div>
      <div class="meta">
        <span class="badge kind">${esc(kindLabel[p.kind || 'saas'])}</span>
        <span>${esc(p.launch_date)} · ${tLabel(s.tMinus)}</span>
        ${s.overdue.length ? `<span class="badge stop">${s.overdue.length} overdue</span>` : ''}
        ${warns ? `<span class="badge warn">${warns} warning${warns > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="bar" role="img" aria-label="${pct}% of tasks done"><i style="width:${pct}%"></i></div>
      <p class="small muted" style="margin:6px 0 0">${s.doneCount}/${s.total} tasks · next: ${esc(s.upcoming[0]?.title || 'nothing scheduled')}</p>
    </a>`;
  }).join('');
  const urgent = sums.flatMap(({ p, s }) => s.overdue.slice(0, 3).map((t) => ({ p, t })))
    .sort((a, b) => E.dueDate(a.p, a.t).localeCompare(E.dueDate(b.p, b.t))).slice(0, 8);
  const since = state.lastExport ? E.daysBetween(state.lastExport, today) : null;
  const nag = since === null || since > 7
    ? `<p class="badge warn" style="margin:0 0 14px">${since === null ? 'Never backed up on this device' : `Last backup ${since} days ago`}. ⋯ → Export backup.</p>` : '';
  return `${nag}<h1>Command</h1>
    <p class="lede">Every launch, one screen. Today is ${esc(today)} (${esc(E.weekday(today))}).</p>
    <section class="kpis" aria-label="Portfolio totals">
      <div class="kpi"><b>${ps.length}</b><span>projects</span></div>
      <div class="kpi"><b>${soon}</b><span>launching in 30 days</span></div>
      <div class="kpi"><b>${overdue}</b><span>overdue tasks</span></div>
      <div class="kpi"><b>${go}</b><span>cleared GO</span></div>
    </section>
    ${urgent.length ? `<h2>Fix first</h2><ul class="tasks">${urgent.map(({ p, t }) => taskRow(p, t, today, true)).join('')}</ul>
      <p class="small"><a href="#/agenda">Full agenda →</a></p>` : ''}
    <h2>Projects</h2>
    ${ps.length ? `<div class="grid">${cards}</div>` : '<p class="muted">No projects yet. <a href="#/new">Create one</a>.</p>'}`;
}

function viewAgenda(today) {
  const horizon = E.addDays(today, 14);
  const rows = projects().flatMap((p) => E.selectTasks(TASKS, p)
    .filter((t) => !(p.done || []).includes(t.id) && E.dueDate(p, t) <= horizon)
    .map((t) => ({ p, t, due: E.dueDate(p, t) })))
    .sort((a, b) => a.due.localeCompare(b.due));
  const late = rows.filter((r) => r.due < today);
  const now = rows.filter((r) => r.due === today);
  const next = rows.filter((r) => r.due > today);
  const block = (title, list) => (list.length
    ? `<h2>${title} <span class="muted small">(${list.length})</span></h2><ul class="tasks">${list.map((r) => taskRow(r.p, r.t, today, true)).join('')}</ul>` : '');
  return `<h1>Agenda</h1><p class="lede">Open tasks across all projects, up to ${esc(horizon)}.</p>
    ${block('Overdue', late)}${block('Today', now)}${block('Next 14 days', next)}
    ${rows.length ? '' : '<p class="muted">Nothing due in the next 14 days.</p>'}`;
}

function viewLibrary() {
  const byChannel = Object.groupBy ? Object.groupBy(TASKS, (t) => t.channel)
    : TASKS.reduce((m, t) => ((m[t.channel] ||= []).push(t), m), {});
  return `<h1>Library</h1><p class="lede">${TASKS.length} tasks from <code>tasks.toml</code>. Edit them there after each retro, then run <code>python launch.py export</code>.</p>
    ${Object.entries(byChannel).map(([ch, ts]) => `<h2>${esc(ch)} <span class="muted small">(${ts.length})</span></h2>
      <ul class="tasks">${ts.sort((a, b) => a.day - b.day).map((t) => `<li class="task" style="grid-template-columns:72px 1fr">
        <code>${tLabel(t.day)}</code><div>${esc(t.title)}${t.gate ? ' <span class="badge warn">GATE</span>' : ''}
        ${t.kinds ? `<span class="badge kind">${esc(t.kinds.join(', '))} only</span>` : ''}
        ${t.why ? `<div class="small muted">${esc(t.why)}</div>` : ''}</div></li>`).join('')}</ul>`).join('')}`;
}

function projectHeader(p, tab, today) {
  const s = E.summarise(TASKS, p, today);
  const tabs = ['plan', 'gate', 'results', 'settings']
    .map((t) => `<a href="#/p/${esc(p.slug)}/${t}" ${t === tab ? 'aria-current="page"' : ''}>${t[0].toUpperCase() + t.slice(1)}</a>`).join('');
  return `<p class="small"><a href="#/">← Command</a></p>
    <div class="card-head"><h1>${esc(p.name || p.slug)}</h1>${gateBadge(p)}</div>
    <div class="meta">
      <span class="badge kind">${esc(kindLabel[p.kind || 'saas'])}</span>
      <span>Launch ${esc(p.launch_date)} (${esc(E.weekday(p.launch_date))}) · ${tLabel(s.tMinus)}</span>
      <span>${s.doneCount}/${s.total} done</span>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open site</a>` : ''}
    </div>
    ${p.one_liner ? `<p class="lede">${esc(p.one_liner)}</p>` : ''}
    <nav class="tabs" aria-label="Project sections">${tabs}</nav>`;
}

function viewPlan(p, today) {
  const all = E.selectTasks(TASKS, p);
  const done = new Set(p.done || []);
  const channels = [...new Set(all.map((t) => t.channel))];
  const filters = [['open', 'Open'], ['all', 'All'], ['gates', 'Gates'], ['overdue', 'Overdue'], ...channels.map((c) => [`ch:${c}`, c])];
  if (!filters.some(([k]) => k === ui.filter)) ui.filter = 'open';
  const keep = (t) => ({
    open: !done.has(t.id), all: true, gates: !!t.gate, overdue: !done.has(t.id) && E.dueDate(p, t) < today,
  }[ui.filter] ?? (t.channel === ui.filter.slice(3)));
  const shown = all.filter(keep);
  const phases = ['Pre-launch', 'Launch day', 'Post-launch'];
  const warn = E.weekdayWarnings(TASKS, p).map((w) => `<p class="badge warn">${esc(w)}</p>`).join(' ');
  return `${warn}<div class="chips" role="group" aria-label="Filter tasks">
      ${filters.map(([k, label]) => `<button type="button" class="chip" data-filter="${esc(k)}" aria-pressed="${k === ui.filter}">${esc(label)}</button>`).join('')}
    </div>
    ${phases.map((ph) => {
      const list = shown.filter((t) => E.phaseOf(t) === ph);
      return list.length ? `<h2>${ph}</h2><ul class="tasks">${list.map((t) => taskRow(p, t, today)).join('')}</ul>` : '';
    }).join('') || '<p class="muted">No tasks match this filter.</p>'}
    <p class="actions" style="margin-top:16px"><button type="button" class="btn" data-action="plan-md">Download plan (.md for Obsidian)</button></p>`;
}

function viewGate(p) {
  const g = E.gateStatus(TASKS, p);
  const warns = [...E.weekdayWarnings(TASKS, p), ...E.collisions(projects(), p)];
  return `<section class="panel">
      <p class="verdict ${g.go ? '' : ''}">${g.go ? '<span class="badge go">GO</span> All gates passed' : `<span class="badge stop">NO-GO</span> ${g.missing.length + g.blocking.length} blocker(s)`}</p>
      <p class="small muted">NO-GO means move the date, not skip the gate.</p>
    </section>
    ${g.missing.length ? `<section class="panel"><h2 style="margin-top:0">Manifest fields</h2><ul class="list-plain">
      ${g.missing.map((f) => `<li>${esc(f)}: <a href="#/p/${esc(p.slug)}/settings">fill in Settings</a></li>`).join('')}</ul></section>` : ''}
    ${g.blocking.length ? `<section class="panel"><h2 style="margin-top:0">Gates not done</h2><ul class="tasks">
      ${g.blocking.map((t) => taskRow(p, t, E.todayIso())).join('')}</ul></section>` : ''}
    ${warns.length ? `<section class="panel"><h2 style="margin-top:0">Warnings</h2><ul class="list-plain">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></section>` : ''}`;
}

function viewResults(p) {
  const r = p.results || {};
  const v = E.verdict(p);
  const cls = { win: 'go', kill: 'stop', mid: 'warn', unset: 'kind' }[v.level];
  const num = (k, label) => `<div class="field"><label for="r-${k}">${label}</label>
    <input type="number" min="0" step="any" inputmode="decimal" id="r-${k}" name="${k}" value="${esc(r[k] ?? 0)}"></div>`;
  return `<section class="panel">
      <p class="verdict"><span class="badge ${cls}">${esc(v.level.toUpperCase())}</span> ${esc(v.label)}</p>
      <p class="small muted">${esc(p.success_metric || 'Metric')}: ${esc(r.metric_value ?? 0)} · target ${esc(p.success_target || '?')} · kill below ${esc(p.kill_threshold || '?')}</p>
    </section>
    <section class="panel"><form class="fields" id="results-form">
      ${num('metric_value', `Current value: ${esc(p.success_metric || 'success metric')}`)}
      ${num('signups', 'Signups')}${num('activated', 'Activated')}${num('paying', 'Paying')}${num('mrr', 'MRR (£)')}
      <div class="field"><label for="r-top_channel">Top channel</label>
        <select id="r-top_channel" name="top_channel"><option value="">-</option>
        ${[E.BASE_CHANNEL[p.kind || 'saas'], ...(p.channels || [])].map((c) => `<option ${r.top_channel === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="actions"><button class="btn primary">Save results</button></div>
    </form></section>`;
}

function projectForm(p, isNew) {
  const kind = p.kind || 'saas';
  const optChannels = CHANNELS.filter((c) => !['core', 'internal'].includes(c));
  const text = (k, label, hint = '', wide = false) => `<div class="field${wide ? ' wide' : ''}"><label for="f-${k}">${label}</label>
    <input type="text" id="f-${k}" name="${k}" value="${esc(p[k])}">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  return `<form class="fields" id="project-form" data-new="${isNew}">
    <div class="field"><label for="f-slug">Slug</label>
      <input type="text" id="f-slug" name="slug" value="${esc(p.slug)}" ${isNew ? 'required pattern="[a-z0-9][a-z0-9\\-]*"' : 'readonly'}>
      <span class="hint">lowercase-with-dashes; becomes the file name</span></div>
    ${text('name', 'Name')}
    <div class="field"><label for="f-kind">Kind</label><select id="f-kind" name="kind">
      ${E.KINDS.map((k) => `<option value="${k}" ${k === kind ? 'selected' : ''}>${kindLabel[k]}</option>`).join('')}</select>
      <span class="hint">Internal tools get a rollout plan, not a public launch.</span></div>
    <div class="field"><label for="f-launch_date">Launch date</label>
      <input type="date" id="f-launch_date" name="launch_date" value="${esc(p.launch_date)}" required>
      <span class="hint">Pick a Tuesday or Wednesday.</span></div>
    ${text('url', 'URL', 'Live site or listing. Required for GO.')}
    ${text('one_liner', 'One-liner', '&lt;Product&gt; helps &lt;audience&gt; &lt;outcome&gt; without &lt;pain&gt;', true)}
    ${text('audience', 'Audience', 'One specific person, not a market')}
    ${text('category', 'Category')}
    ${text('success_metric', 'Success metric', 'e.g. paying customers')}
    ${text('success_target', 'Success target', 'Needs a number, e.g. 10 by T+30')}
    ${text('kill_threshold', 'Kill threshold', 'Below this at T+30 means pivot or kill')}
    <fieldset class="field wide"><legend>Channels</legend><div class="checks">
      ${optChannels.map((c) => `<label><input type="checkbox" name="channels" value="${esc(c)}" ${(p.channels || []).includes(c) ? 'checked' : ''}>${esc(c)}</label>`).join('')}
    </div></fieldset>
    <p class="errors" id="form-errors" role="alert"></p>
    <div class="actions">
      <button class="btn primary">${isNew ? 'Create project' : 'Save'}</button>
      ${isNew ? '' : `<button type="button" class="btn" data-action="toml">Download manifest (.toml)</button>
      <button type="button" class="btn danger" data-action="delete">Delete project</button>`}
    </div></form>`;
}

// ---------- router ----------
function render() {
  const today = E.todayIso();
  const [, route = '', slug, tab = 'plan'] = location.hash.split('/');
  document.querySelectorAll('[data-nav]').forEach((a) => (a.dataset.nav === (route || 'home')
    ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  let html;
  if (route === 'agenda') html = viewAgenda(today);
  else if (route === 'library') html = viewLibrary();
  else if (route === 'new') {
    html = `<h1>New project</h1><p class="lede">Commit to a date and to success and kill numbers before building hype.</p>
      <section class="panel">${projectForm({ kind: 'saas', launch_date: E.addDays(today, 60), channels: ['email'] }, true)}</section>`;
  } else if (route === 'p' && state.projects[slug]) {
    const p = state.projects[slug];
    const body = { plan: () => viewPlan(p, today), gate: () => viewGate(p), results: () => viewResults(p),
      settings: () => `<section class="panel">${projectForm(p, false)}</section>` }[tab] || (() => viewPlan(p, today));
    html = projectHeader(p, tab, today) + body();
    document.title = `${p.name || p.slug} · Launch Engine`;
  } else html = viewHome(today);
  if (route !== 'p') document.title = 'Launch Engine';
  main.innerHTML = html;
}

// ---------- events ----------
main.addEventListener('change', (e) => {
  const box = e.target.closest('input[data-task]');
  if (!box) return;
  const p = state.projects[box.dataset.slug];
  const set = new Set(p.done || []);
  box.checked ? set.add(box.dataset.task) : set.delete(box.dataset.task);
  p.done = [...set];
  save();
  const scroll = scrollY;
  render(); scrollTo(0, scroll);
  document.getElementById(box.id)?.focus();
});

main.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-filter]');
  if (chip) { ui.filter = chip.dataset.filter; render(); return; }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const slug = location.hash.split('/')[2];
  const p = state.projects[slug];
  if (btn.dataset.action === 'toml') download(`${slug}.toml`, E.toToml(p), 'text/plain');
  if (btn.dataset.action === 'plan-md') download(`${slug}.plan.md`, planMarkdown(p), 'text/markdown');
  if (btn.dataset.action === 'delete' && confirm(`Delete ${p.name || slug}? Export a backup first if unsure.`)) {
    delete state.projects[slug]; save(); location.hash = '#/'; toast('Project deleted');
  }
});

main.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  if (form.id === 'results-form') {
    const p = state.projects[location.hash.split('/')[2]];
    p.results = { ...(p.results || {}), top_channel: fd.get('top_channel') };
    for (const k of ['metric_value', 'signups', 'activated', 'paying', 'mrr']) p.results[k] = Number(fd.get(k)) || 0;
    save(); render(); toast('Results saved');
    return;
  }
  if (form.id === 'project-form') {
    const isNew = form.dataset.new === 'true';
    const slug = String(fd.get('slug')).trim();
    const base = isNew ? { done: [], results: {} } : state.projects[slug];
    const p = { ...base, channels: fd.getAll('channels') };
    for (const k of ['slug', 'name', 'kind', 'launch_date', 'url', 'one_liner', 'audience', 'category', 'success_metric', 'success_target', 'kill_threshold'])
      p[k] = String(fd.get(k) ?? '').trim();
    const errors = E.validateProject(p, TASKS);
    if (isNew && state.projects[slug]) errors.push('a project with this slug already exists');
    if (errors.length) { document.getElementById('form-errors').textContent = errors.join(' · '); return; }
    state.projects[slug] = p; save();
    toast(isNew ? 'Project created' : 'Saved');
    location.hash = `#/p/${slug}/${isNew ? 'plan' : 'settings'}`;
    if (!isNew) render();
  }
});

function planMarkdown(p) {
  const done = new Set(p.done || []);
  const lines = [`# Launch plan: ${p.name || p.slug}`, '', `Launch day: **${p.launch_date} (${E.weekday(p.launch_date)})**. Success = ${p.success_metric} >= ${p.success_target}. Kill below ${p.kill_threshold} by T+30.`];
  let phase;
  for (const t of E.selectTasks(TASKS, p)) {
    if (E.phaseOf(t) !== phase) { phase = E.phaseOf(t); lines.push('', `## ${phase}`, ''); }
    lines.push(`- [${done.has(t.id) ? 'x' : ' '}] \`${E.dueDate(p, t)}\` (${tLabel(t.day)}) [${t.channel}] ${t.title}${t.gate ? ' **[GATE]**' : ''}`);
  }
  return `${lines.join('\n')}\n`;
}

// ---------- data menu ----------
document.getElementById('export').onclick = () => {
  state.lastExport = E.todayIso(); save();
  download(`launch-engine-${E.todayIso()}.json`, JSON.stringify({ schemaVersion: 1, ...state }, null, 2), 'application/json');
  render();
};
const fileInput = document.getElementById('import-file');
document.getElementById('import').onclick = () => fileInput.click();
fileInput.onchange = async () => {
  try {
    const data = JSON.parse(await fileInput.files[0].text());
    if (!isBackup(data)) throw new Error('Not a Launch Engine backup.');
    // Hard errors reject the file; channels unknown to this build are kept (ignored by plans) so old backups still load.
    const warnings = [];
    for (const p of Object.values(data.projects)) {
      const errs = E.validateProject(p, TASKS);
      const hard = errs.filter((e) => !e.startsWith('unknown channel'));
      if (hard.length) throw new Error(`${p.slug}: ${hard.join(', ')}`);
      if (errs.length > hard.length) warnings.push(p.slug);
    }
    snapshot();
    delete data.schemaVersion;
    state = data; save(); render();
    toast(warnings.length ? `Imported. Unknown channels kept in: ${warnings.join(', ')}` : 'Backup imported');
  } catch (err) { toast(`Import failed: ${err.message}`); }
  fileInput.value = '';
};
document.getElementById('reset').onclick = async () => {
  if (!confirm('Replace all projects on this device with the repo data? Export a backup first if unsure.')) return;
  snapshot();
  state = { projects: {}, seeded: [] };
  mergeSeed((await fetchData()).projects); save(); render(); toast('Reset to repo data');
};
document.getElementById('undo').onclick = () => {
  const prev = (() => { try { return JSON.parse(localStorage.getItem(PREV_KEY)); } catch { return null; } })();
  if (!isBackup(prev)) { toast('Nothing to undo'); return; }
  state = prev; save(); localStorage.removeItem(PREV_KEY);
  document.getElementById('undo').hidden = true; render(); toast('Restored the previous data');
};

let installPrompt;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); installPrompt = e;
  document.getElementById('install').hidden = false;
});
document.getElementById('install').onclick = () => installPrompt?.prompt();

// ---------- boot ----------
async function fetchData() {
  if (window.LAUNCH_DATA) return window.LAUNCH_DATA; // standalone build: library is inlined, no server needed
  const res = await fetch('data.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);
  return res.json();
}

(async () => {
  try {
    const data = await fetchData();
    TASKS = data.tasks;
    CHANNELS = [...new Set(TASKS.map((t) => t.channel))];
    state = loadLocal() || state;
    document.getElementById('undo').hidden = !localStorage.getItem(PREV_KEY);
    document.getElementById('version').textContent = `Build ${window.LAUNCH_VERSION || 'dev'} · ${TASKS.length} tasks`;
    mergeSeed(data.projects);
    save();
    addEventListener('hashchange', () => { render(); main.focus({ preventScroll: true }); scrollTo(0, 0); });
    render();
  } catch (err) {
    main.innerHTML = `<p class="errors">Could not load the task library (${esc(err.message)}). Serve this folder over http, e.g. <code>python -m http.server</code>.</p>`;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js');
})();
