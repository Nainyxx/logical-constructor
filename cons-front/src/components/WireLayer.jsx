import { WORLD_SIZE, getInputPortPosition, getOutputPortPosition } from '../entities/layout'
import { assignTrunks, pathMidpoint, pointsToPath, routePoints } from '../entities/wireRouting'

// SVG-слой проводов: у каждого — тонкий видимый path + толстый прозрачный
// hit-path поверх, чтобы легче попадать курсором. Точка-узел — на ветвлении.
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

  // группируем провода по выходам, затем раздаём шины (assignTrunks)
  const outputs = new Map() // "узел:порт" -> { key, from, ys, live }
  const resolved = wires
    .map((wire) => {
      const from = outputPoint(wire.fromNodeId, wire.fromPort ?? 0)
      const to = inputPoint(wire.toNodeId, wire.toPort)
      if (!from || !to) return null
      const key = `${wire.fromNodeId}:${wire.fromPort ?? 0}`
      const live = !!values.get(wire.fromNodeId)?.outputs?.[wire.fromPort ?? 0]
      const group = outputs.get(key) ?? { key, from, xs: [], ys: [], count: 0, live }
      group.xs.push(to.x)
      group.ys.push(to.y)
      group.count += 1
      outputs.set(key, group)
      return { wire, from, to, key, live }
    })
    .filter(Boolean)

  const trunks = assignTrunks([...outputs.values()])
  const drawn = resolved.map(({ wire, from, to, key, live }) => ({
    wire,
    live,
    points: routePoints(from, to, trunks.get(key)),
  }))
  const branches = [...outputs.values()].filter((group) => group.count > 1)

  return (
    <svg className="wires" width={WORLD_SIZE} height={WORLD_SIZE}>
      {drawn.map(({ wire, live, points }) => {
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

      {branches.map((group) => (
        <circle
          key={group.key}
          className={`wire-junction ${group.live ? 'is-live' : ''}`}
          cx={group.from.x + trunks.get(group.key)}
          cy={group.from.y}
          r="3.5"
        />
      ))}

      {draftWire &&
        (() => {
          const from = outputPoint(draftWire.fromNodeId, draftWire.fromPort ?? 0)
          if (!from) return null
          return <path d={pointsToPath(routePoints(from, draftWire))} className="wire-visible wire--draft" />
        })()}
    </svg>
  )
}
