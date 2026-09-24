import BoxSymbol from './BoxSymbol'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { autoBox, boxOfType } from '../entities/symbols'

// значок для карточки теории — тот же ГОСТ-символ, что и на холсте
export default function ReferenceGlyph({ item, scale = 1, maxHeight }) {
  const box = item.gateId ? boxOfType(ELEMENT_TYPES[item.gateId]) : item.box ? autoBox(item.box) : null
  if (!box) return null
  const fitted = maxHeight ? Math.min(scale, maxHeight / box.height) : scale
  return <BoxSymbol box={box} scale={fitted} pad={item.gateId ? 0 : 24} />
}
