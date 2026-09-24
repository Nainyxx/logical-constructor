// вычисление схемы: узлы+провода -> { outputs, display } по каждому узлу.
// несколько проходов (релаксация) нужны для схем с обратной связью без
// отдельной памяти (RS-триггер на «ИЛИ-НЕ») — иначе цикл всегда давал бы false
// вместо удержания значения между пересчётами.

import { ELEMENT_TYPES } from './elementTypes'

const MAX_PASSES = 12 // с запасом хватает на любую цепочку обратной связи в этих лабах

/**
 * @param {Array} nodes  [{ id, typeId, on, state }]
 * @param {Array} wires  [{ id, fromNodeId, fromPort, toNodeId, toPort }]
 * @param {Map} [previousValues]  затравка для узлов внутри цикла обратной связи
 * @returns {{ values: Map, nextStates: Map }}
 */
export function evaluateCircuit(nodes, wires, previousValues) {
  let seed = previousValues ?? new Map()
  let values
  let nextStates

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    nextStates = new Map()
    values = runPass(nodes, wires, seed, nextStates)
    if (valuesEqual(values, seed)) break
    seed = values
  }

  return { values, nextStates }
}

function runPass(nodes, wires, seed, nextStates) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const values = new Map()
  const inProgress = new Set()

  function resolve(nodeId) {
    if (values.has(nodeId)) return values.get(nodeId)
    const node = nodeById.get(nodeId)
    if (!node) return { outputs: [], display: false }
    const type = ELEMENT_TYPES[node.typeId]

    // триггер отдаёт текущее состояние, а не то, что запишет по этому такту —
    // иначе в регистре сдвига значение проскочило бы все разряды сразу
    if (type.kind === 'memory') {
      const published = type.peek(node.state)
      values.set(nodeId, { outputs: published, display: published[0] })
      runEvaluate(type, node, readInputs(node, type, wires, resolve), nextStates)
      return values.get(nodeId)
    }

    // цикл через обычные вентили — берём значение из предыдущего прохода (seed)
    if (inProgress.has(nodeId)) {
      const seeded = seed.get(nodeId)
      if (seeded) return seeded
      return { outputs: [], display: false }
    }
    inProgress.add(nodeId)

    let result

    if (type.kind === 'source') {
      const on = !!node.on
      result = { outputs: [on], display: on }
    } else {
      const inputs = readInputs(node, type, wires, resolve)
      if (type.kind === 'sink') {
        result = { outputs: [], display: inputs[0] }
      } else {
        const outputs = runEvaluate(type, node, inputs, nextStates)
        result = { outputs, display: outputs[0] }
      }
    }

    inProgress.delete(nodeId)
    values.set(nodeId, result)
    return result
  }

  nodes.forEach((node) => resolve(node.id))
  return values
}

function runEvaluate(type, node, inputs, nextStates) {
  const raw = type.evaluate(inputs, node.state)
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    nextStates.set(node.id, raw.state)
    return raw.outputs
  }
  return [raw]
}

function readInputs(node, type, wires, resolve) {
  const inputs = new Array(type.inputCount).fill(false)
  for (const wire of wires) {
    if (wire.toNodeId !== node.id) continue
    const from = resolve(wire.fromNodeId)
    inputs[wire.toPort] = from.outputs[wire.fromPort ?? 0] ?? false
  }
  return inputs
}

function valuesEqual(a, b) {
  if (a === b) return true
  if (a.size !== b.size) return false
  for (const [nodeId, result] of a) {
    const other = b.get(nodeId)
    if (!other || !outputsEqual(result.outputs, other.outputs)) return false
  }
  return true
}

function outputsEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every((value, i) => value === b[i])
}
