import GateShape from './GateShape'
import { ELEMENT_TYPES, FULL_PALETTE_IDS } from '../entities/elementTypes'
import { LABS } from '../entities/labs'

// Иконка-превью карточки лабы — значок одного из элементов, изучаемых
// в этой работе. Чисто декоративно, без встроенной мини-схемы.
const LAB_ICON = { 1: 'AND', 2: 'XOR', 3: 'OR', 4: 'NAND', 5: 'NOR' }

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
              <GateShape type={ELEMENT_TYPES[LAB_ICON[lab.number]]} width={56} height={36} />
            </div>
            <span className="lab-card__badge">Лаб. №{lab.number}</span>
            <h2>{lab.title}</h2>
            <p>{lab.goal}</p>
            <div className="lab-card__footer">
              <span className="lab-card__duration">⏱ {lab.duration}</span>
              <span className="lab-card__cta">Начать →</span>
            </div>
          </button>
        ))}

        <button type="button" className="lab-card lab-card--free" onClick={onOpenFree}>
          <div className="lab-card__icon lab-card__icon--free">
            {['NOT', 'AND', 'OR'].map((id) => (
              <GateShape key={id} type={ELEMENT_TYPES[id]} width={40} height={28} />
            ))}
          </div>
          <span className="lab-card__badge lab-card__badge--accent">Свободный режим</span>
          <h2>Своя схема</h2>
          <p>Полный набор из {FULL_PALETTE_IDS.length} элементов без ограничений и заданий — экспериментируйте свободно.</p>
          <div className="lab-card__footer">
            <span className="lab-card__cta">Начать →</span>
          </div>
        </button>
      </section>
    </div>
  )
}
