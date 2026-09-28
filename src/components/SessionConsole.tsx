import { useState } from 'react'
import { getAgent } from '../data/council'
import { useWarRoomStore } from '../store/useWarRoomStore'
import { StanceBadge } from './StatusBadge'
import type { CouncilSession } from '../types'

function SessionResult({ session }: { session: CouncilSession }) {
  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{new Date(session.timestamp).toLocaleString()}</p>
          <p className="font-mono text-sm text-slate-100">{session.objective}</p>
        </div>
        <StanceBadge stance={session.synthesis.stance} />
      </div>

      <p className="mt-2 text-sm text-slate-300">{session.synthesis.summary}</p>

      {session.synthesis.weakLinks.length > 0 && (
        <div className="mt-2 rounded border border-ember/30 bg-ember/5 p-2">
          <p className="font-mono text-[11px] font-semibold text-ember">AUDIT: WEAK LINK</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {session.synthesis.weakLinks.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {session.verdicts.map((v) => {
          const agent = getAgent(v.agentId)
          return (
            <div key={v.agentId} className={`rounded border border-ink-700 p-2 ${!v.engaged ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-200">{agent?.name}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">[{v.confidence}]</span>
                  <StanceBadge stance={v.stance} />
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{v.reasoning}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SessionConsole() {
  const [objective, setObjective] = useState('')
  const sessions = useWarRoomStore((s) => s.sessions)
  const runSession = useWarRoomStore((s) => s.runSession)

  const convene = () => {
    const trimmed = objective.trim()
    if (!trimmed) return
    runSession(trimmed)
    setObjective('')
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-700 bg-ink-900">
      <div className="border-b border-ink-700 px-4 py-3">
        <h2 className="font-mono text-sm font-semibold tracking-wide text-slate-100">CONVENE</h2>
        <p className="text-xs text-slate-500">State an objective. Only unlocked, in-reach skills get a vote.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-ink-700 p-3">
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && convene()}
          placeholder="e.g. Ship the v2 skill tree unlock flow"
          className="flex-1 rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-signal-500/60"
        />
        <button
          onClick={convene}
          disabled={!objective.trim()}
          className="rounded bg-signal-500 px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-signal-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Convene Council
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions yet. Convene the council on an objective above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <SessionResult key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
