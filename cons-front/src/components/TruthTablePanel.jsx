import Name from './Name'

// Таблица истинности собранной схемы. Строится автоматически по всем
// наборам входов (см. entities/truthTable.js); строка, соответствующая
// текущему положению тумблеров, подсвечена — так видно, какая именно
// строка таблицы сейчас на экране.
const MESSAGES = {
  empty: 'Добавьте на поле хотя бы один «Вход» и один «Выход», чтобы увидеть таблицу.',
  memory: 'В схеме есть триггер: выход зависит от предыстории, поэтому одной таблицей истинности его не описать.',
  feedback: 'В схеме есть обратная связь: выход зависит от предыстории, поэтому таблица истинности недоступна.',
  toomany: 'Слишком много входов для таблицы — оставьте не больше шести.',
}

export default function TruthTablePanel({ table }) {
  return (
    <section className="ttable">
      <h3 className="ttable__title">Таблица истинности</h3>
      {table.status !== 'ok' ? (
        <p className="ttable__note">{MESSAGES[table.status]}</p>
      ) : (
        <div className="ttable__scroll">
          <table className="ttable__table">
            <thead>
              <tr>
                {table.inputs.map((label, i) => (
                  <th key={`i${i}`}>
                    <Name>{label || '—'}</Name>
                  </th>
                ))}
                {table.outputs.map((label, i) => (
                  <th key={`o${i}`} className={i === 0 ? 'is-first-output' : ''}>
                    <Name>{label || '—'}</Name>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r} className={r === table.current ? 'is-current' : ''}>
                  {row.inputs.map((bit, i) => (
                    <td key={`i${i}`}>{bit}</td>
                  ))}
                  {row.outputs.map((bit, i) => (
                    <td key={`o${i}`} className={`${i === 0 ? 'is-first-output' : ''} ${bit ? 'is-true' : ''}`}>
                      {bit}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
