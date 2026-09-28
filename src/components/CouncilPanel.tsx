import { useState } from 'react'
import { COUNCIL } from '../data/council'
import { AgentCard } from './AgentCard'
import { ReachEditor } from './ReachEditor'

export function CouncilPanel() {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-700 bg-ink-900">
      <div className="border-b border-ink-700 px-4 py-3">
        <h2 className="font-mono text-sm font-semibold tracking-wide text-slate-100">AGENT COUNCIL</h2>
        <p className="text-xs text-slate-500">Eight standing seats. Reach determines what each seat can act on.</p>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COUNCIL.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onOpenReach={setOpenAgentId} />
          ))}
        </div>
      </div>
      {openAgentId && <ReachEditor agentId={openAgentId} onClose={() => setOpenAgentId(null)} />}
    </div>
  )
}
