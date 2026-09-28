import { COUNCIL } from '../data/council'
import { getSkill } from '../data/skillTree'
import type { AgentStance, AgentVerdict, CouncilSession, ReachMap } from '../types'
import { runAgentTurn } from './agentRunner'

/**
 * Convenes the full council on one objective: every agent gets a turn,
 * restricted to the skills currently inside its reach AND already unlocked
 * in the tree. Produces per-agent verdicts plus a single synthesized stance.
 */
export function convene(
  objective: string,
  reach: ReachMap,
  unlocked: ReadonlySet<string>,
  deletedAgentIds: ReadonlySet<string> = new Set(),
): CouncilSession {
  const seats = COUNCIL.filter((a) => !deletedAgentIds.has(a.id))
  const verdicts: AgentVerdict[] = seats.map((agent) => {
    const reachable = reach[agent.id] ?? agent.defaultReach
    const invokable = reachable.filter((id) => unlocked.has(id))
    const lockedInReach = reachable.filter((id) => !unlocked.has(id))
    return runAgentTurn(agent, { objective, reachable, invokable, lockedInReach })
  })

  const engaged = verdicts.filter((v) => v.engaged)
  const blockers = engaged.filter((v) => v.stance === 'block')
  const holders = engaged.filter((v) => v.stance === 'hold')

  const stance: AgentStance =
    blockers.length > 0
      ? 'block'
      : engaged.length === 0 || holders.length >= engaged.length / 2
        ? 'hold'
        : 'advance'

  const weakLinkNames = new Set<string>()
  for (const agent of seats) {
    const reachable = reach[agent.id] ?? agent.defaultReach
    for (const id of reachable) {
      if (!unlocked.has(id)) weakLinkNames.add(getSkill(id)?.name ?? id)
    }
  }
  const abstained = verdicts.filter((v) => !v.engaged).map((v) => seats.find((a) => a.id === v.agentId)?.name)
  if (abstained.length > 0) {
    weakLinkNames.add(`${abstained.length} seat(s) abstained (no unlocked skill in reach): ${abstained.join(', ')}`)
  }

  const summary =
    stance === 'block'
      ? `Block. ${blockers.length} of ${engaged.length} engaged seat(s) blocked on "${objective}" — see their reasoning before proceeding.`
      : stance === 'hold'
        ? `Hold. Council coverage on "${objective}" is insufficient to advance without more unlocked reach.`
        : `Advance. Council reached working consensus on "${objective}" with ${engaged.length - holders.length}/${engaged.length} engaged seats clear to proceed.`

  return {
    id: `session-${Date.now()}`,
    objective,
    timestamp: Date.now(),
    verdicts,
    synthesis: {
      stance,
      summary,
      weakLinks: Array.from(weakLinkNames),
    },
  }
}
