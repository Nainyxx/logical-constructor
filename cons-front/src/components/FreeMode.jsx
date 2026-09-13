import { useState } from 'react'
import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import { useCircuitState } from '../hooks/useCircuitState'

// Свободный режим: полная библиотека элементов слева и холст без
// заданий и ограничений — то же рабочее место, что и в лабораторных
// работах, просто без методички и с полным набором элементов.
export default function FreeMode({ onBack }) {
  const circuit = useCircuitState()
  const [showHint, setShowHint] = useState(true)

  return (
    <div className="lab">
      <header className="lab__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← К списку работ
        </button>
        <h1 className="lab__title">Свободный режим</h1>
        <div className="lab__topbar-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setShowHint((v) => !v)}>
            {showHint ? 'Скрыть подсказку' : 'Как пользоваться?'}
          </button>
        </div>
      </header>

      <div className="lab__body">
        <LibraryPanel />

        <div className="lab__canvas">
          {showHint && (
            <p className="app__hint">
              Перетащите элемент из библиотеки слева на поле. Тяните от кружка справа (выход) к
              кружку слева (вход) — так соединяются провода. Клик по проводу удаляет его, клик по
              «Входу» переключает 0/1, клик по подписи A/F переименовывает элемент.
              <button
                type="button"
                className="app__hint-close"
                onClick={() => setShowHint(false)}
                aria-label="Скрыть подсказку"
              >
                ×
              </button>
            </p>
          )}
          <Workspace {...circuit} />
        </div>
      </div>
    </div>
  )
}
