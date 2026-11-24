import { ELEMENT_TYPES } from './elementTypes'
import { buildCircuitTable } from './truthTable'
import { evaluateCircuit } from './circuit'

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
  pcIncrement: [['X1', 'X0', 'EN'], ['S1', 'S0', 'P'], ([x1, x0, en]) => {
    const sum = 2 * x1 + Number(x0) + Number(en)
    return [(sum >> 1) & 1, sum & 1, sum >> 2]
  }],
  pcSelect: [['X1', 'X0', 'EN', 'A1', 'A0', 'LD'], ['S1', 'S0', 'P', 'N1', 'N0'], ([x1, x0, en, a1, a0, ld]) => {
    const sum = functions.pcIncrement[2]([x1, x0, en])
    return [...sum, ld ? a1 : sum[0], ld ? a0 : sum[1]]
  }],
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

function checkFunction(table, [inputs, outputs, evaluate], sinks, sources) {
  if (table.inputs.length !== inputs.length || table.outputs.length !== outputs.length) {
    return issue(`Для задания нужны входы ${inputs.join(', ')} и выходы ${outputs.join(', ')}. Проверьте их количество.`,
      [...(sources.length > inputs.length ? sources : []), ...(sinks.length > outputs.length ? sinks : [])])
  }
  const ins = columns(table.inputs, inputs)
  const outs = columns(table.outputs, outputs)
  for (const row of table.rows) {
    const expected = evaluate(ins.map(i => Boolean(row.inputs[i])))
    const i = expected.findIndex((value, i) => Number(value) !== row.outputs[outs[i]])
    if (i < 0) continue
    const signals = row.inputs.map((bit, j) => `${table.inputs[j]}=${bit}`).join(', ')
    const sink = sinks[outs[i]]
    return issue(`При ${signals} выход ${sink.label || outputs[i]} даёт ${row.outputs[outs[i]]}. Ожидалось ${Number(expected[i])}.`, [sink])
  }
  return null
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

function checkLatch(table, rs, sinks) {
  if (!table.transition || table.inputs.length !== 3 || ![1, 2].includes(table.outputs.length)) {
    return issue(rs ? 'Проверьте перекрёстную обратную связь И-НЕ, два входа и выход Q.'
      : 'Проверьте обратную связь защёлки, входы D и C и выход Q.', sinks)
  }
  const labels = table.inputs.slice(0, 2).map(label => signalName(label).replace(/^[!¬]/, ''))
  const [first, second] = columns(labels, rs ? ['S', 'R'] : ['D', 'C'])
  const [q, inverse] = columns(table.outputs, ['Q', '!Q'])
  // Разомкнутая ветвь из таблицы может соответствовать инверсному выходу.
  const previousIsInverse = table.inputs[2] === `${table.outputs[inverse]} (до)`
  for (const row of table.rows) {
    const a = row.inputs[first], b = row.inputs[second]
    const previous = row.inputs[2] ^ Number(previousIsInverse)
    const forbidden = rs && !a && !b
    let next = previous
    if (rs && !a) next = 1
    else if (rs && !b) next = 0
    else if (!rs && b) next = a
    const conditions = table.inputs.map((label, i) => `${label}=${row.inputs[i]}`).join(', ')
    if (Boolean(row.forbidden) !== Boolean(forbidden)) {
      return issue(`При ${conditions} комбинация должна быть ${forbidden ? 'запрещённой' : 'допустимой'}. Проверьте управляющие входы.`, sinks)
    }
    for (const [i, expected] of [[q, next], [inverse, forbidden ? 1 : 1 - next]]) {
      if (i !== undefined && row.outputs[i] !== expected) {
        return issue(`При ${conditions} выход ${table.outputs[i]} даёт ${row.outputs[i]}. Ожидалось ${expected}.`, [sinks[i]])
      }
    }
  }
  return null
}

function checkFlipFlops(check, nodes, wires) {
  const drivers = new Map(wires.map(w => [w.toNodeId + ':' + w.toPort, w]))
  const driver = (id, pin = 0) => drivers.get(id + ':' + pin)
  const inputs = nodes.filter(n => n.typeId === 'INPUT')
  const sinks = nodes.filter(n => n.typeId === 'OUTPUT')
  const stages = nodes.filter(n => n.typeId === 'D_TRIGGER')
  const count = check === 'toggle' ? 1 : 4
  if (stages.length !== count) return issue(`Требуется D-триггеров: ${count}. На поле: ${stages.length}.`, stages)
  const clock = driver(stages[0].id, 1)?.fromNodeId
  if (!inputs.some(n => n.id === clock) || !stages.every(n => driver(n.id, 1)?.fromNodeId === clock)) {
    return issue('Проверьте входы C. Все триггеры должны получать один общий тактовый сигнал от входа схемы.', stages, stages.map(n => driver(n.id, 1)))
  }
  if (check === 'toggle') {
    const id = stages[0].id
    const feedback = driver(id)
    const direct = sinks.some(s => driver(s.id)?.fromNodeId === id && !driver(s.id).fromPort)
    if (feedback?.fromNodeId !== id || feedback.fromPort !== 1) return issue('Соедините инверсный выход этого триггера с его входом D.', stages, [feedback])
    const correct = direct && sinks.every(s => {
      const output = driver(s.id)
      if (output?.fromNodeId !== id) return false
      const label = signalName(s.label)
      if (label === 'Q') return !output.fromPort
      if (label === '!Q') return output.fromPort === 1
      return true
    })
    return correct ? null : issue('Проверьте подключение прямого и инверсного выходов триггера.', sinks, sinks.map(s => driver(s.id)))
  }
  if (sinks.length !== 4) return issue('Подключите четыре выхода регистра.', sinks)
  const bits = sinks.map(s => driver(s.id)?.fromNodeId)
  const wrong = sinks.filter((s, i) => !stages.some(n => n.id === bits[i]) || bits.filter(id => id === bits[i]).length > 1 || driver(s.id)?.fromPort)
  if (wrong.length) return issue('Каждый выход должен получать прямой Q своего разряда.', wrong, wrong.map(s => driver(s.id)))
  const dataInputs = inputs.filter(n => n.id !== clock)
  const data = bits.map(id => driver(id))
  const inverted = data.filter(w => w?.fromPort)
  if (inverted.length) return issue('На D должен приходить прямой сигнал.', stages.filter(n => inverted.some(w => w.toNodeId === n.id)), inverted)
  const indexOfLabel = (label, prefix) => {
    const name = signalName(label)
    return name.startsWith(prefix) && /^[0-3]$/.test(name.slice(1)) ? Number(name.slice(1)) : null
  }
  if (check === 'parallel') {
    const badLines = data.filter((w, i) => {
      const source = dataInputs.find(n => n.id === w.fromNodeId)
      if (!source || data.some(other => other !== w && other.fromNodeId === w.fromNodeId)) return true
      const d = indexOfLabel(source.label, 'D'), q = indexOfLabel(sinks[i].label, 'Q')
      return d !== null && q !== null && d !== q
    })
    if (badLines.length) return issue('Проверьте выделенные линии данных. Каждому Q нужен собственный вход D того же разряда.',
      stages.filter(n => badLines.some(w => w.toNodeId === n.id)), badLines)
    const assigned = new Set()
    const correct = data.every((wire, i) => {
      const source = dataInputs.find(n => n.id === wire.fromNodeId)
      const d = indexOfLabel(source.label, 'D'), q = indexOfLabel(sinks[i].label, 'Q')
      const index = q ?? d
      if (index === null) return true
      if (assigned.has(index)) return false
      assigned.add(index)
      return true
    })
    return correct ? null : issue('Проверьте линии D0…D3. Каждому разряду нужен свой информационный вход с соответствующим номером.', stages, data)
  }
  const misplaced = data.filter((wire, i) => {
    const dest = indexOfLabel(sinks[i].label, 'Q')
    const prev = bits.indexOf(wire.fromNodeId)
    if (prev < 0) return check === 'ring' || !dataInputs.some(n => n.id === wire.fromNodeId) || (dest !== null && dest !== 0)
    if (check === 'shift' && dest === 0) return true
    const from = indexOfLabel(sinks[prev].label, 'Q')
    return dest !== null && from !== null && dest !== (from + 1) % 4
  })
  if (misplaced.length) return issue('Проверьте выделенные соединения с входами D и порядок разрядов.',
    stages.filter(n => misplaced.some(w => w.toNodeId === n.id)), misplaced)
  // Следуем от D к предыдущему разряду: положение элементов на холсте произвольно.
  const correct = bits.some(last => {
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
  return correct ? null : issue(check === 'ring'
    ? 'Проверьте цепочку Q → D. Четвёртый разряд должен замыкать кольцо на первый.'
    : 'Проверьте цепочку Q → D. Первый разряд принимает внешний сигнал, следующие — выход предыдущего.', stages, data)
}

function issue(message, nodes = [], wires = []) {
  return { message, nodeIds: nodes.map(n => n.id), wireIds: wires.filter(Boolean).map(w => w.id) }
}

function checkProgramCounter(check, nodes, wires, sources, sinks) {
  const registered = check === 'pcRegister'
  const [inNames, outNames] = registered
    ? [['EN', 'A1', 'A0', 'LD', 'C'], [...functions.pcSelect[1], 'Q1', 'Q0']]
    : functions[check]
  for (const [terminals, names] of [[sources, inNames], [sinks, outNames]]) {
    const labels = terminals.map(n => signalName(n.label))
    if (labels.length !== names.length || names.some(name => !labels.includes(name))) {
      return issue(`Проверьте количество и подписи ${terminals === sources ? 'входов' : 'выходов'}: ${names.join(', ')}.`,
        terminals.filter((_, i) => !names.includes(labels[i]) || labels.indexOf(labels[i]) !== i))
    }
  }
  const counts = { HS: 2, MUX2: check === 'pcIncrement' ? 0 : 2, D_TRIGGER: registered ? 2 : 0 }
  for (const [id, count] of Object.entries(counts)) {
    const parts = nodes.filter(n => n.typeId === id)
    if (parts.length !== count) return issue(`Элемент «${ELEMENT_TYPES[id].label}»: требуется ${count}, на поле ${parts.length}.`, parts)
  }
  if (!registered) {
    const table = buildCircuitTable(nodes, wires)
    if (table.status !== 'ok' || table.transition) return issue('До подключения регистра схема должна быть комбинационной.', sinks)
    return checkFunction(table, functions[check], sinks, sources)
  }
  const named = Object.fromEntries([...sources, ...sinks].map(n => [signalName(n.label), n]))
  const driver = (node, pin) => wires.find(w => w.toNodeId === node.id && w.toPort === pin)
  const stages = []
  for (const bit of [0, 1]) {
    const sink = named['Q' + bit]
    const output = driver(sink, 0)
    const stage = nodes.find(n => n.id === output.fromNodeId && n.typeId === 'D_TRIGGER')
    if (!stage || output.fromPort || stages.includes(stage)) return issue('Подключите Q0 и Q1 к прямым выходам разных D-триггеров.', [sink], [output])
    const clock = driver(stage, 1)
    if (clock.fromNodeId !== named.C.id) return issue('Обоим триггерам нужен общий такт C.', [stage], [clock])
    stages.push(stage)
  }
  // Проверяем переход из каждого адреса на копиях состояний. Живая схема сохраняет свой такт.
  for (let q = 0; q < 4; q++) {
    for (let mask = 0; mask < 32; mask++) {
      const signals = Object.fromEntries(inNames.map((name, i) => [name, Boolean(mask & (1 << i))]))
      const probe = nodes.map(n => {
        if (n.typeId === 'INPUT') return { ...n, on: signals[signalName(n.label)] }
        if (n.typeId === 'D_TRIGGER') return { ...n, state: { q: Boolean(q & (1 << stages.indexOf(n))), prevClock: false } }
        return n
      })
      const { values, nextStates } = evaluateCircuit(probe, wires)
      const expected = functions.pcSelect[2]([q >> 1, q & 1, signals.EN, signals.A1, signals.A0, signals.LD])
      const context = `Q1Q0=${q.toString(2).padStart(2, '0')}, A1A0=${+signals.A1}${+signals.A0}, EN=${+signals.EN}, LD=${+signals.LD}, C=${+signals.C}`
      for (const [i, name] of functions.pcSelect[1].entries()) {
        const actual = Number(values.get(named[name].id).display)
        if (actual !== Number(expected[i])) return issue(`При ${context} на ${name} получено ${actual}, ожидается ${+expected[i]}.`, [named[name]])
      }
      for (const bit of [0, 1]) {
        const wanted = signals.C ? expected[4 - bit] : (q >> bit) & 1
        if (Number(nextStates.get(stages[bit].id).q) !== Number(wanted)) {
          return issue(`При ${context} разряд Q${bit} должен принять ${+wanted}. Проверьте его вход D.`, [stages[bit]], [driver(stages[bit], 0)])
        }
      }
    }
  }
  return null
}

export function checkTask(check, nodes, wires) {
  if (!nodes.length) return issue('Поле пустое. Добавьте элементы схемы.')
  const sources = nodes.filter(n => n.typeId === 'INPUT')
  const sinks = nodes.filter(n => n.typeId === 'OUTPUT').sort((a, b) => a.y - b.y || a.x - b.x)
  if (!sources.length || !sinks.length) return issue('Добавьте на поле элементы «Вход» и «Выход».')
  const open = nodes.filter(n => Array.from({ length: n.type.inputCount }, (_, i) => i)
    .some(i => !wires.some(w => w.toNodeId === n.id && w.toPort === i)))
  if (open.length) return issue('У выделенных элементов есть неподключённые входы.', open)
  if (['pcIncrement', 'pcSelect', 'pcRegister'].includes(check)) return checkProgramCounter(check, nodes, wires, sources, sinks)
  if (['toggle', 'parallel', 'shift', 'ring'].includes(check)) return checkFlipFlops(check, nodes, wires)
  const table = buildCircuitTable(nodes, wires)
  if (table.status === 'toomany') return issue('Для проверки поддерживается до шести входов.', sources)
  if (check === 'rs' || check === 'latch') {
    return checkLatch(table, check === 'rs', sinks)
  }
  if (table.status !== 'ok' || table.transition) {
    const feedback = wires.filter(wire => {
      const visited = new Set()
      function reachesSource(id) {
        if (id === wire.fromNodeId) return true
        if (visited.has(id)) return false
        visited.add(id)
        return wires.some(w => w.fromNodeId === id && reachesSource(w.toNodeId))
      }
      return reachesSource(wire.toNodeId)
    })
    return issue('Для задания нужна комбинационная схема. Проверьте обратные связи и элементы памяти.',
      nodes.filter(n => n.type.kind === 'memory' || feedback.some(w => w.toNodeId === n.id)), feedback)
  }
  if (check === 'mux') {
    if (matchesMux(table)) return null
    const wrong = sources.filter(n => /^D[1-4]$/.test(signalName(n.label)) && !!n.on !== ['D2', 'D3'].includes(signalName(n.label)))
    return issue('Проверьте выбор канала по адресу и уровни D1…D4: 0, 1, 1, 0.', wrong.length ? wrong : sinks)
  }
  return checkFunction(table, functions[check], sinks, sources)
}
