import type { SkillNode } from '../types'

/**
 * The skill tree War Room is "linked to": a DAG of capabilities the OS can
 * grant to council agents. Tiers gate progression — a skill can't unlock
 * until every prerequisite is already unlocked.
 */
export const SKILL_TREE: SkillNode[] = [
  // --- Foundation: no prerequisites, always eligible first ---
  {
    id: 'mem-recall',
    name: 'Memory Recall',
    tier: 'foundation',
    category: 'Memory',
    description: 'Persistent retrieval of prior context, decisions, and state across sessions.',
    prerequisites: [],
  },
  {
    id: 'ctx-ingest',
    name: 'Context Ingestion',
    tier: 'foundation',
    category: 'Perception',
    description: 'Parsing raw input — text, files, events — into structured working state.',
    prerequisites: [],
  },
  {
    id: 'tool-invoke',
    name: 'Tool Invocation',
    tier: 'foundation',
    category: 'Execution',
    description: 'Calling external tools and APIs safely, with validated inputs and outputs.',
    prerequisites: [],
  },
  {
    id: 'task-decompose',
    name: 'Task Decomposition',
    tier: 'foundation',
    category: 'Planning',
    description: 'Breaking an ambiguous objective into an ordered set of concrete subtasks.',
    prerequisites: [],
  },

  // --- Operational: single-hop from foundation ---
  {
    id: 'web-research',
    name: 'Web Research',
    tier: 'operational',
    category: 'Research',
    description: 'Live retrieval and cross-source triangulation of external information.',
    prerequisites: ['ctx-ingest'],
  },
  {
    id: 'code-exec',
    name: 'Code Execution',
    tier: 'operational',
    category: 'Execution',
    description: 'Running, testing, and validating code changes in a real environment.',
    prerequisites: ['tool-invoke'],
  },
  {
    id: 'file-synth',
    name: 'File Synthesis',
    tier: 'operational',
    category: 'Execution',
    description: 'Generating and editing structured files, documents, and artifacts.',
    prerequisites: ['ctx-ingest', 'tool-invoke'],
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    tier: 'operational',
    category: 'Planning',
    description: 'Sequencing, timing, and deferring work across a session or across sessions.',
    prerequisites: ['task-decompose'],
  },

  // --- Strategic: compounds operational skills ---
  {
    id: 'risk-assess',
    name: 'Risk Assessment',
    tier: 'strategic',
    category: 'Governance',
    description: 'Surfacing failure modes, blast radius, and reversibility before committing.',
    prerequisites: ['code-exec', 'web-research'],
  },
  {
    id: 'multi-orch',
    name: 'Multi-Agent Orchestration',
    tier: 'strategic',
    category: 'Coordination',
    description: 'Coordinating parallel agent work without collision, duplication, or drift.',
    prerequisites: ['scheduling', 'task-decompose'],
  },
  {
    id: 'adversarial-review',
    name: 'Adversarial Review',
    tier: 'strategic',
    category: 'Governance',
    description: 'Structural pushback: holding a position unless given genuinely new data.',
    prerequisites: ['risk-assess'],
  },
  {
    id: 'resource-alloc',
    name: 'Resource Allocation',
    tier: 'strategic',
    category: 'Planning',
    description: 'Budgeting compute, time, and token spend across competing session demands.',
    prerequisites: ['scheduling'],
  },

  // --- Apex: full-system capabilities, gated behind multiple strategic skills ---
  {
    id: 'autonomous-plan',
    name: 'Autonomous Planning',
    tier: 'apex',
    category: 'Planning',
    description: 'Setting and revising multi-step goals across turns without a prompt per step.',
    prerequisites: ['multi-orch', 'resource-alloc'],
  },
  {
    id: 'cross-domain',
    name: 'Cross-Domain Synthesis',
    tier: 'apex',
    category: 'Synthesis',
    description: 'Combining findings from disparate skill categories into a single decision.',
    prerequisites: ['risk-assess', 'multi-orch'],
  },
  {
    id: 'self-audit',
    name: 'Self-Audit',
    tier: 'apex',
    category: 'Governance',
    description: 'Catching invisible gaps and weak links in its own output before delivery.',
    prerequisites: ['adversarial-review'],
  },
  {
    id: 'council-formation',
    name: 'Council Formation',
    tier: 'apex',
    category: 'Coordination',
    description: 'Standing up and dissolving agent councils on demand for a given objective.',
    prerequisites: ['autonomous-plan', 'cross-domain'],
  },
]

export const SKILL_TIERS: SkillNode['tier'][] = ['foundation', 'operational', 'strategic', 'apex']

export function getSkill(id: string): SkillNode | undefined {
  return SKILL_TREE.find((s) => s.id === id)
}

export function isUnlockable(skill: SkillNode, unlocked: ReadonlySet<string>): boolean {
  return skill.prerequisites.every((p) => unlocked.has(p))
}
