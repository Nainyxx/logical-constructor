// геометрия узла и его портов — общая для холста, проводов и значков (symbols.js)
// все размеры кратны GRID, поэтому провода не получаются «косыми»

export const WORLD_SIZE = 6000 // конечный, но достаточно большой, чтобы ощущаться бесконечным

export const GRID = 12
export const LEAD = 24 // длина вывода от края узла до корпуса элемента

export function snap(value) {
  return Math.round(value / GRID) * GRID
}

const GEOMETRY = {
  source: { width: 96, height: 84, inputs: [], outputs: [24] }, // выше остальных — под тумблером (ElementGlyph)
  sink: { width: 96, height: 48, inputs: [24], outputs: [] },
  gate1: { width: 96, height: 48, inputs: [24], outputs: [24] },
  gate2: { width: 96, height: 72, inputs: [24, 48], outputs: [36] },
}

// функциональные узлы (HS, SM, DC, MUX, триггеры, регистры): корпус + выводы по сетке
const PITCH = 24 // расстояние между выводами
const HEADER = 36 // высота заголовка (тип узла) над первым выводом
const SUBTITLE = 12 // добавка под вторую строку заголовка (стрелка сдвига)

export function boxGeometry({ inputs, outputs, subtitle, wide }) {
  const rows = Math.max(inputs.length, outputs.length)
  const header = HEADER + (subtitle ? SUBTITLE : 0)
  const width = LEAD * 2 + (wide ? 80 : 64)
  // при разном числе выводов слева/справа — меньшая сторона растягивается на всю высоту
  const place = (n) =>
    Array.from({ length: n }, (_, i) =>
      n === rows ? header + i * PITCH + PITCH / 2 : header + ((i + 0.5) * rows * PITCH) / n,
    )
  return { width, height: header + rows * PITCH, header, inputs: place(inputs.length), outputs: place(outputs.length) }
}

const boxCache = new Map()

function geometryOf(type) {
  if (type.box) {
    if (!boxCache.has(type.id)) {
      boxCache.set(type.id, boxGeometry({ ...type.box, inputs: type.pins.inputs, outputs: type.pins.outputs }))
    }
    return boxCache.get(type.id)
  }
  if (type.kind === 'source' || type.kind === 'sink') return GEOMETRY[type.kind]
  return type.inputCount === 1 ? GEOMETRY.gate1 : GEOMETRY.gate2
}

export function getNodeSize(type) {
  const { width, height } = geometryOf(type)
  return { width, height }
}

export function getInputPortPosition(type, portIndex) {
  return { x: 0, y: geometryOf(type).inputs[portIndex] }
}

export function getOutputPortPosition(type, portIndex = 0) {
  const g = geometryOf(type)
  return { x: g.width, y: g.outputs[portIndex] }
}
