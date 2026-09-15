import { WORLD_SIZE, getInputPortPosition, getOutputPortPosition } from '../entities/layout'
import { pathMidpoint, pointsToPath, routePoints } from '../entities/wireRouting'

// SVG-слой поверх всех узлов, рисующий провода между портами и
// "черновой" провод во время перетаскивания нового соединения.
//
// У каждого провода два наложенных path: тонкий видимый и толстый
// прозрачный "hit" поверх него — так провод легко подцепить курсором,
// не попадая точно в линию толщиной в пару пикселей.
export default function WireLayer({ nodes, wires, values, draftWire, onDeleteWire }) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  function outputPoint(nodeId, portIndex = 0) {
    const node = nodeById.get(nodeId)
    if (!node) return null
    const pos = getOutputPortPosition(node.type, portIndex)
    return { x: node.x + pos.x, y: node.y + pos.y }
  }

  function inputPoint(nodeId, portIndex) {
    const node = nodeById.get(nodeId)
    if (!node) return null
    const pos = getInputPortPosition(node.type, portIndex)
    return { x: node.x + pos.x, y: node.y + pos.y }
  }

  return (
    <svg className="wires" width={WORLD_SIZE} height={WORLD_SIZE}>
      {wires.map((wire) => {
        const from = outputPoint(wire.fromNodeId, wire.fromPort ?? 0)
        const to = inputPoint(wire.toNodeId, wire.toPort)
        if (!from || !to) return null
        const live = values.get(wire.fromNodeId)?.outputs?.[wire.fromPort ?? 0]
        const points = routePoints(from, to)
        const d = pointsToPath(points)
        const mid = pathMidpoint(points)

        return (
          <g key={wire.id} className="wire-group">
            <path
              d={d}
              className="wire-hit"
              onPointerDown={(e) => {
                e.stopPropagation()
                onDeleteWire(wire.id)
              }}
            />
            <path d={d} className={`wire-visible ${live ? 'is-live' : ''}`} />
            <g className="wire-marker" transform={`translate(${mid.x}, ${mid.y})`}>
              <circle r="8" />
              <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" />
            </g>
          </g>
        )
      })}

      {draftWire &&
        (() => {
          const from = outputPoint(draftWire.fromNodeId, draftWire.fromPort ?? 0)
          if (!from) return null
          return <path d={pointsToPath(routePoints(from, draftWire))} className="wire-visible wire--draft" />
        })()}
    </svg>
  )
}
