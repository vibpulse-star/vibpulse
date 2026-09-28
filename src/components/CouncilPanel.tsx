import { useState } from 'react'
import { COUNCIL } from '../data/council'
import { useWarRoomStore } from '../store/useWarRoomStore'
import { AgentCard } from './AgentCard'
import { ReachEditor } from './ReachEditor'

export function CouncilPanel() {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)
  const deletedAgentIds = useWarRoomStore((s) => s.deletedAgentIds)
  const activeAgents = COUNCIL.filter((a) => !deletedAgentIds.includes(a.id))

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div>
          <h2 className="font-mono text-sm font-semibold tracking-wide text-slate-100">AGENT COUNCIL</h2>
          <p className="text-xs text-slate-500">Reach determines what each seat can act on.</p>
        </div>
        <span className="font-mono text-xs text-slate-400">
          {activeAgents.length}/{COUNCIL.length} seats
          {deletedAgentIds.length > 0 && ` · ${deletedAgentIds.length} deleted`}
        </span>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {activeAgents.length === 0 ? (
          <p className="text-sm text-slate-500">No seats remain. Reset OS to restore the default council.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onOpenReach={setOpenAgentId} />
            ))}
          </div>
        )}
      </div>
      {openAgentId && !deletedAgentIds.includes(openAgentId) && (
        <ReachEditor agentId={openAgentId} onClose={() => setOpenAgentId(null)} />
      )}
    </div>
  )
}
