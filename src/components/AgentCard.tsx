import type { CouncilAgent } from '../types'
import { useWarRoomStore } from '../store/useWarRoomStore'

export function AgentCard({ agent, onOpenReach }: { agent: CouncilAgent; onOpenReach: (agentId: string) => void }) {
  const reach = useWarRoomStore((s) => s.reachOf(agent.id))
  const unlockedIds = useWarRoomStore((s) => s.unlockedSkillIds)
  const invokable = reach.filter((id) => unlockedIds.includes(id))
  const active = invokable.length > 0

  return (
    <div className="flex flex-col rounded-md border border-ink-700 bg-ink-800 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono text-sm font-semibold text-slate-100">{agent.name}</h3>
          <p className="text-[11px] text-slate-500">{agent.title}</p>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
            active ? 'bg-moss/15 text-moss' : 'bg-ink-600 text-slate-400'
          }`}
        >
          {active ? 'Active' : 'Standby'}
        </span>
      </div>

      <p className="mt-2 flex-1 text-xs text-slate-400">{agent.mandate}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-slate-500">
          Reach: {invokable.length}/{reach.length}
        </span>
        <button
          onClick={() => onOpenReach(agent.id)}
          className="rounded border border-ink-600 px-2 py-1 font-mono text-[11px] text-slate-300 hover:border-signal-500/50 hover:text-signal-400"
        >
          Edit reach
        </button>
      </div>
    </div>
  )
}
