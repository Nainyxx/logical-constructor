import { useState } from 'react'
import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import MethodologyPanel from './MethodologyPanel'
import { useCircuitState } from '../hooks/useCircuitState'
import { getLab } from '../entities/labs'

// Экран одной лабораторной работы: библиотека слева, холст с вкладками
// посередине, методичка справа. У каждой вкладки («Тренировка» и три
// «Задания») — свой независимый холст: переключение вкладок не стирает
// то, что собрано на соседней. Ровно четыре вкладки есть у каждой
// работы, поэтому хуки состояния можно завести один раз, без условий.
export default function LabWorkspace({ number, onBack }) {
  const lab = getLab(number)
  const [activeTab, setActiveTab] = useState('training')
  const [showMethodology, setShowMethodology] = useState(true)

  const training = useCircuitState()
  const task0 = useCircuitState()
  const task1 = useCircuitState()
  const task2 = useCircuitState()
  const circuitByTab = { training, 0: task0, 1: task1, 2: task2 }
  const activeCircuit = circuitByTab[activeTab]

  return (
    <div className="lab">
      <header className="lab__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← К списку работ
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
            <button
              type="button"
              role="tab"
              className={activeTab === 'training' ? 'is-active' : ''}
              onClick={() => setActiveTab('training')}
            >
              Тренировка
            </button>
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

          <Workspace {...activeCircuit} />
        </div>

        {showMethodology && (
          <MethodologyPanel
            lab={lab}
            activeTab={activeTab === 'training' ? -1 : activeTab}
            onSelectTab={setActiveTab}
            onClose={() => setShowMethodology(false)}
          />
        )}
      </div>
    </div>
  )
}
