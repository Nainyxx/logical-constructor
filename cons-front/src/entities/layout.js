// Геометрия элемента на холсте: размер узла и координаты его портов
// (входов/выходов) относительно левого верхнего угла. Вынесено отдельно,
// чтобы и сам узел, и слой проводов, и значок (см. symbols.js) считали
// положение портов одинаково.
//
// Все размеры кратны шагу сетки GRID (12 px): выводы вентилей лежат на
// линиях сетки, а сами узлы прилипают к ней при перетаскивании — провода
// получаются ровными, без «косых» отрезков в один-два пикселя.

// Размер "листа", по которому можно перемещаться — конечный, но
// достаточно большой, чтобы ощущаться бесконечным.
export const WORLD_SIZE = 6000

export const GRID = 12
export const LEAD = 24 // длина вывода от края узла до корпуса элемента

export function snap(value) {
  return Math.round(value / GRID) * GRID
}

const GEOMETRY = {
  // У источника ниже цифрового табло ещё и тумблер-ползунок (см.
  // ElementGlyph) — высота больше, чем у остальных «однопортовых»
  // элементов, но вывод остаётся на той же высоте (24), что и раньше.
  source: { width: 96, height: 84, inputs: [], outputs: [24] },
  sink: { width: 96, height: 48, inputs: [24], outputs: [] },
  gate1: { width: 96, height: 48, inputs: [24], outputs: [24] },
  gate2: { width: 96, height: 72, inputs: [24, 48], outputs: [36] },
}

// Функциональные узлы (HS, SM, DC, MUX, триггеры, регистры…): корпус с
// заголовком сверху и выводами по сетке. Размер зависит только от числа
// выводов, поэтому и холст, и методичка раскладывают их одинаково.
const PITCH = 24 // расстояние между выводами
const HEADER = 36 // высота заголовка (тип узла) над первым выводом
const SUBTITLE = 12 // добавка под вторую строку заголовка (стрелка сдвига)

export function boxGeometry({ inputs, outputs, subtitle, wide }) {
  const rows = Math.max(inputs.length, outputs.length)
  const header = HEADER + (subtitle ? SUBTITLE : 0)
  const width = LEAD * 2 + (wide ? 80 : 64)
  // Если выводов слева и справа поровну — они на одной высоте; иначе
  // выводы меньшей стороны растягиваются на всю высоту корпуса.
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
