// Pure launch logic. Mirrors launch.py so the CLI and the app always agree; tested in tests/engine.test.mjs.
export const KINDS = ['saas', 'digital', 'internal'];
export const BASE_CHANNEL = { saas: 'core', digital: 'core', internal: 'internal' };
export const REQUIRED_FIELDS = ['name', 'one_liner', 'audience', 'url', 'success_metric', 'success_target', 'kill_threshold'];
export const NUMERIC_FIELDS = ['success_target', 'kill_threshold'];
export const WEEKDAY_TASKS = ['ph-launch', 'hn-post'];
export const COLLISION_DAYS = 14;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const DAY = 86400000;

export const parseDate = (iso) => new Date(`${iso}T00:00:00Z`);
export const formatDate = (d) => d.toISOString().slice(0, 10);
export const addDays = (iso, n) => formatDate(new Date(parseDate(iso).getTime() + n * DAY));
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / DAY);
export const weekday = (iso) => parseDate(iso).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
export const todayIso = () => {
  const d = new Date();
  return formatDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
};

export function selectTasks(tasks, project) {
  const kind = project.kind || 'saas';
  const wanted = new Set([BASE_CHANNEL[kind], ...(project.channels || [])]);
  return tasks
    .filter((t) => wanted.has(t.channel) && (t.kinds || KINDS).includes(kind))
    .sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}

export const dueDate = (project, task) => addDays(project.launch_date, task.day);
export const phaseOf = (task) => (task.day < 0 ? 'Pre-launch' : task.day === 0 ? 'Launch day' : 'Post-launch');

export function missingFields(project) {
  const missing = REQUIRED_FIELDS.filter((f) => !String(project[f] ?? '').trim());
  const vague = NUMERIC_FIELDS.filter((f) => !missing.includes(f) && !/\d/.test(String(project[f])))
    .map((f) => `${f} (needs a number)`);
  return [...missing, ...vague];
}

export function blockingGates(tasks, project) {
  const done = new Set(project.done || []);
  return selectTasks(tasks, project).filter((t) => t.gate && t.day <= 0 && !done.has(t.id));
}

export function weekdayWarnings(tasks, project) {
  return selectTasks(tasks, project)
    .filter((t) => WEEKDAY_TASKS.includes(t.id))
    .map((t) => ({ t, due: dueDate(project, t) }))
    .filter(({ due }) => ![2, 3, 4].includes(parseDate(due).getUTCDay()))
    .map(({ t, due }) => `${t.id} falls on ${weekday(due)} ${due}; move the launch date so it lands Tue-Thu`);
}

export function collisions(projects, project) {
  if ((project.kind || 'saas') !== 'saas') return [];
  return projects
    .filter((o) => o.slug !== project.slug && (o.kind || 'saas') === 'saas')
    .filter((o) => Math.abs(daysBetween(project.launch_date, o.launch_date)) <= COLLISION_DAYS)
    .map((o) => `${o.slug} launches ${o.launch_date}, within ${COLLISION_DAYS} days`);
}

export function gateStatus(tasks, project) {
  const missing = missingFields(project);
  const blocking = blockingGates(tasks, project);
  return { go: !missing.length && !blocking.length, missing, blocking };
}

export const firstNumber = (s) => {
  const m = String(s ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

// Verdict against numbers fixed before launch: hit target, between, or under the kill line.
export function verdict(project) {
  const value = Number(project.results?.metric_value ?? 0);
  const target = firstNumber(project.success_target);
  const kill = firstNumber(project.kill_threshold);
  if (target === null || kill === null) return { level: 'unset', label: 'Set numeric target and kill threshold' };
  if (value >= target) return { level: 'win', label: 'Double down: target hit' };
  if (value < kill) return { level: 'kill', label: 'Below kill line: pivot or kill' };
  return { level: 'mid', label: 'Between kill and target: fix the weakest step' };
}

export function summarise(tasks, project, today) {
  const list = selectTasks(tasks, project);
  const done = new Set(project.done || []);
  const open = list.filter((t) => !done.has(t.id));
  return {
    total: list.length,
    doneCount: list.length - open.length,
    overdue: open.filter((t) => dueDate(project, t) < today),
    upcoming: open.filter((t) => dueDate(project, t) >= today),
    tMinus: daysBetween(project.launch_date, today), // negative before launch: T-18
  };
}

export function validateProject(p, tasks) {
  const errors = [];
  if (!SLUG_RE.test(p.slug || '')) errors.push('slug: lowercase letters, digits and dashes only');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.launch_date || '') || Number.isNaN(parseDate(p.launch_date).getTime()))
    errors.push('launch_date: YYYY-MM-DD');
  if (!KINDS.includes(p.kind || 'saas')) errors.push(`kind: one of ${KINDS.join(', ')}`);
  // Trust boundary: url is rendered as a link, so block javascript:/data: from forms and imported backups.
  if (p.url && !/^https?:\/\//i.test(p.url)) errors.push('url: must start with http:// or https://');
  const known = new Set(tasks.map((t) => t.channel));
  if (!Array.isArray(p.channels)) errors.push('channels: must be a list');
  else p.channels.filter((c) => !known.has(c)).forEach((c) => errors.push(`unknown channel: ${c}`));
  return errors;
}

const tomlStr = (v) => JSON.stringify(String(v ?? '')); // JSON string escapes are valid TOML basic strings

export function toToml(p) {
  const r = p.results || {};
  const list = (xs) => `[${(xs || []).map(tomlStr).join(', ')}]`;
  return [
    `slug = ${tomlStr(p.slug)}`, `kind = ${tomlStr(p.kind || 'saas')}`, `name = ${tomlStr(p.name)}`,
    `launch_date = ${p.launch_date}`, `url = ${tomlStr(p.url)}`, `one_liner = ${tomlStr(p.one_liner)}`,
    `audience = ${tomlStr(p.audience)}`, `category = ${tomlStr(p.category)}`,
    `success_metric = ${tomlStr(p.success_metric)}`, `success_target = ${tomlStr(p.success_target)}`,
    `kill_threshold = ${tomlStr(p.kill_threshold)}`, `channels = ${list(p.channels)}`, `done = ${list(p.done)}`,
    '', '[results]',
    ...['signups', 'activated', 'paying', 'mrr', 'metric_value'].map((k) => `${k} = ${Number(r[k] ?? 0)}`),
    `top_channel = ${tomlStr(r.top_channel)}`, '',
  ].join('\n');
}
