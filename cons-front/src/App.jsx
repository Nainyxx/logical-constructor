import Palette from './components/Palette'
import Workspace from './components/Workspace'
import { useCircuitState } from './hooks/useCircuitState'

export default function App() {
  const circuit = useCircuitState()

  return (
    <div className="app">
      <header className="app__hint">
        Перетащите элемент на поле снизу. Тяните от кружка справа (выход) к кружку слева (вход) —
        так соединяются провода. Клик по проводу удаляет его, клик по «Входу» переключает 0/1.
      </header>
      <Workspace {...circuit} />
      <Palette />
    </div>
  )
}
