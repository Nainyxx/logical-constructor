// Заглушка для лаб — сама лаба ещё не реализована, тут только
// переход назад в меню.
export default function LabPlaceholder({ number, onBack }) {
  return (
    <div className="stub">
      <button type="button" className="btn btn--ghost stub__back" onClick={onBack}>
        ← К списку работ
      </button>
      <div className="stub__body">
        <span className="stub__badge">Лаб. №{number}</span>
        <h1>Лабораторная работа №{number}</h1>
        <p>Задание ещё в разработке. Загляните позже.</p>
      </div>
    </div>
  )
}
