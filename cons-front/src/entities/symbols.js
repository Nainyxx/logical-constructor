// Описание условных графических обозначений (УГО) по ГОСТ 2.743-91:
// прямоугольный корпус, выводы слева (входы) и справа (выходы), в верхней
// части корпуса — обозначение функции («&», «≥1», «=1», «1») или тип узла
// (HS, SM, DC, RG…), внутри у выводов — метки (D, C, S, P или номера
// разрядов). Кружок на выводе — инверсия, треугольник — динамический
// (срабатывающий по фронту) вход.
//
// Описание — обычные данные, из них BoxSymbol рисует значок. Одним и тем
// же кодом рисуются и вентили на холсте, и карточки узлов в методичке.
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

// Значок элемента библиотеки (вентиль или функциональный узел) — в точности
// по геометрии узла, поэтому выводы значка совпадают с портами на холсте.
export function boxOfType(type) {
  if (cache.has(type.id)) return cache.get(type.id)

  let box
  if (type.box) {
    box = autoBox({ ...type.box, inputs: type.pins.inputs, outputs: type.pins.outputs })
  } else {
    // Вентиль: корпус чуть ниже крайних выводов, обозначение по центру.
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

// Значок функционального узла: выводы раскладываются автоматически по
// списку — так HS, SM, DC, MUX… не надо рисовать руками (см. boxGeometry).
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
