import type { CouncilAgent } from '../types'

/**
 * The eight standing seats of the War Room Council. Each seat has a mandate
 * (what it exists to protect or produce) and a default reach — the skill-tree
 * nodes it starts out permitted to invoke. Reach is edited at runtime from
 * the Council panel; this is only the seed.
 */
export const COUNCIL: CouncilAgent[] = [
  {
    id: 'law',
    name: 'The Law',
    title: 'Rule Keeper & Quality Controller',
    mandate: 'Holds every other seat to the standard. Blocks before it apologizes.',
    defaultReach: ['mem-recall', 'risk-assess', 'adversarial-review', 'self-audit'],
  },
  {
    id: 'voice',
    name: 'Voice & Style',
    title: 'Tone, Wording & Formatting',
    mandate: 'Owns how the output reads. Kills fluff, opens with the governing thought.',
    defaultReach: ['ctx-ingest', 'file-synth'],
  },
  {
    id: 'engineer',
    name: 'The Engineer',
    title: 'Technical Specs, Measurements & Precision',
    mandate: 'Owns correctness. Nothing ships that it has not measured.',
    defaultReach: ['tool-invoke', 'code-exec', 'risk-assess'],
  },
  {
    id: 'designer',
    name: 'The Designer',
    title: 'Layout, Themes & Look-and-Feel',
    mandate: 'Owns legibility. A working feature that reads badly is not done.',
    defaultReach: ['ctx-ingest', 'file-synth'],
  },
  {
    id: 'operator',
    name: 'The Operator',
    title: 'Workflows, Processes & Tools',
    mandate: 'Owns how work actually moves. Sequences it, budgets it, ships it.',
    defaultReach: ['tool-invoke', 'scheduling', 'resource-alloc'],
  },
  {
    id: 'builder',
    name: 'The Builder',
    title: 'Code, Apps & Execution',
    mandate: 'Owns what gets built. Turns a decomposed task into a working artifact.',
    defaultReach: ['task-decompose', 'code-exec', 'file-synth'],
  },
  {
    id: 'researcher',
    name: 'The Researcher',
    title: 'Search, Data & Discovery',
    mandate: 'Owns what is actually true right now, not what was true in training.',
    defaultReach: ['ctx-ingest', 'web-research', 'mem-recall'],
  },
  {
    id: 'archivist',
    name: 'The Archivist',
    title: 'Memory, Storage & History',
    mandate: 'Owns continuity. Nothing decided today gets re-litigated from zero tomorrow.',
    defaultReach: ['mem-recall', 'scheduling'],
  },
]

export function getAgent(id: string): CouncilAgent | undefined {
  return COUNCIL.find((a) => a.id === id)
}
