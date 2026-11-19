import { useMemo, useState } from 'react'
import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import MethodologyPanel from './MethodologyPanel'
import { useCircuitState } from '../hooks/useCircuitState'
import { getLab } from '../entities/labs'
import { isTaskComplete } from '../entities/taskCompletion'

function TaskIndicator({ task, number, circuit }) {
  const { nodes, wires } = circuit
  const done = useMemo(() => isTaskComplete(task.check, nodes, wires), [task.check, nodes, wires])
  const status = `${task.title} — ${done ? 'выполнено' : 'ещё не выполнено'}`
  return (
    <span className={`task-indicator${done ? ' is-complete' : ''}`} title={status} role="img" aria-label={status}>
      <span className="task-indicator__light" aria-hidden="true">{done ? '✓' : '−'}</span>
      {number}
    </span>
  )
}

// экран лабы: библиотека, холст с вкладками заданий, методичка. у каждой вкладки свой холст
export default function LabWorkspace({ number, onBack }) {
  const lab = getLab(number)
  const [activeTab, setActiveTab] = useState(0)
  const [showMethodology, setShowMethodology] = useState(true)

  const task0 = useCircuitState(`lab:${lab.number}:0`)
  const task1 = useCircuitState(`lab:${lab.number}:1`)
  const task2 = useCircuitState(`lab:${lab.number}:2`)
  const circuits = [task0, task1, task2]
  const activeCircuit = circuits[activeTab]

  return (
    <div className="lab">
      <header className="lab__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← К каталогу
        </button>
        <h1 className="lab__title">Лабораторная работа №{lab.number}</h1>
        <div className="lab__topbar-actions">
          <div className="task-indicators" role="group" aria-label="Выполнение заданий">
            {lab.tasks.map((task, i) => (
              <TaskIndicator key={task.check} task={task} number={i + 1} circuit={circuits[i]} />
            ))}
          </div>
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
