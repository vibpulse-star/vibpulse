import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSnapshot, duplicateSkills } from './skill-snapshot.ts';

test('keeps only bounded name/description fields', () => {
  const s = parseSnapshot({ groups: [{ name: 'core', secret: 'x', skills: [{ name: 'pdf', description: 'd'.repeat(900), token: 'y' }, { name: '' }] }] });
  assert.deepEqual(Object.keys(s.groups[0]), ['name', 'skills']);
  assert.equal(s.groups[0].skills.length, 1);
  assert.equal(s.groups[0].skills[0].description.length, 500);
  assert.equal('token' in s.groups[0].skills[0], false);
});
test('rejects malformed payloads', () => {
  assert.throws(() => parseSnapshot(null));
  assert.throws(() => parseSnapshot({ groups: [{ name: 'a', skills: 'nope' }] }));
  assert.throws(() => parseSnapshot({ groups: [{ skills: [] }] }));
});
test('finds skills shipped by several groups', () => {
  const d = duplicateSkills({ groups: [
    { name: 'a', skills: [{ name: 'pdf', description: '' }] },
    { name: 'b', skills: [{ name: 'pdf', description: '' }, { name: 'xlsx', description: '' }] }] });
  assert.deepEqual([...d], [['pdf', ['a', 'b']]]);
});
