// описание УГО по ГОСТ 2.743-91 — данные для BoxSymbol (один код рисует и холст, и методичку)
//
// box = {
//   width, height,
//   body: { x1, y1, x2, y2 },
//   title, titleY, subtitle,
//   inputs:  [{ y, name?, label?, dynamic? }],
//   outputs: [{ y, name?, label?, inverted?, overline? }],
// }
// name — подпись снаружи корпуса (X1, Y2), label — внутри у вывода.

import { LEAD, boxGeometry, getInputPortPosition, getNodeSize, getOutputPortPosition } from './layout'

const cache = new Map()

// значок по геометрии узла — выводы совпадают с портами на холсте
export function boxOfType(type) {
  if (cache.has(type.id)) return cache.get(type.id)

  let box
  if (type.box) {
    box = autoBox({ ...type.box, inputs: type.pins.inputs, outputs: type.pins.outputs })
  } else {
    // вентиль: корпус чуть ниже крайних выводов, обозначение по центру
    const { width, height } = getNodeSize(type)
    const margin = height === 48 ? 4 : 6
    box = {
      width,
      height,
      body: { x1: LEAD, y1: margin, x2: width - LEAD, y2: height - margin },
      title: type.symbol,
      titleY: height / 2,
      inputs: Array.from({ length: type.inputCount }, (_, i) => ({ y: getInputPortPosition(type, i).y })),
      outputs: Array.from({ length: type.outputCount ?? 0 }, (_, i) => ({
        y: getOutputPortPosition(type, i).y,
        inverted: type.negated,
      })),
    }
  }

  cache.set(type.id, box)
  return box
}

// значок функционального узла — выводы раскладываются автоматически (см. boxGeometry)
//   spec = { title, subtitle?, wide?, inputs: [pin], outputs: [pin] }
//   pin  = 'A' | { name, label?, dynamic?, inverted?, overline? }
export function autoBox(spec) {
  const toPin = (p) => (typeof p === 'string' ? { name: p } : p)
  const inputs = spec.inputs.map(toPin)
  const outputs = spec.outputs.map(toPin)
  const g = boxGeometry({ ...spec, inputs, outputs })

  return {
    width: g.width,
    height: g.height,
    body: { x1: LEAD, y1: 1, x2: g.width - LEAD, y2: g.height - 1 },
    title: spec.title,
    titleY: 14,
    subtitle: spec.subtitle,
    inputs: inputs.map((p, i) => ({ ...p, y: g.inputs[i] })),
    outputs: outputs.map((p, i) => ({ ...p, y: g.outputs[i] })),
  }
}
