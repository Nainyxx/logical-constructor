import { ELEMENT_KIND } from './elementTypes'
import { evaluateCircuit } from './circuit'

// таблица истинности элемента напрямую по его evaluate()
export function buildTruthTable(type) {
  const n = type.inputCount
  const rows = []
  for (let mask = 0; mask < 2 ** n; mask++) {
    const inputs = Array.from({ length: n }, (_, i) => Boolean(mask & (1 << (n - 1 - i))))
    const raw = type.evaluate(inputs)
    const outputs = Array.isArray(raw) ? raw : [raw]
    rows.push({ inputs, outputs })
  }
  return rows
}

// таблица истинности всей схемы — только для комбинационных (без памяти/обратной связи)

export const MAX_TABLE_INPUTS = 6

// порядок столбцов как на схеме: сверху вниз, при равной высоте слева направо
function byPosition(a, b) {
  return a.y - b.y || a.x - b.x
}

function hasFeedback(nodes, wires) {
  const next = new Map()
  wires.forEach((w) => next.set(w.fromNodeId, [...(next.get(w.fromNodeId) ?? []), w.toNodeId]))
  const state = new Map() // 1 — в обработке, 2 — готово

  function visit(id) {
    if (state.get(id) === 1) return true
    if (state.get(id) === 2) return false
    state.set(id, 1)
    const cyclic = (next.get(id) ?? []).some(visit)
    state.set(id, 2)
    return cyclic
  }
  return nodes.some((n) => visit(n.id))
}

/**
 * @param {Array} nodes  узлы схемы: { id, typeId, type, x, y, on, label, state }
 * @param {Array} wires
 * @returns {{ status: 'ok'|'empty'|'memory'|'feedback'|'toomany', inputs?, outputs?, rows?, current? }}
 */
export function buildCircuitTable(nodes, wires) {
  const inputs = nodes.filter((n) => n.type.kind === ELEMENT_KIND.SOURCE).sort(byPosition)
  const outputs = nodes.filter((n) => n.type.kind === ELEMENT_KIND.SINK).sort(byPosition)

  if (inputs.length === 0 || outputs.length === 0) return { status: 'empty' }
  if (nodes.some((n) => n.type.kind === ELEMENT_KIND.MEMORY)) return { status: 'memory' }
  if (hasFeedback(nodes, wires)) return { status: 'feedback' }
  if (inputs.length > MAX_TABLE_INPUTS) return { status: 'toomany' }

  const n = inputs.length
  const rows = []
  for (let mask = 0; mask < 2 ** n; mask++) {
    const bits = inputs.map((_, i) => (mask >> (n - 1 - i)) & 1)
    const forced = new Map(inputs.map((node, i) => [node.id, bits[i]]))
    const probe = nodes.map((node) => (forced.has(node.id) ? { ...node, on: !!forced.get(node.id) } : node))
    const { values } = evaluateCircuit(probe, wires)
    rows.push({ inputs: bits, outputs: outputs.map((o) => (values.get(o.id)?.display ? 1 : 0)) })
  }

  const currentBits = inputs.map((node) => (node.on ? 1 : 0))
  const current = rows.findIndex((row) => row.inputs.every((bit, i) => bit === currentBits[i]))

  return {
    status: 'ok',
    inputs: inputs.map((node) => node.label),
    outputs: outputs.map((node) => node.label),
    rows,
    current,
  }
}
