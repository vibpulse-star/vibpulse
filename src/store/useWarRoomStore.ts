import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COUNCIL } from '../data/council'
import { isUnlockable, SKILL_TREE, getSkill } from '../data/skillTree'
import { convene } from '../engine/councilSession'
import type { CouncilSession, ReachMap } from '../types'

interface WarRoomState {
  unlockedSkillIds: string[]
  reach: ReachMap
  sessions: CouncilSession[]

  isUnlocked: (skillId: string) => boolean
  canUnlock: (skillId: string) => boolean
  toggleUnlock: (skillId: string) => void

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
      reach: defaultReachMap(),
      sessions: [],

      isUnlocked: (skillId) => get().unlockedSkillIds.includes(skillId),

      canUnlock: (skillId) => {
        const skill = getSkill(skillId)
        if (!skill) return false
        return isUnlockable(skill, new Set(get().unlockedSkillIds))
      },

      toggleUnlock: (skillId) =>
        set((state) => {
          const unlocked = new Set(state.unlockedSkillIds)
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
            if (!skill || !isUnlockable(skill, unlocked)) return state
            unlocked.add(skillId)
          }
          return { unlockedSkillIds: Array.from(unlocked) }
        }),

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
        const session = convene(objective, state.reach, new Set(state.unlockedSkillIds))
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, 25) }))
        return session
      },

      clearSessions: () => set({ sessions: [] }),

      resetAll: () => set({ unlockedSkillIds: [], reach: defaultReachMap(), sessions: [] }),
    }),
    { name: 'war-room-state' },
  ),
)
