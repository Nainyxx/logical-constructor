// провод по ГОСТ — ломаная из горизонтальных/вертикальных отрезков, без плавных поворотов.
// провода одного выхода разводятся по «полосам» (assignTrunks), чтобы не сливались в одну линию

export const TRUNK = 24 // на сколько правее выхода проходит общая вертикаль ветвления
const LANE = 8 // шаг между соседними шинами
const MIN_RUN = 12 // минимальный горизонтальный отрезок перед входом
const DETOUR_GAP = 36 // на сколько ниже нижнего порта идёт обходной провод

// ломаная from->to: вход правее шины — два излома; вход левее — обход снизу
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

// смещения шин, чтобы вертикальные участки разных сигналов не накладывались
export function assignTrunks(groups) {
  const placed = []
  const result = new Map()
  const ordered = [...groups].sort((a, b) => a.from.x - b.from.x || a.from.y - b.from.y)

  for (const group of ordered) {
    // шина не уходит дальше ближайшего входа справа
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

// середина провода по длине пути, а не по X/Y — метка удаления всегда на линии
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
