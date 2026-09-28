# War Room

War Room is the agentic OS shell: a **skill tree**, an **agent council**, and
**agent reach** binding the two together.

- **Skill Tree** — a 16-node DAG of capabilities across four tiers
  (Foundation → Operational → Strategic → Apex). A skill only unlocks once
  every prerequisite is already unlocked; locking a skill cascades to
  anything that depended on it.
- **Council** — eight standing agent seats (`src/data/council.ts`), each with
  a one-line mandate and a default reach into the skill tree.
- **Agent reach** — the explicit, per-agent mapping of which skill-tree nodes
  that seat is permitted to invoke. Reach is independent of unlock state: an
  agent can have a locked skill in reach (a standing gap, flagged in every
  session's audit) or no reach into an unlocked skill (irrelevant to it).
- **Convene** — pose an objective; every council seat gets a turn, restricted
  to skills that are both in its reach and already unlocked. Seats with zero
  invokable skills abstain rather than guess. The session synthesizes a
  single stance (`advance` / `hold` / `block`) plus a weak-link audit listing
  every locked-but-reachable gap.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run lint      # eslint
```

State (unlocked skills, per-agent reach overrides, session history) persists
to `localStorage` under the `war-room-state` key. "Reset OS" in the header
clears it back to defaults.

## Architecture

```
src/
  types.ts                 Core types: SkillNode, CouncilAgent, ReachMap, AgentVerdict, CouncilSession
  data/
    skillTree.ts            The 16-node skill DAG + unlock-eligibility helper
    council.ts               The 8 council seats + their default reach
  engine/
    agentRunner.ts            One agent's turn: verdict from (objective, reachable, invokable, gaps)
    councilSession.ts         Convenes all 8 seats, synthesizes a single stance + weak-link audit
  store/
    useWarRoomStore.ts         zustand store: unlock state, reach overrides, session history, persistence
  components/
    WarRoomLayout.tsx, SkillTreeView.tsx, CouncilPanel.tsx, AgentCard.tsx,
    ReachEditor.tsx, SessionConsole.tsx, StatusBadge.tsx
```

### Swapping in a real model

`runAgentTurn` in `src/engine/agentRunner.ts` is deliberately deterministic
and rule-based — no API key required, works standalone. To give a seat real
reasoning, replace that function's body with a call to your model of choice
(e.g. the Claude API), using `agent.mandate` as the system prompt and
`ctx.objective` plus the resolved skill descriptions as context. Keep the
return shape (`AgentVerdict`) unchanged and the rest of War Room — session
synthesis, the console, the audit — needs no changes to consume real output.
