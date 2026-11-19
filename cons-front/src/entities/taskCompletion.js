import { ELEMENT_TYPES } from './elementTypes'
import { buildCircuitTable } from './truthTable'

// Указанные в методичке имена имеют приоритет. Остальные столбцы идут
// в порядке таблицы на экране (сверху вниз, затем слева направо).
function signalName(label) {
  return (label ?? '').normalize('NFKC').toUpperCase().replace(/\s/g, '')
    .replace(/^(?:¬Q|Q[\u0304\u0305'])$/, '!Q')
    .replace(/[АВСНРХ]/g, char => ({ А: 'A', В: 'B', С: 'C', Н: 'H', Р: 'P', Х: 'X' })[char])
}

function columns(labels, names) {
  const normalized = labels.map(signalName)
  const indices = names.map(name => normalized.indexOf(name))
  const unused = labels.map((_, i) => i).filter(i => !indices.includes(i))
  return indices.map(index => index < 0 ? unused.shift() : index)
}

const functions = {
  and3: [['A', 'B', 'C'], ['F'], ([a, b, c]) => [a && b && c]],
  implication: [['A', 'B'], ['F'], ([a, b]) => [!a || b]],
  andNot: [['A', 'B'], ['F'], ([a, b]) => [a && !b]],
  fullAdder: [['A', 'B', 'P0'], ['S', 'P'], ELEMENT_TYPES.SM.evaluate],
  twoBitAdder: [['A0', 'A1', 'B0', 'B1'], ['S0', 'S1', 'P'], ([a0, a1, b0, b1]) => {
    const sum = a0 + b0 + 2 * (a1 + b1)
    return [sum & 1, (sum >> 1) & 1, sum >> 2]
  }],
  comparator: [['A', 'B'], ['A>B', 'A=B', 'A<B'], ([a, b]) => [a > b, a === b, a < b]],
  decoder: [['X1', 'X2'], ['Y1', 'Y2', 'Y3', 'Y4'], ELEMENT_TYPES.DC.evaluate],
  demux: [['D', 'A'], ['Y1', 'Y2'], ELEMENT_TYPES.DMX2.evaluate],
}

function matchesFunction(table, [inputs, outputs, evaluate]) {
  if (table.inputs.length !== inputs.length || table.outputs.length !== outputs.length) return false
  const ins = columns(table.inputs, inputs)
  const outs = columns(table.outputs, outputs)
  return table.rows.every(row => {
    const expected = evaluate(ins.map(i => Boolean(row.inputs[i])))
    return expected.every((value, i) => Number(value) === row.outputs[outs[i]])
  })
}

// Каналы могут быть подключены к четырём переключателям или попарно
// к общим константам. Проверяем и выбор канала, и текущую настройку XOR.
function matchesMux(table) {
  if (table.inputs.length < 4 || table.outputs.length !== 1) return false
  const names = table.inputs.map(signalName)
  const current = table.rows[table.current].inputs
  const indices = names.map((_, i) => i)
  for (const a1 of indices) {
    if (names.includes('A1') && names[a1] !== 'A1') continue
    for (const a2 of indices) {
      if (a1 === a2 || (names.includes('A2') && names[a2] !== 'A2')) continue
      const data = indices.filter(i => i !== a1 && i !== a2)
      const valid = [0, 1, 2, 3].every(channel => {
        const named = names.indexOf(`D${channel + 1}`)
        const rows = table.rows.filter(row => row.inputs[a1] + 2 * row.inputs[a2] === channel)
        return data.some(i => (named < 0 || named === i)
          && current[i] === Number(channel === 1 || channel === 2)
          && rows.every(row => row.outputs[0] === row.inputs[i]))
      })
      if (valid) return true
    }
  }
  return false
}

function matchesLatch(table, rs) {
  if (!table.transition || table.inputs.length !== 3 || ![1, 2].includes(table.outputs.length)) return false
  const labels = table.inputs.slice(0, 2).map(label => signalName(label).replace(/^[!¬]/, ''))
  const [first, second] = columns(labels, rs ? ['S', 'R'] : ['D', 'C'])
  const [q, inverse] = columns(table.outputs, ['Q', '!Q'])
  // Разомкнутая ветвь из таблицы может соответствовать инверсному выходу.
  const previousIsInverse = table.inputs[2] === `${table.outputs[inverse]} (до)`
  return table.rows.every(row => {
    const a = row.inputs[first], b = row.inputs[second]
    const previous = row.inputs[2] ^ Number(previousIsInverse)
    const forbidden = rs && !a && !b
    let next = previous
    if (rs && !a) next = 1
    else if (rs && !b) next = 0
    else if (!rs && b) next = a
    return Boolean(row.forbidden) === Boolean(forbidden) && (q === undefined || row.outputs[q] === next)
      && (inverse === undefined || row.outputs[inverse] === (forbidden ? 1 : 1 - next))
  })
}

function matchesFlipFlops(check, nodes, wires) {
  const drivers = new Map(wires.map(w => [w.toNodeId + ':' + w.toPort, w]))
  const driver = (id, pin = 0) => drivers.get(id + ':' + pin)
  const inputs = nodes.filter(n => n.typeId === 'INPUT')
  const sinks = nodes.filter(n => n.typeId === 'OUTPUT')
  const stages = nodes.filter(n => n.typeId === 'D_TRIGGER')
  if (stages.length !== (check === 'toggle' ? 1 : 4)) return false
  const clock = driver(stages[0].id, 1)?.fromNodeId
  if (!inputs.some(n => n.id === clock) || !stages.every(n => driver(n.id, 1)?.fromNodeId === clock)) return false
  if (check === 'toggle') {
    const id = stages[0].id
    const feedback = driver(id)
    const direct = sinks.some(s => driver(s.id)?.fromNodeId === id && !driver(s.id).fromPort)
    return direct && feedback?.fromNodeId === id && feedback.fromPort === 1 && sinks.every(s => {
      const output = driver(s.id)
      if (output?.fromNodeId !== id) return false
      const label = signalName(s.label)
      if (label === 'Q') return !output.fromPort
      if (label === '!Q') return output.fromPort === 1
      return true
    })
  }
  if (sinks.length !== 4) return false
  const bits = sinks.map(s => driver(s.id)?.fromNodeId)
  if (new Set(bits).size !== 4 || !bits.every(id => stages.some(n => n.id === id))) return false
  if (sinks.some(s => driver(s.id).fromPort)) return false
  const dataInputs = inputs.filter(n => n.id !== clock)
  const data = bits.map(id => driver(id))
  if (data.some(w => !w || w.fromPort)) return false
  const indexOfLabel = (label, prefix) => {
    const name = signalName(label)
    return name.startsWith(prefix) && /^[0-3]$/.test(name.slice(1)) ? Number(name.slice(1)) : null
  }
  if (check === 'parallel') {
    const assigned = new Set()
    return new Set(data.map(w => w.fromNodeId)).size === 4 && data.every((wire, i) => {
      const source = dataInputs.find(n => n.id === wire.fromNodeId)
      if (!source) return false
      const d = indexOfLabel(source.label, 'D'), q = indexOfLabel(sinks[i].label, 'Q')
      if (d !== null && q !== null && d !== q) return false
      const index = q ?? d
      if (index === null) return true
      if (assigned.has(index)) return false
      assigned.add(index)
      return true
    })
  }
  // Следуем от D к предыдущему разряду: положение элементов на холсте произвольно.
  return bits.some(last => {
    let id = last
    const seen = new Set()
    for (let i = 3; i >= 0; i--) {
      const pos = bits.indexOf(id)
      if (pos < 0 || seen.has(id)) return false
      const label = indexOfLabel(sinks[pos].label, 'Q')
      if (label !== null && label !== i) return false
      seen.add(id)
      id = data[pos].fromNodeId
    }
    return check === 'ring' ? id === last : dataInputs.some(n => n.id === id)
  })
}

export function isTaskComplete(check, nodes, wires) {
  if (!wires.length || !nodes.some(n => n.typeId === 'OUTPUT')) return false
  if (['toggle', 'parallel', 'shift', 'ring'].includes(check)) return matchesFlipFlops(check, nodes, wires)
  const table = buildCircuitTable(nodes, wires)
  if (table.status !== 'ok') return false
  if (check === 'rs' || check === 'latch') return matchesLatch(table, check === 'rs')
  if (table.transition) return false
  if (check === 'mux') return matchesMux(table)
  return matchesFunction(table, functions[check])
}
