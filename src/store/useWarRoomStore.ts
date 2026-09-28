import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COUNCIL } from '../data/council'
import { isUnlockable, SKILL_TREE, getSkill } from '../data/skillTree'
import { convene } from '../engine/councilSession'
import type { CouncilSession, ReachMap } from '../types'

interface WarRoomState {
  unlockedSkillIds: string[]
  deletedSkillIds: string[]
  deletedAgentIds: string[]
  reach: ReachMap
  sessions: CouncilSession[]

  isUnlocked: (skillId: string) => boolean
  canUnlock: (skillId: string) => boolean
  toggleUnlock: (skillId: string) => void
  isSkillDeleted: (skillId: string) => boolean
  deleteSkill: (skillId: string) => void

  isAgentDeleted: (agentId: string) => boolean
  deleteAgent: (agentId: string) => void

  reachOf: (agentId: string) => string[]
  hasReach: (agentId: string, skillId: string) => boolean
  toggleReach: (agentId: string, skillId: string) => void

  runSession: (objective: string) => CouncilSession
  clearSessions: () => void
  resetAll: () => void
}

function defaultReachMap(): ReachMap {
  return Object.fromEntries(COUNCIL.map((a) => [a.id, [...a.defaultReach]]))
}

export const useWarRoomStore = create<WarRoomState>()(
  persist(
    (set, get) => ({
      unlockedSkillIds: [],
      deletedSkillIds: [],
      deletedAgentIds: [],
      reach: defaultReachMap(),
      sessions: [],

      isUnlocked: (skillId) => get().unlockedSkillIds.includes(skillId),

      canUnlock: (skillId) => {
        const skill = getSkill(skillId)
        if (!skill) return false
        return isUnlockable(skill, new Set(get().unlockedSkillIds), new Set(get().deletedSkillIds))
      },

      toggleUnlock: (skillId) =>
        set((state) => {
          const unlocked = new Set(state.unlockedSkillIds)
          const deleted = new Set(state.deletedSkillIds)
          if (unlocked.has(skillId)) {
            // Locking a skill also locks anything that depended on it.
            const toRemove = new Set([skillId])
            let changed = true
            while (changed) {
              changed = false
              for (const s of SKILL_TREE) {
                if (toRemove.has(s.id)) continue
                if (unlocked.has(s.id) && s.prerequisites.some((p) => toRemove.has(p))) {
                  toRemove.add(s.id)
                  changed = true
                }
              }
            }
            for (const id of toRemove) unlocked.delete(id)
          } else {
            const skill = getSkill(skillId)
            if (!skill || !isUnlockable(skill, unlocked, deleted)) return state
            unlocked.add(skillId)
          }
          return { unlockedSkillIds: Array.from(unlocked) }
        }),

      isSkillDeleted: (skillId) => get().deletedSkillIds.includes(skillId),

      /**
       * Permanently removes a skill card from the tree. Unlike locking, this
       * doesn't come back on its own — only "Reset OS" restores it. Clears
       * the skill out of unlock state and out of every agent's reach so no
       * stale reference lingers, and its prerequisite slot on any dependent
       * skill is treated as already satisfied (see isUnlockable).
       */
      deleteSkill: (skillId) =>
        set((state) => {
          const unlockedSkillIds = state.unlockedSkillIds.filter((id) => id !== skillId)
          const deletedSkillIds = state.deletedSkillIds.includes(skillId)
            ? state.deletedSkillIds
            : [...state.deletedSkillIds, skillId]
          const reach = Object.fromEntries(
            Object.entries(state.reach).map(([agentId, ids]) => [agentId, ids.filter((id) => id !== skillId)]),
          )
          return { unlockedSkillIds, deletedSkillIds, reach }
        }),

      isAgentDeleted: (agentId) => get().deletedAgentIds.includes(agentId),

      /** Permanently removes an agent seat from the council. Only "Reset OS" restores it. */
      deleteAgent: (agentId) =>
        set((state) => ({
          deletedAgentIds: state.deletedAgentIds.includes(agentId)
            ? state.deletedAgentIds
            : [...state.deletedAgentIds, agentId],
        })),

      reachOf: (agentId) => get().reach[agentId] ?? [],

      hasReach: (agentId, skillId) => (get().reach[agentId] ?? []).includes(skillId),

      toggleReach: (agentId, skillId) =>
        set((state) => {
          const current = state.reach[agentId] ?? []
          const next = current.includes(skillId)
            ? current.filter((id) => id !== skillId)
            : [...current, skillId]
          return { reach: { ...state.reach, [agentId]: next } }
        }),

      runSession: (objective) => {
        const state = get()
        const session = convene(
          objective,
          state.reach,
          new Set(state.unlockedSkillIds),
          new Set(state.deletedAgentIds),
        )
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, 25) }))
        return session
      },

      clearSessions: () => set({ sessions: [] }),

      resetAll: () =>
        set({
          unlockedSkillIds: [],
          deletedSkillIds: [],
          deletedAgentIds: [],
          reach: defaultReachMap(),
          sessions: [],
        }),
    }),
    { name: 'war-room-state' },
  ),
)
