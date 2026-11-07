// node launch-engine/tests/engine.test.mjs. Same cases as test_launch.py, plus app-only logic.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as E from '../app/engine.js';

const TASKS = [
  { id: 'a', day: -10, channel: 'core', title: 'A', gate: true },
  { id: 'b', day: 0, channel: 'producthunt', title: 'B', gate: true },
  { id: 'ph-launch', day: 0, channel: 'producthunt', title: 'PH' },
  { id: 'c', day: 3, channel: 'hn', title: 'C' },
  { id: 'd', day: 5, channel: 'core', title: 'D', gate: true },
  { id: 's', day: -5, channel: 'core', title: 'S', gate: true, kinds: ['saas'] },
  { id: 'i', day: -1, channel: 'internal', title: 'I', gate: true },
];
const P = { slug: 'x', name: 'X', kind: 'saas', launch_date: '2026-12-01', channels: ['producthunt'], done: ['a'],
  one_liner: 'x', audience: 'x', url: 'x', success_metric: 'x', success_target: 'lots', kill_threshold: '' };

assert.deepEqual(E.selectTasks(TASKS, P).map((t) => t.id), ['a', 's', 'b', 'ph-launch', 'd']);
assert.deepEqual(E.selectTasks(TASKS, { ...P, kind: 'digital' }).map((t) => t.id), ['a', 'b', 'ph-launch', 'd']);
assert.deepEqual(E.selectTasks(TASKS, { ...P, kind: 'internal', channels: [] }).map((t) => t.id), ['i']);
assert.equal(E.dueDate(P, TASKS[0]), '2026-11-21');
assert.deepEqual(E.blockingGates(TASKS, P).map((t) => t.id), ['s', 'b']);
assert.deepEqual(E.missingFields(P), ['kill_threshold', 'success_target (needs a number)']);
assert.equal(E.gateStatus(TASKS, P).go, false);
assert.deepEqual(E.weekdayWarnings(TASKS, P), []); // 2026-12-01 is a Tuesday
assert.equal(E.weekdayWarnings(TASKS, { ...P, launch_date: '2026-12-05' }).length, 1);
assert.equal(E.weekday('2026-12-01'), 'Tuesday');
assert.equal(E.addDays('2026-03-28', 2), '2026-03-30'); // UTC maths: no DST off-by-one

const other = { ...P, slug: 'y', launch_date: '2026-12-09' };
assert.deepEqual(E.collisions([P, other], P), ['y launches 2026-12-09, within 14 days']);
assert.deepEqual(E.collisions([P, { ...other, kind: 'digital' }], P), []);

assert.equal(E.verdict({ success_target: '10 by T+30', kill_threshold: '3', results: { metric_value: 12 } }).level, 'win');
assert.equal(E.verdict({ success_target: '10', kill_threshold: '3', results: { metric_value: 5 } }).level, 'mid');
assert.equal(E.verdict({ success_target: '10', kill_threshold: '3', results: { metric_value: 2 } }).level, 'kill');
assert.equal(E.verdict({ success_target: 'lots', kill_threshold: '3' }).level, 'unset');
assert.equal(E.firstNumber('£1,490 MRR'), 1490);

const s = E.summarise(TASKS, P, '2026-11-25');
assert.equal(s.tMinus, -6);
assert.deepEqual(s.overdue.map((t) => t.id), []);
assert.deepEqual(E.summarise(TASKS, P, '2026-11-28').overdue.map((t) => t.id), ['s']);

assert.deepEqual(E.validateProject({ ...P, slug: '../x', channels: ['HN'] }, TASKS),
  ['slug: lowercase letters, digits and dashes only', 'url: must start with http:// or https://', 'unknown channel: HN']);
assert.deepEqual(E.validateProject(P, TASKS), ['url: must start with http:// or https://']); // P.url is 'x'
assert.deepEqual(E.validateProject({ ...P, url: 'javascript:alert(1)' }, TASKS), ['url: must start with http:// or https://']);
assert.deepEqual(E.validateProject({ ...P, url: '' }, TASKS), []);

const toml = E.toToml({ ...P, name: 'Quote "test"', results: { paying: 2 } });
assert.match(toml, /^name = "Quote \\"test\\""$/m);
assert.match(toml, /^launch_date = 2026-12-01$/m);
assert.match(toml, /^paying = 2$/m);

// Exported data must be internally consistent.
const data = JSON.parse(readFileSync(new URL('../app/data.json', import.meta.url)));
for (const p of data.projects) assert.deepEqual(E.validateProject(p, data.tasks), [], p.slug);
console.log('ok');
