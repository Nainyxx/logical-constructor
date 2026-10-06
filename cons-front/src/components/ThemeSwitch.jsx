import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'terminal', label: 'Терминал' },
  { id: 'pcb', label: 'Плата' },
  { id: 'retro', label: 'Ретро' },
]

const STORAGE_KEY = 'constructor.theme'

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return THEMES.some((t) => t.id === saved) ? saved : THEMES[0].id
  } catch {
    return THEMES[0].id
  }
}

// плавающий переключатель тёмных тем оформления — виден на любом экране, выбор переживает перезагрузку
export default function ThemeSwitch() {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // приватный режим браузера — просто не сохраняем выбор
    }
  }, [theme])

  return (
    <div className="theme-switch">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-switch__btn ${theme === t.id ? 'is-active' : ''}`}
          onClick={() => setTheme(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
