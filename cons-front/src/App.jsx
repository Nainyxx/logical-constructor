import { useState } from 'react'
import MainMenu from './components/MainMenu'
import LabWorkspace from './components/LabWorkspace'
import FreeMode from './components/FreeMode'

// Три экрана приложения: каталог работ, конкретная лабораторная работа
// и свободный режим. Роутинг — просто локальный стейт, бэкенда и
// авторизации нет: это учебный тренажёр, открытый для всех.
export default function App() {
  const [screen, setScreen] = useState({ name: 'menu' })

  if (screen.name === 'lab') {
    return <LabWorkspace number={screen.number} onBack={() => setScreen({ name: 'menu' })} />
  }

  if (screen.name === 'free') {
    return <FreeMode onBack={() => setScreen({ name: 'menu' })} />
  }

  return (
    <MainMenu
      onOpenLab={(number) => setScreen({ name: 'lab', number })}
      onOpenFree={() => setScreen({ name: 'free' })}
    />
  )
}
