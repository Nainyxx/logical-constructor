import { useState } from 'react'
import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import MethodologyPanel from './MethodologyPanel'
import { useCircuitState } from '../hooks/useCircuitState'
import { getLab } from '../entities/labs'

// экран лабы: библиотека, холст с вкладками заданий, методичка. у каждой вкладки свой холст
export default function LabWorkspace({ number, onBack }) {
  const lab = getLab(number)
  const [activeTab, setActiveTab] = useState(0)
  const [showMethodology, setShowMethodology] = useState(true)

  const task0 = useCircuitState(`lab:${lab.number}:0`)
  const task1 = useCircuitState(`lab:${lab.number}:1`)
  const task2 = useCircuitState(`lab:${lab.number}:2`)
  const activeCircuit = [task0, task1, task2][activeTab]

  return (
    <div className="lab">
      <header className="lab__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← К каталогу
        </button>
        <h1 className="lab__title">Лабораторная работа №{lab.number}</h1>
        <div className="lab__topbar-actions">
          <button
            type="button"
            className={`btn btn--ghost ${showMethodology ? 'is-active' : ''}`}
            onClick={() => setShowMethodology((v) => !v)}
          >
            Методичка
          </button>
        </div>
      </header>

      <div className="lab__body">
        <LibraryPanel elementIds={lab.paletteIds} />

        <div className="lab__canvas">
          <div className="lab__tabs" role="tablist">
            {lab.tasks.map((task, i) => (
              <button
                key={task.title}
                type="button"
                role="tab"
                className={activeTab === i ? 'is-active' : ''}
                onClick={() => setActiveTab(i)}
              >
                {task.title}
              </button>
            ))}
          </div>

          <Workspace key={activeTab} {...activeCircuit} />
        </div>

        {showMethodology && (
          <MethodologyPanel
            lab={lab}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onClose={() => setShowMethodology(false)}
          />
        )}
      </div>
    </div>
  )
}
