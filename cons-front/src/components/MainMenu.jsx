import ReferenceGlyph from './ReferenceGlyph'
import { FULL_PALETTE_IDS } from '../entities/elementTypes'
import { LABS } from '../entities/labs'

// Каталог: пять лабораторных работ по методичкам и свободный режим.
// На карточке — значки узлов, которые изучаются в работе (те же ГОСТ-значки,
// что и в тренажёре и в методичке).
export default function MainMenu({ onOpenLab, onOpenFree }) {
  return (
    <div className="menu">
      <header className="menu__header">
        <h1>Лабораторные работы</h1>
        <p>Интерактивные задания для изучения цифровой логики. Собирайте схемы, проверяйте их работу и закрепляйте знания на практике.</p>
      </header>

      <section className="menu__grid">
        {LABS.map((lab) => (
          <button key={lab.number} type="button" className="lab-card" onClick={() => onOpenLab(lab.number)}>
            <div className="lab-card__icon">
              {lab.reference
                .filter((item) => item.gateId || item.box)
                .slice(0, 3)
                .map((item) => (
                  <ReferenceGlyph key={item.term} item={item} scale={0.6} maxHeight={84} />
                ))}
            </div>
            <span className="lab-card__badge">Лабораторная работа №{lab.number}</span>
            <h2>{lab.title}</h2>
            <p>{lab.goal}</p>
            <div className="lab-card__footer">
              <span className="lab-card__cta">Начать →</span>
            </div>
          </button>
        ))}

        <button type="button" className="lab-card lab-card--free" onClick={onOpenFree}>
          <div className="lab-card__icon">
            {['NOT', 'AND', 'OR'].map((id) => (
              <ReferenceGlyph key={id} item={{ gateId: id }} scale={0.6} />
            ))}
          </div>
          <span className="lab-card__badge lab-card__badge--accent">Свободный режим</span>
          <h2>Своя схема</h2>
          <p>
            Полный набор элементов из методичек — от вентилей до триггеров и регистров ({FULL_PALETTE_IDS.length} шт.), без
            заданий и ограничений. Собирайте любые схемы и смотрите их таблицу истинности.
          </p>
          <div className="lab-card__footer">
            <span className="lab-card__cta">Начать →</span>
          </div>
        </button>
      </section>
    </div>
  )
}
