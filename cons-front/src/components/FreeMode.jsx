import { useState } from 'react'
import Palette from './Palette'
import Workspace from './Workspace'
import { useCircuitState } from '../hooks/useCircuitState'

// Свободный режим: полноценный холст со всеми элементами.
// Подсказку по управлению показываем один раз и даём её свернуть,
// чтобы не занимать место постоянной строкой над холстом.
export default function FreeMode({ onBack }) {
  const circuit = useCircuitState()
  const [showHint, setShowHint] = useState(true)

  return (
    <div className="app">
      <header className="app__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Меню
        </button>
        <h1 className="app__title">Свободный режим</h1>
        <div className="app__topbar-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setShowHint((v) => !v)}>
            {showHint ? 'Скрыть подсказку' : 'Как пользоваться?'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={circuit.clear}>
            Очистить поле
          </button>
        </div>
      </header>

      {showHint && (
        <p className="app__hint">
          Перетащите элемент на поле снизу. Тяните от кружка справа (выход) к кружку слева (вход) —
          так соединяются провода. Клик по проводу удаляет его, клик по «Входу» переключает 0/1.
          <button type="button" className="app__hint-close" onClick={() => setShowHint(false)} aria-label="Скрыть подсказку">
            ×
          </button>
        </p>
      )}

      <Workspace {...circuit} />
      <Palette />
    </div>
  )
}
