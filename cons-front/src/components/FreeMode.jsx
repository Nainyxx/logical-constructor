import LibraryPanel from './LibraryPanel'
import Workspace from './Workspace'
import { FULL_PALETTE_GROUPS } from '../entities/elementTypes'
import { useCircuitState } from '../hooks/useCircuitState'

// Свободный режим: полная библиотека элементов слева и холст без
// заданий и ограничений — то же рабочее место, что и в лабораторных
// работах, просто без методички, с полным набором элементов и сразу
// открытой таблицей истинности.
export default function FreeMode({ onBack }) {
  const circuit = useCircuitState()

  return (
    <div className="lab">
      <header className="lab__topbar">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← К каталогу
        </button>
        <h1 className="lab__title">Свободный режим</h1>
      </header>

      <div className="lab__body">
        <LibraryPanel groups={FULL_PALETTE_GROUPS} />

        <div className="lab__canvas">
          <Workspace
            {...circuit}
            tableOpenByDefault
            emptyHint="Перетащите элементы из библиотеки на поле и соедините их проводниками. Схема считается сразу, а внизу строится её таблица истинности."
          />
        </div>
      </div>
    </div>
  )
}
