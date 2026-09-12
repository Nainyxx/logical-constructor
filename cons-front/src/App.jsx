import { useState } from 'react'
import AuthGate from './components/AuthGate'
import MainMenu from './components/MainMenu'
import LabPlaceholder from './components/LabPlaceholder'
import FreeMode from './components/FreeMode'

const AUTH_KEY = 'constructor:user'

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem(AUTH_KEY))
  const [screen, setScreen] = useState({ name: 'menu' })

  if (!user) {
    return (
      <AuthGate
        onAuth={(login) => {
          localStorage.setItem(AUTH_KEY, login)
          setUser(login)
        }}
      />
    )
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
    setScreen({ name: 'menu' })
  }

  if (screen.name === 'lab') {
    return <LabPlaceholder number={screen.number} onBack={() => setScreen({ name: 'menu' })} />
  }

  if (screen.name === 'free') {
    return <FreeMode onBack={() => setScreen({ name: 'menu' })} />
  }

  return (
    <MainMenu
      user={user}
      onOpenLab={(number) => setScreen({ name: 'lab', number })}
      onOpenFree={() => setScreen({ name: 'free' })}
      onLogout={handleLogout}
    />
  )
}
