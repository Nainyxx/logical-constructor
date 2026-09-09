import { WORLD_SIZE, getInputPortPosition, getOutputPortPosition } from '../entities/layout'

// SVG-слой поверх всех узлов, рисующий провода между портами и
// "черновой" провод во время перетаскивания нового соединения.
//
// У каждого провода два наложенных path: тонкий видимый и толстый
// прозрачный "hit" поверх него — так провод легко подцепить курсором,
// не попадая точно в линию толщиной в пару пикселей.
export default function WireLayer({ nodes, wires, values, draftWire, onDeleteWire }) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  function outputPoint(nodeId) {
    const node = nodeById.get(nodeId)
    if (!node) return null
    const pos = getOutputPortPosition(node.type)
    return { x: node.x + pos.x, y: node.y + pos.y }
  }

  function inputPoint(nodeId, portIndex) {
    const node = nodeById.get(nodeId)
    if (!node) return null
    const pos = getInputPortPosition(node.type, portIndex)
    return { x: node.x + pos.x, y: node.y + pos.y }
  }

  function bend(from, to) {
    return Math.min(Math.max(Math.abs(to.x - from.x) / 2, 40), 160)
  }

  function curvePath(from, to) {
    const b = bend(from, to)
    return `M ${from.x} ${from.y} C ${from.x + b} ${from.y}, ${to.x - b} ${to.y}, ${to.x} ${to.y}`
  }

  // Точка на середине кривой (t = 0.5) — там рисуем метку удаления при наведении.
  function curveMidpoint(from, to) {
    const b = bend(from, to)
    const p1 = { x: from.x + b, y: from.y }
    const p2 = { x: to.x - b, y: to.y }
    return {
      x: (from.x + 3 * p1.x + 3 * p2.x + to.x) / 8,
      y: (from.y + 3 * p1.y + 3 * p2.y + to.y) / 8,
    }
  }

  return (
    <svg className="wires" width={WORLD_SIZE} height={WORLD_SIZE}>
      {wires.map((wire) => {
        const from = outputPoint(wire.fromNodeId)
        const to = inputPoint(wire.toNodeId, wire.toPort)
        if (!from || !to) return null
        const live = values.get(wire.fromNodeId)
        const mid = curveMidpoint(from, to)

        return (
          <g key={wire.id} className="wire-group">
            <path
              d={curvePath(from, to)}
              className="wire-hit"
              onPointerDown={(e) => {
                e.stopPropagation()
                onDeleteWire(wire.id)
              }}
            />
            <path d={curvePath(from, to)} className={`wire-visible ${live ? 'is-live' : ''}`} />
            <g className="wire-marker" transform={`translate(${mid.x}, ${mid.y})`}>
              <circle r="8" />
              <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" />
            </g>
          </g>
        )
      })}

      {draftWire &&
        (() => {
          const from = outputPoint(draftWire.fromNodeId)
          if (!from) return null
          return <path d={curvePath(from, draftWire)} className="wire-visible wire--draft" />
        })()}
    </svg>
  )
}
