import BoxSymbol from './BoxSymbol'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { autoBox, boxOfType } from '../entities/symbols'

// Значок карточки теории: готовый вентиль (gateId) или функциональный
// узел (box) — тот же ГОСТ-значок, что и на холсте. maxHeight ужимает
// значок, если высокий узел (MUX, RG) не помещается в отведённое место.
export default function ReferenceGlyph({ item, scale = 1, maxHeight }) {
  const box = item.gateId ? boxOfType(ELEMENT_TYPES[item.gateId]) : item.box ? autoBox(item.box) : null
  if (!box) return null
  const fitted = maxHeight ? Math.min(scale, maxHeight / box.height) : scale
  return <BoxSymbol box={box} scale={fitted} pad={item.gateId ? 0 : 24} />
}
