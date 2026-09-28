import type { AgentStance, SkillTier } from '../types'

const STANCE_STYLES: Record<AgentStance, string> = {
  advance: 'bg-moss/15 text-moss border-moss/40',
  hold: 'bg-ember/15 text-ember border-ember/40',
  block: 'bg-signal-500/15 text-signal-400 border-signal-500/40',
}

const STANCE_LABEL: Record<AgentStance, string> = {
  advance: 'ADVANCE',
  hold: 'HOLD',
  block: 'BLOCK',
}

export function StanceBadge({ stance }: { stance: AgentStance }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wide ${STANCE_STYLES[stance]}`}
    >
      {STANCE_LABEL[stance]}
    </span>
  )
}

const TIER_STYLES: Record<SkillTier, string> = {
  foundation: 'bg-ink-600 text-slate-300 border-ink-600',
  operational: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  strategic: 'bg-ember/10 text-ember border-ember/30',
  apex: 'bg-signal-500/10 text-signal-400 border-signal-500/30',
}

export function TierBadge({ tier }: { tier: SkillTier }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${TIER_STYLES[tier]}`}
    >
      {tier}
    </span>
  )
}
