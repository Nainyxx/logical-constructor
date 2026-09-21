// Провод по ГОСТ — ломаная линия строго из горизонтальных и вертикальных
// отрезков (без плавных поворотов), выходящая из выхода вправо и
// входящая во вход слева — как на схемах в методичках.
//
// Все провода одного выхода делают первый поворот в одном и том же
// месте (trunk правее выхода): получается общая вертикальная «шина», а
// в точке ветвления рисуется точка-узел (см. WireLayer), как в методичках.
// Чтобы шины разных выходов не сливались в одну линию, WireLayer разводит
// их по «полосам» (assignTrunks): каждая шина сдвигается на LANE вправо,
// пока не перестанет накладываться на уже проложенную.

export const TRUNK = 24 // на сколько правее выхода проходит общая вертикаль ветвления
const LANE = 8 // шаг между соседними шинами
const MIN_RUN = 12 // минимальный горизонтальный отрезок перед входом
const DETOUR_GAP = 36 // на сколько ниже нижнего порта идёт обходной провод

/**
 * Ломаная между выходом (from) и входом (to) в виде списка вершин.
 * Если вход правее шины — обычный маршрут в два излома. Если вход левее
 * или вплотную к выходу — обходной: провод уходит вниз под оба элемента
 * и заходит во вход слева (как реальный провод, который нельзя провести
 * сквозь корпус элемента).
 */
export function routePoints(from, to, trunk = TRUNK) {
  if (from.y === to.y && to.x > from.x) return [from, to]

  const trunkX = from.x + trunk
  if (to.x - trunkX >= MIN_RUN) {
    return [from, { x: trunkX, y: from.y }, { x: trunkX, y: to.y }, to]
  }

  const enterX = to.x - TRUNK
  const detourY = Math.max(from.y, to.y) + DETOUR_GAP
  return [
    from,
    { x: trunkX, y: from.y },
    { x: trunkX, y: detourY },
    { x: enterX, y: detourY },
    { x: enterX, y: to.y },
    to,
  ]
}

/**
 * Раздаёт шинам выходов смещения так, чтобы вертикальные участки разных
 * сигналов не ложились друг на друга.
 * @param {Array<{ key: string, from: {x, y}, ys: number[], xs: number[] }>} groups по одной записи
 *   на выход: from — точка выхода, xs/ys — координаты всех входов, куда идут его провода
 * @returns {Map<string, number>} key -> смещение шины от выхода
 */
export function assignTrunks(groups) {
  const placed = []
  const result = new Map()
  const ordered = [...groups].sort((a, b) => a.from.x - b.from.x || a.from.y - b.from.y)

  for (const group of ordered) {
    // Шина не должна уходить дальше, чем позволяет ближайший вход справа.
    let cap = Infinity
    for (const x of group.xs) {
      const dx = x - group.from.x
      if (dx >= MIN_RUN * 2) cap = Math.min(cap, dx - MIN_RUN)
    }
    const base = Math.min(TRUNK, cap)
    const top = Math.min(group.from.y, ...group.ys) - 4
    const bottom = Math.max(group.from.y, ...group.ys) + 4
    let offset = base
    while (
      offset + LANE <= cap &&
      placed.some((p) => p.x === group.from.x + offset && p.top <= bottom && top <= p.bottom)
    ) {
      offset += LANE
    }
    placed.push({ x: group.from.x + offset, top, bottom })
    result.set(group.key, offset)
  }
  return result
}

export function pointsToPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
}

// Середина провода по пройденной длине (не по X/Y) — так метка удаления
// всегда сидит на самой линии, даже у длинных обходных маршрутов.
export function pathMidpoint(points) {
  const lengths = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    lengths.push(len)
    total += len
  }

  let remaining = total / 2
  for (let i = 0; i < lengths.length; i++) {
    const isLast = i === lengths.length - 1
    if (remaining <= lengths[i] || isLast) {
      const t = lengths[i] ? Math.min(remaining / lengths[i], 1) : 0
      const p0 = points[i]
      const p1 = points[i + 1]
      return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t }
    }
    remaining -= lengths[i]
  }
  return points[0]
}
