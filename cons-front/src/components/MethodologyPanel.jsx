import Name from './Name'
import ReferenceGlyph from './ReferenceGlyph'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { buildTruthTable } from '../entities/truthTable'

// методичка справа: теория, тренировочный пример, задания — клик по заданию переключает вкладку
export default function MethodologyPanel({ lab, activeTab, onSelectTab, onClose }) {
  const { example } = lab

  return (
    <aside className="methodology">
      <div className="methodology__header">
        <h2>Методичка</h2>
        <button type="button" className="methodology__close" onClick={onClose} aria-label="Скрыть методичку">
          ×
        </button>
      </div>

      <div className="methodology__body">
        <section className="methodology__section">
          <h3>Цель работы</h3>
          <p className="methodology__text">{lab.goal}</p>
        </section>

        <section className="methodology__section">
          <h3>Теория</h3>
          <div className="ref-grid">
            {lab.reference.map((item) => (
              <ReferenceCard key={item.term} item={item} />
            ))}
          </div>
        </section>

        <section className="methodology__section">
          <h3>Пример работы в тренажёре</h3>
          <div className="formula-box">{example.formula}</div>
          <h4>Анализ схемы</h4>
          <p className="methodology__text">{example.analysis}</p>
          <h4>Перетащите на рабочее поле</h4>
          <ul className="bullet-list">
            {example.place.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="methodology__text">{example.label}</p>
          <h4>Соедините проводники</h4>
          <ol className="step-list">
            {example.connect.map((step, i) => (
              <li key={i}>
                <span className="step-list__num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <h4>Тестирование</h4>
          <p className="methodology__text">{example.test}</p>
          <p className="methodology__caption">Ожидаемые показания:</p>
          <RefTable table={example.check} />
        </section>

        <section className="methodology__section">
          <h3>Задания</h3>
          <p className="methodology__text">{lab.deliverable}</p>
          <div className="task-list">
            {lab.tasks.map((task, i) => {
              const isActive = activeTab === i
              return (
                <div key={task.title} className={`task-card ${isActive ? 'is-active' : ''}`}>
                  <button type="button" className="task-card__head" onClick={() => onSelectTab(i)}>
                    <span className="task-card__num">{i + 1}</span>
                    <span className="task-card__formula">{task.heading}</span>
                    <span className="task-card__chevron">{isActive ? '⌄' : '›'}</span>
                  </button>
                  {isActive && (
                    <div className="task-card__body">
                      <p>{task.statement}</p>
                      {task.points.length > 0 && (
                        <ul>
                          {task.points.map((point, j) => (
                            <li key={j}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
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
  const gate = item.gateId ? ELEMENT_TYPES[item.gateId] : null
  const table = gate ? gateTruthTable(gate) : item.table

  return (
    <div className="ref-card">
      <h4 className="ref-card__title">{item.term}</h4>
      {(gate || item.box) && (
        <div className="ref-card__glyph">
          <ReferenceGlyph item={item} />
        </div>
      )}
      <p className="ref-card__text">{item.text}</p>
      {gate && <p className="ref-card__formula">{gate.formula}</p>}
      {table && <RefTable table={table} />}
    </div>
  )
}

function gateTruthTable(type) {
  const headers = (type.inputCount === 1 ? ['A'] : ['A', 'B']).concat('Y')
  const rows = buildTruthTable(type).map((row) => [
    ...row.inputs.map((b) => (b ? 1 : 0)),
    ...row.outputs.map((b) => (b ? 1 : 0)),
  ])
  return { headers, rows, inputCols: type.inputCount }
}

// подсвечиваем 1 только в столбцах выходов, не входов
function RefTable({ table }) {
  const inputCols = table.inputCols ?? 0
  return (
    <table className="ref-table">
      <thead>
        <tr>
          {table.headers.map((h) => (
            <th key={h}>
              <Name>{h}</Name>
            </th>
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
