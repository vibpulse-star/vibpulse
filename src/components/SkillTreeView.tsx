import { SKILL_TIERS, SKILL_TREE, getSkill } from '../data/skillTree'
import { useWarRoomStore } from '../store/useWarRoomStore'
import { TierBadge } from './StatusBadge'

export function SkillTreeView() {
  const isUnlocked = useWarRoomStore((s) => s.isUnlocked)
  const canUnlock = useWarRoomStore((s) => s.canUnlock)
  const toggleUnlock = useWarRoomStore((s) => s.toggleUnlock)
  const unlockedCount = useWarRoomStore((s) => s.unlockedSkillIds.length)

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div>
          <h2 className="font-mono text-sm font-semibold tracking-wide text-slate-100">SKILL TREE</h2>
          <p className="text-xs text-slate-500">Unlock a skill to grant it to any council seat whose reach covers it.</p>
        </div>
        <span className="font-mono text-xs text-slate-400">
          {unlockedCount}/{SKILL_TREE.length} unlocked
        </span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          {SKILL_TIERS.map((tier) => {
            const nodes = SKILL_TREE.filter((s) => s.tier === tier)
            return (
              <div key={tier}>
                <div className="mb-2 flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <div className="h-px flex-1 bg-ink-700" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {nodes.map((skill) => {
                    const unlocked = isUnlocked(skill.id)
                    const unlockable = canUnlock(skill.id)
                    const locked = !unlocked && !unlockable
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleUnlock(skill.id)}
                        disabled={locked}
                        title={
                          locked
                            ? `Locked — requires: ${skill.prerequisites.map((p) => getSkill(p)?.name ?? p).join(', ')}`
                            : skill.description
                        }
                        className={`group flex flex-col items-start rounded-md border p-3 text-left transition-colors ${
                          unlocked
                            ? 'border-moss/40 bg-moss/10 hover:bg-moss/15'
                            : unlockable
                              ? 'border-ink-600 bg-ink-800 hover:border-signal-500/50 hover:bg-ink-700'
                              : 'cursor-not-allowed border-ink-700 bg-ink-900/60 opacity-50'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-100">{skill.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {unlocked ? '● unlocked' : locked ? '🔒 locked' : '○ ready'}
                          </span>
                        </div>
                        <span className="mt-1 text-[11px] text-slate-500">{skill.category}</span>
                        <p className="mt-1 text-xs text-slate-400">{skill.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
