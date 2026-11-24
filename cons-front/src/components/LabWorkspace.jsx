import { useState } from 'react'
import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import MethodologyPanel from './MethodologyPanel'
import { useCircuitState } from '../hooks/useCircuitState'
import { getLab } from '../entities/labs'
import { useTaskReview } from '../hooks/useTaskReview'

function TaskIndicator({ task, number, done }) {
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
  const reviews = [
    useTaskReview(lab.tasks[0].check, task0),
    useTaskReview(lab.tasks[1].check, task1),
    useTaskReview(lab.tasks[2].check, task2),
  ]
  const { review, verify } = reviews[activeTab]

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
              <TaskIndicator key={task.check} task={task} number={i + 1} done={reviews[i].review?.done} />
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

          <div className="task-review">
            {lab.cumulative && activeTab > 0 && !activeCircuit.nodes.length && circuits[activeTab - 1].nodes.length > 0 && (
              <button type="button" className="btn btn--ghost" onClick={() => activeCircuit.copyFrom(circuits[activeTab - 1])}>
                Взять схему задания {activeTab}
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={verify}>Проверить выполнение задания</button>
            <span role="status">{review && (review.done ? 'Задание выполнено.' : review.error.message)}</span>
          </div>
          <Workspace key={activeTab} {...activeCircuit} error={review?.error}
            reportTitle={`Лабораторная работа №${number} · Задание ${activeTab + 1}`}
            reportIndicators={reviews.map(r => Boolean(r.review?.done))} />
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
