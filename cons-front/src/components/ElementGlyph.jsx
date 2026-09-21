import BoxSymbol from './BoxSymbol'
import { boxOfType } from '../entities/symbols'

// Визуальное "тело" элемента: УГО по ГОСТ для вентилей и триггеров
// (BoxSymbol), тумблер для входа и круглый индикатор для выхода.
//
// У тумблера и индикатора фиксированный размер, а узел лишь позиционирует
// их: вывод-провод слева/справа от них заканчивается ровно на порте узла.
export default function ElementGlyph({ type, on, scale = 1 }) {
  if (type.kind === 'source') {
    return (
      <div className="glyph glyph--source">
        <span className={`switch ${on ? 'is-on' : ''}`}>{on ? 1 : 0}</span>
        <span className={`lead lead--right ${on ? 'is-on' : ''}`} />
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
