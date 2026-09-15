// Провод по ГОСТ — ломаная линия строго из горизонтальных и вертикальных
// отрезков (без плавных поворотов), выходящая из выхода вправо и
// входящая во вход слева — как на схемах в методичках.

const MIN_STUB = 24 // минимальная длина горизонтального отрезка у самого порта
const DETOUR_GAP = 28 // на сколько провод уходит за пределы обеих точек в обходном маршруте

/**
 * Ломаная между выходом (from) и входом (to) в виде списка вершин.
 * Если вход находится правее выхода — обычный Z-образный маршрут в два
 * излома. Если вход находится левее или совсем рядом по X — обходной
 * маршрут: короткий отрезок от каждого порта наружу, затем провод
 * уходит за нижнюю точку и заходит во вход с его стороны (как реальный
 * провод, который нельзя провести сквозь корпус элемента).
 */
export function routePoints(from, to) {
  if (from.y === to.y) return [from, to]

  const dx = to.x - from.x
  if (dx >= MIN_STUB * 2) {
    const midX = from.x + dx / 2
    return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to]
  }

  const exitX = from.x + MIN_STUB
  const enterX = to.x - MIN_STUB
  const detourY = Math.max(from.y, to.y) + DETOUR_GAP
  return [
    from,
    { x: exitX, y: from.y },
    { x: exitX, y: detourY },
    { x: enterX, y: detourY },
    { x: enterX, y: to.y },
    to,
  ]
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
