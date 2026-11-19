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

// В третьей работе инвертирующий вентиль можно собрать из И/ИЛИ и отдельного НЕ.
function findLatchLoop(nodes, wires, outputs) {
  const byId = new Map(nodes.map(node => [node.id, node]))
  const halves = []
  for (const node of nodes) {
    let gate = node
    if (node.typeId === 'NOT') {
      const driver = wires.find(w => w.toNodeId === node.id)
      gate = byId.get(driver?.fromNodeId)
      if (!gate || !['AND', 'OR'].includes(gate.typeId)) continue
    } else if (!['NAND', 'NOR'].includes(node.typeId)) continue
    const family = ['AND', 'NAND'].includes(gate.typeId) ? 'NAND' : 'NOR'
    halves.push({ input: gate.id, output: node.id, family })
  }
  // Если пользователь подписал прямой выход Q, именно он задаёт Q до перехода.
  const qSink = outputs.find(node => node.label?.toUpperCase() === 'Q') ?? outputs[0]
  const preferred = wires.find(w => w.toNodeId === qSink.id)?.fromNodeId
  halves.sort((a, b) => Number(b.output === preferred) - Number(a.output === preferred))
  for (const a of halves) {
    for (const b of halves) {
      if (a.input === b.input || a.family !== b.family) continue
      const cut = wires.find(w => w.fromNodeId === a.output && w.toNodeId === b.input)
      if (!cut || !wires.some(w => w.fromNodeId === b.output && w.toNodeId === a.input)) continue
      const openWires = wires.filter(w => w !== cut)
      if (hasFeedback(nodes, openWires)) continue
      const stateLabel = outputs.find(o => wires.some(w => w.fromNodeId === a.output && w.toNodeId === o.id))?.label
      return { cut, openWires, other: b.output, stateLabel: stateLabel || a.output }
    }
  }
}

// Размыкаем одну ветвь и проверяем оба значения на ней. Устойчивое значение
// воспроизводится на выходе после обхода петли. Два решения означают хранение.
function probeLatch(nodes, loop, outputs) {
  const source = { id: Symbol(), typeId: 'INPUT' }
  const wires = [...loop.openWires, { ...loop.cut, fromNodeId: source.id }]
  const stable = []
  for (const bit of [0, 1]) {
    const { values } = evaluateCircuit([...nodes, { ...source, on: bit }], wires)
    const q = Number(values.get(loop.cut.fromNodeId).display)
    if (q === bit) stable.push({
      forbidden: q === Number(values.get(loop.other).display),
      outputs: outputs.map(o => Number(values.get(o.id).display)),
    })
  }
  return stable
}

export function buildCircuitTable(nodes, wires) {
  const inputs = nodes.filter((n) => n.type.kind === ELEMENT_KIND.SOURCE).sort(byPosition)
  const outputs = nodes.filter((n) => n.type.kind === ELEMENT_KIND.SINK).sort(byPosition)

  if (inputs.length === 0 || outputs.length === 0) return { status: 'empty' }
  if (inputs.length > MAX_TABLE_INPUTS) return { status: 'toomany' }
  const memory = nodes.filter(n => n.type.kind === ELEMENT_KIND.MEMORY)
  const rs = memory.length === 1 && memory[0].typeId === 'RS_TRIGGER' ? memory[0] : null
  if (memory.length && !rs) return { status: 'memory' }
  let loop
  if (hasFeedback(nodes, wires)) {
    loop = !rs && findLatchLoop(nodes, wires, outputs)
    if (!loop) return { status: 'feedback' }
  }

  const n = inputs.length
  const rows = []
  for (let mask = 0; mask < 2 ** n; mask++) {
    const bits = inputs.map((_, i) => (mask >> (n - 1 - i)) & 1)
    const forced = new Map(inputs.map((node, i) => [node.id, bits[i]]))
    const probe = nodes.map((node) => (forced.has(node.id) ? { ...node, on: !!forced.get(node.id) } : node))
    if (loop) {
      const stable = probeLatch(probe, loop, outputs)
      if (!stable.length) return { status: 'feedback' }
      for (const q of [0, 1]) rows.push({ inputs: [...bits, q], ...(stable[q] ?? stable[0]) })
    } else if (rs) {
      for (const q of [0, 1]) {
        const withState = state => probe.map(node => node.id === rs.id ? { ...node, state } : node)
        const { nextStates } = evaluateCircuit(withState({ q: Boolean(q) }), wires)
        const state = nextStates.get(rs.id)
        const { values } = evaluateCircuit(withState(state), wires)
        rows.push({ inputs: [...bits, q], outputs: outputs.map(o => Number(values.get(o.id).display)), forbidden: state.bad })
      }
    } else {
      const { values } = evaluateCircuit(probe, wires)
      rows.push({ inputs: bits, outputs: outputs.map(o => Number(values.get(o.id).display)) })
    }
  }

  const currentBits = inputs.map((node) => (node.on ? 1 : 0))
  const current = rows.findIndex((row) => row.inputs.every((bit, i) => bit === currentBits[i]))

  return {
    status: 'ok',
    transition: Boolean(loop || rs),
    inputs: [...inputs.map(node => node.label), ...(loop || rs ? [`${loop?.stateLabel ?? 'Q'} (до)`] : [])],
    outputs: outputs.map((node) => node.label),
    rows,
    current,
  }
}
