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
//
// RS-триггер на двух «ИЛИ-НЕ» (лаб. №4) — это ПАМЯТЬ, собранная не из
// готового элемента с состоянием, а из обратной связи двух обычных
// вентилей. Чтобы такая схема реально "держала" значение при S=R=0, а
// не сбрасывалась в 0 на каждом пересчёте, вычисление идёт в несколько
// проходов (релаксация): сигнал на входе, который ссылается сам на себя
// через кольцо, на первом проходе берётся из результата ПРЕДЫДУЩЕГО
// вызова evaluateCircuit (previousValues — состояние схемы "как было
// только что"), а на последующих проходах — из предыдущего прохода
// этого же вызова. Проходы повторяются, пока значения не перестанут
// меняться (или не кончится лимit) — так возникает то же поведение, что
// и в реальной схеме с задержкой распространения сигнала по вентилям.

import { ELEMENT_TYPES } from './elementTypes'

const MAX_PASSES = 12 // с запасом хватает на любую цепочку обратной связи в этих лабах

/**
 * @param {Array} nodes  [{ id, typeId, on, state }]
 * @param {Array} wires  [{ id, fromNodeId, fromPort, toNodeId, toPort }]
 * @param {Map} [previousValues]  результат предыдущего вызова — отправная
 *   точка для узлов внутри цикла обратной связи, у которых нет памяти
 * @returns {{ values: Map<string, {outputs: boolean[], display: boolean}>, nextStates: Map<string, object> }}
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

    // Защита от зацикленных схем: вход, ссылающийся сам на себя через
    // кольцо, берём из состояния "как было" — у элементов с памятью это
    // их сохранённое состояние (peek), у обычных вентилей — результат
    // предыдущего прохода/вызова (seed). Ничего из этого нет только на
    // самом первом вызове схемы — тогда падаем в false, как и раньше.
    if (inProgress.has(nodeId)) {
      if (type.peek) {
        const outputs = type.peek(node.state)
        return { outputs, display: outputs[0] }
      }
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
