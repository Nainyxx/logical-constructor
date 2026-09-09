// Список лаб — только описания для карточек-кнопок. Сама логика
// заданий сюда сознательно не входит: лабы пока не реализованы.
const LABS = [
  { number: 1, title: 'Базовые логические операции', desc: 'НЕ, И, ИЛИ — фундамент цифровой логики.' },
  { number: 2, title: 'Комбинационные схемы', desc: 'Шифраторы, дешифраторы, мультиплексоры.' },
  { number: 3, title: 'Сумматоры', desc: 'Полусумматор и полный сумматор на логических элементах.' },
  { number: 4, title: 'Триггеры и память', desc: 'RS-, D-триггеры и простейшие запоминающие устройства.' },
  { number: 5, title: 'Многоуровневые схемы', desc: 'Соединение нескольких узлов в единую систему.' },
]

export default function MainMenu({ user, onOpenLab, onOpenFree, onLogout }) {
  return (
    <div className="menu">
      <header className="menu__header">
        <div>
          <h1>Лабораторные работы</h1>
          <p>Интерактивные задания для изучения цифровой логики.</p>
        </div>
        <div className="menu__account">
          <span className="menu__user">{user}</span>
          <button type="button" className="btn btn--ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      <section className="menu__grid">
        <div className="menu__labs">
          {LABS.map((lab) => (
            <button key={lab.number} type="button" className="lab-card" onClick={() => onOpenLab(lab.number)}>
              <span className="lab-card__badge">Лаб. №{lab.number}</span>
              <h2>{lab.title}</h2>
              <p>{lab.desc}</p>
            </button>
          ))}
        </div>

        <button type="button" className="lab-card lab-card--free" onClick={onOpenFree}>
          <span className="lab-card__badge lab-card__badge--accent">Свободный режим</span>
          <h2>Своя схема</h2>
          <p>Полный набор элементов без ограничений и заданий — экспериментируйте свободно.</p>
        </button>
      </section>
    </div>
  )
}
