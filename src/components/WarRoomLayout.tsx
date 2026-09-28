import type { ReactNode } from 'react'
import { useWarRoomStore } from '../store/useWarRoomStore'
import { SKILL_TREE } from '../data/skillTree'

export function WarRoomLayout({ children }: { children: ReactNode }) {
  const unlockedCount = useWarRoomStore((s) => s.unlockedSkillIds.length)
  const sessionCount = useWarRoomStore((s) => s.sessions.length)
  const resetAll = useWarRoomStore((s) => s.resetAll)

  return (
    <div className="flex h-screen flex-col bg-ink-950">
      <header className="flex shrink-0 items-center justify-between border-b border-ink-700 bg-ink-900/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-signal-500/15 font-mono text-sm font-bold text-signal-400">
            WR
          </div>
          <div>
            <h1 className="font-mono text-base font-semibold tracking-widest text-slate-100">WAR ROOM</h1>
            <p className="text-[11px] text-slate-500">Agentic OS — Skill Tree · Council · Agent Reach</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-slate-500">
            {unlockedCount}/{SKILL_TREE.length} skills · {sessionCount} sessions
          </span>
          <button
            onClick={() => {
              if (confirm('Reset all skill unlocks, agent reach, and session history?')) resetAll()
            }}
            className="rounded border border-ink-600 px-2.5 py-1 font-mono text-[11px] text-slate-400 hover:border-signal-500/50 hover:text-signal-400"
          >
            Reset OS
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 p-4">{children}</main>
    </div>
  )
}
