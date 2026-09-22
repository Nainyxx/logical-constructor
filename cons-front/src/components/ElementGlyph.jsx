import BoxSymbol from './BoxSymbol'
import { boxOfType } from '../entities/symbols'

// Визуальное "тело" элемента: УГО по ГОСТ для вентилей и триггеров
// (BoxSymbol), цифровое табло + тумблер-ползунок для входа, круглый
// индикатор для выхода.
//
// У табло, тумблера и индикатора фиксированный размер, а узел лишь
// позиционирует их: вывод-провод слева/справа заканчивается ровно на
// порте узла. Переключают вход и клик по всему узлу (см. Workspace —
// клик без перетаскивания), и клик по самому тумблеру: оба попадают в
// одну и ту же область узла, поэтому отдельный обработчик не нужен.
//
// preview — рисуем статичный "снимок" для карточки библиотеки: без
// тумблера, он там не нужен (не кликабелен, не отражает реальный сигнал).
export default function ElementGlyph({ type, on, scale = 1, preview = false }) {
  if (type.kind === 'source') {
    return (
      <div className="glyph glyph--source">
        <span className={`switch ${on ? 'is-on' : ''}`}>{on ? 1 : 0}</span>
        <span className={`lead lead--right ${on ? 'is-on' : ''}`} />
        {!preview && (
          <span className={`toggle ${on ? 'is-on' : ''}`}>
            <span className="toggle__knob" />
          </span>
        )}
      </div>
    )
  }

  if (type.kind === 'sink') {
    return (
      <div className="glyph glyph--sink">
        <span className={`lead lead--left ${on ? 'is-on' : ''}`} />
        <span className={`indicator ${on ? 'is-on' : ''}`}>{on ? 1 : 0}</span>
      </div>
    )
  }

  return <BoxSymbol box={boxOfType(type)} scale={scale} />
}
