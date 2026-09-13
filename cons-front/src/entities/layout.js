// Геометрия элемента на холсте: размер прямоугольника и координаты его
// портов (входов/выходов) относительно левого верхнего угла узла.
// Вынесено отдельно, чтобы и сам узел, и слой проводов, и значок
// вентиля (GateShape) вычисляли положение портов одинаково.

// Размер "листа", по которому можно перемещаться — конечный, но
// достаточно большой, чтобы ощущаться бесконечным.
export const WORLD_SIZE = 6000

// У каждого вида элемента фиксированный размер — на холсте нет вентилей
// с произвольным числом входов, поэтому размеры можно подобрать руками
// так, чтобы значок (GateShape) и подписи не теснились.
const SIZE_BY_KEY = {
  source: { width: 72, height: 36 },
  sink: { width: 56, height: 56 },
  NOT: { width: 60, height: 36 },
  memory: { width: 104, height: 72 },
  gate2: { width: 72, height: 44 },
}

export function getNodeSize(type) {
  if (type.kind === 'source') return SIZE_BY_KEY.source
  if (type.kind === 'sink') return SIZE_BY_KEY.sink
  if (type.kind === 'memory') return SIZE_BY_KEY.memory
  if (type.id === 'NOT') return SIZE_BY_KEY.NOT
  return SIZE_BY_KEY.gate2
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
