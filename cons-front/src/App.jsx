import { useState } from 'react'
import MainMenu from './components/MainMenu'
import LabWorkspace from './components/LabWorkspace'
import FreeMode from './components/FreeMode'

// роутинг между каталогом, лабой и свободным режимом — локальный стейт, без бэкенда
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
