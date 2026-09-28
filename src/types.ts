export type SkillTier = 'foundation' | 'operational' | 'strategic' | 'apex'

export interface SkillNode {
  id: string
  name: string
  tier: SkillTier
  category: string
  description: string
  /** Skill ids that must be unlocked before this one can be. */
  prerequisites: string[]
}

export type AgentStance = 'advance' | 'hold' | 'block'

export interface CouncilAgent {
  id: string
  name: string
  title: string
  /** One-line mandate — what this seat exists to protect or produce. */
  mandate: string
  /** Skill ids this agent is permitted to invoke by default (its starting "reach"). */
  defaultReach: string[]
}

/** agentId -> set of skillIds that agent is currently permitted to invoke. */
export type ReachMap = Record<string, string[]>

export interface AgentVerdict {
  agentId: string
  /** Skills this agent actually drew on for this verdict (reachable AND unlocked). */
  skillsInvoked: string[]
  stance: AgentStance
  confidence: 'Certain' | 'Likely' | 'Guessing'
  reasoning: string
  engaged: boolean
}

export interface CouncilSession {
  id: string
  objective: string
  timestamp: number
  verdicts: AgentVerdict[]
  synthesis: {
    stance: AgentStance
    summary: string
    weakLinks: string[]
  }
}
