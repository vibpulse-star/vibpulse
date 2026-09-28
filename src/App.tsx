import { WarRoomLayout } from './components/WarRoomLayout'
import { SkillTreeView } from './components/SkillTreeView'
import { CouncilPanel } from './components/CouncilPanel'
import { SessionConsole } from './components/SessionConsole'

function App() {
  return (
    <WarRoomLayout>
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0">
          <SkillTreeView />
        </div>
        <div className="grid min-h-0 grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
          <CouncilPanel />
          <SessionConsole />
        </div>
      </div>
    </WarRoomLayout>
  )
}

export default App
