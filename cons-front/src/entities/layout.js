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
  const height = Math.max(MIN_HEIGHT, type.inputCount * PORT_STEP + 16)
  return { width: NODE_WIDTH, height }
}

export function getInputPortPosition(type, portIndex) {
  const { height } = getNodeSize(type)
  const slot = height / (type.inputCount + 1)
  return { x: 0, y: slot * (portIndex + 1) }
}

export function getOutputPortPosition(type) {
  const { width, height } = getNodeSize(type)
  return { x: width, y: height / 2 }
}
