import { useState } from 'react'

// Полноэкранная модалка входа/регистрации. Бэкенда нет — просто
// проверяем, что поля не пустые, и пускаем дальше, запомнив логин.
export default function AuthGate({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!login.trim() || !password.trim()) {
      setError('Заполните логин и пароль')
      return
    }
    if (password.length < 4) {
      setError('Пароль должен быть не короче 4 символов')
      return
    }
    onAuth(login.trim())
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div className="auth-modal__brand">
          <span className="auth-modal__logo">ЛС</span>
          <span>Конструктор логических схем</span>
        </div>

        <div className="auth-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            role="tab"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Логин</span>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Ваш логин"
              autoFocus
              autoComplete="username"
            />
          </label>
          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="auth-modal__error">{error}</p>}

          <button type="submit" className="btn btn--primary auth-modal__submit">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-modal__hint">
          Учебный прототип: данные никуда не отправляются и хранятся только в этом браузере.
        </p>
      </div>
    </div>
  )
}
