import ReferenceGlyph from './ReferenceGlyph'
import { FULL_PALETTE_IDS } from '../entities/elementTypes'
import { LABS } from '../entities/labs'

// каталог: пять лаб + свободный режим, на карточках — значки изучаемых узлов
export default function MainMenu({ onOpenLab, onOpenFree }) {
  return (
    <div className="menu">
      <header className="menu__header">
        <span className="menu__kicker">Программный комплекс по дисциплине «Схемотехника ЭВМ»</span>
        <h1>Лабораторные работы</h1>
        <p>Интерактивные задания для изучения цифровой логики. Собирайте схемы, проверяйте их работу и закрепляйте знания на практике.</p>
        <div className="menu__downloads">
          <a className="btn btn--ghost" href="/docs/vse-laby.docx" download>
            Скачать все лабы (Word)
          </a>
          <a className="btn btn--ghost" href="/docs/shablon-otcheta.docx" download>
            Скачать шаблон отчёта
          </a>
          <a className="btn btn--ghost" href="/docs/rukovodstvo-polzovatelya.docx" download>
            Руководство пользователя
          </a>
        </div>
      </header>

      <section className="menu__grid">
        {LABS.map((lab) => (
          <div
            key={lab.number}
            className="lab-card"
            role="button"
            tabIndex={0}
            onClick={() => onOpenLab(lab.number)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenLab(lab.number)}
          >
            <div className="lab-card__icon">
              {lab.reference
                .filter((item) => item.gateId || item.box)
                .slice(0, 3)
                .map((item) => (
                  <ReferenceGlyph key={item.term} item={item} scale={0.6} maxHeight={84} />
                ))}
            </div>
            <div className="lab-card__top-row">
              <span className="lab-card__badge">Лабораторная работа №{lab.number}</span>
              <a
                className="lab-card__download"
                href={`/docs/lab-${lab.number}.docx`}
                download
                title="Скачать методичку (Word)"
                onClick={(e) => e.stopPropagation()}
              >
                Методичка
              </a>
            </div>
            <h2>{lab.title}</h2>
            <p>{lab.goal}</p>
            <div className="lab-card__footer">
              <span className="lab-card__cta">Начать →</span>
            </div>
          </div>
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
