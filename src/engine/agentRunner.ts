import type { AgentStance, AgentVerdict, CouncilAgent } from '../types'
import { getSkill } from '../data/skillTree'

/** Deterministic string hash -> [0, 1). Keeps sessions reproducible per objective. */
function hash01(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export interface AgentRunContext {
  objective: string
  /** Skill ids this agent's reach currently covers. */
  reachable: string[]
  /** Reachable AND unlocked — what the agent can actually invoke right now. */
  invokable: string[]
  /** Reachable but still locked in the skill tree — a standing gap. */
  lockedInReach: string[]
}

/**
 * Runs a single agent's turn for a council session.
 *
 * This is a deterministic, rule-based reasoning engine, not an LLM call — it
 * exists so War Room runs standalone with no API key configured. To upgrade
 * a seat to real reasoning, replace this function's body with a call to your
 * model of choice (e.g. the Claude API), using `agent.mandate` as the system
 * prompt and `ctx.objective` plus the resolved skill descriptions as context.
 * Keep the return shape (`AgentVerdict`) unchanged and the rest of War Room —
 * council session, synthesis, UI — needs no changes to consume real output.
 */
export function runAgentTurn(agent: CouncilAgent, ctx: AgentRunContext): AgentVerdict {
  if (ctx.invokable.length === 0) {
    return {
      agentId: agent.id,
      skillsInvoked: [],
      stance: 'hold',
      confidence: 'Guessing',
      reasoning: `${agent.name} has no unlocked skill in reach for this objective and abstains rather than guess.`,
      engaged: false,
    }
  }

  const seed = hash01(`${agent.id}::${ctx.objective}`)
  const coverage = ctx.invokable.length / (ctx.reachable.length || 1)

  let stance: AgentStance
  if (ctx.lockedInReach.length > 0 && seed < 0.35) {
    stance = 'block'
  } else if (coverage < 0.6 || seed < 0.55) {
    stance = 'hold'
  } else {
    stance = 'advance'
  }

  const confidence: AgentVerdict['confidence'] =
    coverage >= 0.85 ? 'Certain' : coverage >= 0.5 ? 'Likely' : 'Guessing'

  const invokedNames = ctx.invokable.map((id) => getSkill(id)?.name ?? id)
  const gapNames = ctx.lockedInReach.map((id) => getSkill(id)?.name ?? id)

  const parts = [`${agent.name} draws on ${invokedNames.join(', ')} to evaluate "${ctx.objective}".`]

  if (gapNames.length > 0) {
    parts.push(
      `Reach extends to ${gapNames.join(', ')}, but those remain locked in the skill tree — a weak link until unlocked.`,
    )
  }

  parts.push(
    stance === 'advance'
      ? `Recommendation: advance. ${agent.mandate}`
      : stance === 'hold'
        ? `Recommendation: hold. Coverage is partial (${Math.round(coverage * 100)}% of this seat's reach) — ${agent.mandate}`
        : `Recommendation: block. ${agent.mandate}`,
  )

  return {
    agentId: agent.id,
    skillsInvoked: ctx.invokable,
    stance,
    confidence,
    reasoning: parts.join(' '),
    engaged: true,
  }
}
