import { SKILL_TIERS, SKILL_TREE } from '../data/skillTree'
import { getAgent } from '../data/council'
import { useWarRoomStore } from '../store/useWarRoomStore'
import { TierBadge } from './StatusBadge'

export function ReachEditor({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const agent = getAgent(agentId)
  const hasReach = useWarRoomStore((s) => s.hasReach)
  const toggleReach = useWarRoomStore((s) => s.toggleReach)
  const isUnlocked = useWarRoomStore((s) => s.isUnlocked)

  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="scrollbar-thin flex max-h-[80vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-ink-600 bg-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-3">
          <div>
            <h3 className="font-mono text-sm font-semibold text-slate-100">{agent.name} — Agent Reach</h3>
            <p className="text-xs text-slate-500">Toggle which skill-tree nodes this seat may invoke.</p>
          </div>
          <button onClick={onClose} className="rounded px-2 py-1 text-slate-400 hover:bg-ink-700 hover:text-slate-200">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {SKILL_TIERS.map((tier) => (
            <div key={tier}>
              <div className="mb-2 flex items-center gap-2">
                <TierBadge tier={tier} />
                <div className="h-px flex-1 bg-ink-700" />
              </div>
              <div className="flex flex-col gap-1.5">
                {SKILL_TREE.filter((s) => s.tier === tier).map((skill) => {
                  const checked = hasReach(agentId, skill.id)
                  const unlocked = isUnlocked(skill.id)
                  return (
                    <label
                      key={skill.id}
                      className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 hover:bg-ink-800"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReach(agentId, skill.id)}
                          className="h-3.5 w-3.5 accent-signal-500"
                        />
                        <span className="font-mono text-xs text-slate-200">{skill.name}</span>
                      </span>
                      <span className={`font-mono text-[10px] ${unlocked ? 'text-moss' : 'text-slate-600'}`}>
                        {unlocked ? 'unlocked' : 'locked'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
