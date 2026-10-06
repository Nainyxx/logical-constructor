import { useState } from 'react'
import MainMenu from './components/MainMenu'
import LabWorkspace from './components/LabWorkspace'
import FreeMode from './components/FreeMode'
import ThemeSwitch from './components/ThemeSwitch'

// роутинг между каталогом, лабой и свободным режимом — локальный стейт, без бэкенда
export default function App() {
  const [screen, setScreen] = useState({ name: 'menu' })

  let content
  if (screen.name === 'lab') {
    content = <LabWorkspace number={screen.number} onBack={() => setScreen({ name: 'menu' })} />
  } else if (screen.name === 'free') {
    content = <FreeMode onBack={() => setScreen({ name: 'menu' })} />
  } else {
    content = (
      <MainMenu
        onOpenLab={(number) => setScreen({ name: 'lab', number })}
        onOpenFree={() => setScreen({ name: 'free' })}
      />
    )
  }

  return (
    <>
      {content}
      <ThemeSwitch />
    </>
  )
}
