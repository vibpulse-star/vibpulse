export type Skill = { name: string; description: string };
export type SkillGroup = { name: string; skills: Skill[] };
export type SkillSnapshot = { groups: SkillGroup[] };

const MAX_GROUPS = 300, MAX_SKILLS = 500;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Trust boundary: keep only names/descriptions with bounded sizes; drop anything else the script sends. */
export function parseSnapshot(input: unknown): SkillSnapshot {
  const groups = (input as { groups?: unknown })?.groups;
  if (!Array.isArray(groups) || groups.length > MAX_GROUPS) throw new Error('groups must be an array (max 300)');
  return {
    groups: groups.map((g) => {
      const skills = (g as { skills?: unknown })?.skills;
      if (!Array.isArray(skills) || skills.length > MAX_SKILLS) throw new Error('skills must be an array (max 500)');
      const name = str((g as { name?: unknown }).name, 120);
      if (!name) throw new Error('group name required');
      return {
        name,
        skills: skills.map((s) => ({ name: str((s as Skill)?.name, 120), description: str((s as Skill)?.description, 500) }))
          .filter((s) => s.name),
      };
    }),
  };
}

/** Skill names provided by more than one group: overlaps worth pruning. */
export function duplicateSkills(snap: SkillSnapshot): Map<string, string[]> {
  const where = new Map<string, string[]>();
  for (const g of snap.groups) for (const s of g.skills) where.set(s.name, [...(where.get(s.name) ?? []), g.name]);
  return new Map([...where].filter(([, gs]) => gs.length > 1));
}
