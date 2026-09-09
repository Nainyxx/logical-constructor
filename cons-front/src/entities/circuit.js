// Чистая логика вычисления схемы: по списку узлов и проводов между ними
// строит карту "id узла -> текущее логическое значение на его выходе".
// Ничего не знает про React и про экранные координаты.

import { ELEMENT_TYPES } from './elementTypes'

/**
 * @param {Array} nodes  [{ id, typeId, on }]  on — состояние переключателя (для INPUT)
 * @param {Array} wires  [{ id, fromNodeId, toNodeId, toPort }]
 * @returns {Map<string, boolean>} значение выхода каждого узла
 */
export function evaluateCircuit(nodes, wires) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const values = new Map()
  const inProgress = new Set()

  function resolve(nodeId) {
    if (values.has(nodeId)) return values.get(nodeId)
    const node = nodeById.get(nodeId)
    if (!node) return false

    // Защита от зацикленных схем (провод сам на себя через кольцо элементов):
    // считаем такой вход ещё не вычисленным сигналом, то есть false.
    if (inProgress.has(nodeId)) return false
    inProgress.add(nodeId)

    const type = ELEMENT_TYPES[node.typeId]
    let value

    if (type.kind === 'source') {
      value = !!node.on
    } else {
      const inputs = readInputs(node, type, wires, resolve)
      value = type.kind === 'sink' ? inputs[0] : type.evaluate(inputs)
    }

    inProgress.delete(nodeId)
    values.set(nodeId, value)
    return value
  }

  nodes.forEach((node) => resolve(node.id))
  return values
}

function readInputs(node, type, wires, resolve) {
  const inputs = new Array(type.inputCount).fill(false)
  for (const wire of wires) {
    if (wire.toNodeId !== node.id) continue
    inputs[wire.toPort] = resolve(wire.fromNodeId)
  }
  return inputs
}
