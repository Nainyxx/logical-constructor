// Чистая логика вычисления схемы: по списку узлов и проводов между ними
// строит карту "id узла -> его текущие значения". Ничего не знает про
// React и про экранные координаты.
//
// У узла может быть несколько выходов (шифратор, дешифратор, триггер) —
// поэтому результат на узел это { outputs, display }: outputs — значение
// каждого выходного порта (по нему резолвятся провода), display — одно
// "главное" значение для лампочек/тумблеров/подписи под вентилем.
//
// Триггеры и ячейки памяти не могут вычисляться только по текущим
// входам — им нужно помнить прошлое значение. Такие узлы возвращают из
// evaluate() ещё и новое состояние; функция собирает все такие
// изменения в nextStates, а перенос их обратно в узлы (следующий "такт"
// схемы) делает вызывающий код (см. useCircuitState).

import { ELEMENT_TYPES } from './elementTypes'

/**
 * @param {Array} nodes  [{ id, typeId, on, state }]
 * @param {Array} wires  [{ id, fromNodeId, fromPort, toNodeId, toPort }]
 * @returns {{ values: Map<string, {outputs: boolean[], display: boolean}>, nextStates: Map<string, object> }}
 */
export function evaluateCircuit(nodes, wires) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const values = new Map()
  const nextStates = new Map()
  const inProgress = new Set()

  function resolve(nodeId) {
    if (values.has(nodeId)) return values.get(nodeId)
    const node = nodeById.get(nodeId)
    if (!node) return { outputs: [], display: false }

    // Защита от зацикленных схем (провод сам на себя через кольцо элементов):
    // считаем такой вход ещё не вычисленным сигналом, то есть false.
    if (inProgress.has(nodeId)) return { outputs: [], display: false }
    inProgress.add(nodeId)

    const type = ELEMENT_TYPES[node.typeId]
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
  return { values, nextStates }
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
