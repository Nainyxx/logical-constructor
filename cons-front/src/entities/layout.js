// Геометрия элемента на холсте: размер прямоугольника и координаты его
// портов (входов/выхода) относительно левого верхнего угла узла.
// Вынесено отдельно, чтобы и сам узел, и слой проводов
// вычисляли положение портов одинаково.

// Размер "листа", по которому можно перемещаться — конечный, но
// достаточно большой, чтобы ощущаться бесконечным.
export const WORLD_SIZE = 6000

export const NODE_WIDTH = 96
const PORT_STEP = 32
const MIN_HEIGHT = 56

export function getNodeSize(type) {
  // Высота входа и выхода равна минимальной высоте вентиля — на холсте
  // все элементы должны читаться как один "весовой класс", а не
  // теряться рядом с более крупными гейтами.
  if (type.kind === 'source') return { width: 80, height: MIN_HEIGHT }
  if (type.kind === 'sink') return { width: 64, height: MIN_HEIGHT }
  const ports = Math.max(type.inputCount, type.outputCount ?? 1)
  const height = Math.max(MIN_HEIGHT, ports * PORT_STEP + 16)
  // Элементам с подписанными входами/выходами (шифратор, триггер и т.п.)
  // нужно больше места по ширине, чтобы подписи не наезжали на символ.
  const hasLabels = Boolean(type.inputLabels || type.outputLabels)
  const width = hasLabels ? NODE_WIDTH + 40 : NODE_WIDTH
  return { width, height }
}

export function getInputPortPosition(type, portIndex) {
  const { height } = getNodeSize(type)
  const slot = height / (type.inputCount + 1)
  return { x: 0, y: slot * (portIndex + 1) }
}

export function getOutputPortPosition(type, portIndex = 0) {
  const { width, height } = getNodeSize(type)
  const count = type.outputCount ?? 1
  if (count <= 1) return { x: width, y: height / 2 }
  const slot = height / (count + 1)
  return { x: width, y: slot * (portIndex + 1) }
}
