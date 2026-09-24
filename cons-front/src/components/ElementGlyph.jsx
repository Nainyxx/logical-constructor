import BoxSymbol from './BoxSymbol'
import { boxOfType } from '../entities/symbols'

// тело элемента: ГОСТ-значок (BoxSymbol) для вентилей, табло+тумблер для
// входа, индикатор для выхода. preview — статичный снимок для библиотеки, без тумблера
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
