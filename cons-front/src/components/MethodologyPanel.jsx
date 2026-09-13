import GateShape from './GateShape'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { buildTruthTable } from '../entities/truthTable'

// Правая панель — методичка лабораторной работы: цель, краткая теория
// по нужным для неё элементам (значок + таблица истинности строятся
// автоматически по самому элементу — методичка не может разойтись с
// тем, что реально считает схема), тренировочный пример и список
// заданий. Клик по заданию переключает вкладку холста на него.
export default function MethodologyPanel({ lab, activeTab, onSelectTab, onClose }) {
  return (
    <aside className="methodology">
      <div className="methodology__header">
        <h2>Методичка</h2>
        <button type="button" className="methodology__close" onClick={onClose} aria-label="Скрыть методичку">
          ×
        </button>
      </div>

      <div className="methodology__body">
        <p className="methodology__goal">{lab.goal}</p>

        <section className="methodology__section">
          <h3>Теория</h3>
          <div className="ref-grid">
            {lab.reference.map((item) => (
              <ReferenceCard key={item.term} item={item} />
            ))}
          </div>
        </section>

        <section className="methodology__section">
          <h3>Тренировочный пример</h3>
          <p className="methodology__section-hint">Построим схему:</p>
          <div className="formula-box">{lab.example.formula}</div>
          <ol className="step-list">
            {lab.example.steps.map((step, i) => (
              <li key={i}>
                <span className="step-list__num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="methodology__try-btn" onClick={() => onSelectTab('training')}>
            Открыть вкладку «Тренировка» →
          </button>
        </section>

        <section className="methodology__section">
          <h3>Задания</h3>
          <p className="methodology__section-hint">{lab.deliverable}</p>
          <div className="task-list">
            {lab.tasks.map((task, i) => {
              const isActive = activeTab === i
              return (
                <div key={task.title} className={`task-card ${isActive ? 'is-active' : ''}`}>
                  <button type="button" className="task-card__head" onClick={() => onSelectTab(i)}>
                    <span className="task-card__num">{i + 1}</span>
                    <span className="task-card__formula">{task.formula}</span>
                    <span className="task-card__chevron">{isActive ? '⌄' : '›'}</span>
                  </button>
                  {isActive && (
                    <ul className="task-card__points">
                      {task.points.map((point, j) => (
                        <li key={j}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </aside>
  )
}

function ReferenceCard({ item }) {
  const type = item.gateId ? ELEMENT_TYPES[item.gateId] : null
  const table = type ? gateTruthTable(type) : item.table

  return (
    <div className="ref-card">
      <div className="ref-card__head">
        {type && (
          <div className="ref-card__glyph">
            <GateShape type={type} width={56} height={36} />
          </div>
        )}
        <div>
          <h4>{item.term}</h4>
          <p>{item.formula ?? type?.description}</p>
        </div>
      </div>
      <TruthTable table={table} />
    </div>
  )
}

function gateTruthTable(type) {
  const headers = (type.inputCount === 1 ? ['A'] : ['A', 'B']).concat(type.outputLabels ?? ['Y'])
  const rows = buildTruthTable(type).map((row) => [
    ...row.inputs.map((b) => (b ? 1 : 0)),
    ...row.outputs.map((b) => (b ? 1 : 0)),
  ])
  return { headers, rows, inputCols: type.inputCount }
}

// Подсвечиваем зелёным только значения 1 в столбцах ВЫХОДОВ — иначе
// единицы во входных столбцах (которые просто перечисляют все наборы
// сигналов) выглядели бы как «интересный», особенный результат.
function TruthTable({ table }) {
  const inputCols = table.inputCols ?? 0
  return (
    <table className="ref-table">
      <thead>
        <tr>
          {table.headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className={j >= inputCols && cell === 1 ? 'is-true' : ''}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
