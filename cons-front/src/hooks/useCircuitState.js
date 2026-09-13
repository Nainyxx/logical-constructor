import { useCallback, useEffect, useMemo, useState } from 'react'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { evaluateCircuit } from '../entities/circuit'

let nextId = 1
const makeId = (prefix) => `${prefix}-${nextId++}`

// Автоподпись для новых входов/выходов: A, B, C… и F, G, H… — так
// пользователю почти никогда не приходится переименовывать элемент
// самому, только когда лаба требует конкретное имя (S, P, Q и т.п.).
function nextLabel(typeId, existingNodes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const start = typeId === 'OUTPUT' ? 5 : 0 // выходы начинаются с F
  const used = new Set(existingNodes.filter((n) => n.typeId === typeId).map((n) => n.label))
  for (let i = start; i < alphabet.length; i++) {
    if (!used.has(alphabet[i])) return alphabet[i]
  }
  return ''
}

function statesEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => a[key] === b[key])
}

/**
 * Хранит состояние схемы (узлы + провода) и даёт действия для его
 * изменения. Возвращает также уже посчитанные значения выходов —
 * компонентам не нужно самим запускать evaluateCircuit.
 */
export function useCircuitState() {
  const [nodes, setNodes] = useState([])
  const [wires, setWires] = useState([])

  const addNode = useCallback((typeId, x, y) => {
    const id = makeId(typeId)
    const state = ELEMENT_TYPES[typeId].initialState?.() ?? null
    setNodes((prev) => {
      const type = ELEMENT_TYPES[typeId]
      const label = type.kind === 'source' || type.kind === 'sink' ? nextLabel(typeId, prev) : ''
      return [...prev, { id, typeId, x, y, on: false, state, label }]
    })
    return id
  }, [])

  const renameNode = useCallback((id, label) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, label } : node)))
  }, [])

  const moveNode = useCallback((id, x, y) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, x, y } : node)))
  }, [])

  const removeNode = useCallback((id) => {
    setNodes((prev) => prev.filter((node) => node.id !== id))
    setWires((prev) => prev.filter((wire) => wire.fromNodeId !== id && wire.toNodeId !== id))
  }, [])

  const toggleInput = useCallback((id) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, on: !node.on } : node)))
  }, [])

  // Один вход может принять только один провод — новое соединение
  // вытесняет старое, если оно было в этот же порт.
  const connect = useCallback((fromNodeId, fromPort, toNodeId, toPort) => {
    if (fromNodeId === toNodeId) return
    setWires((prev) => [
      ...prev.filter((wire) => !(wire.toNodeId === toNodeId && wire.toPort === toPort)),
      { id: makeId('wire'), fromNodeId, fromPort, toNodeId, toPort },
    ])
  }, [])

  const removeWire = useCallback((id) => {
    setWires((prev) => prev.filter((wire) => wire.id !== id))
  }, [])

  const clear = useCallback(() => {
    setNodes([])
    setWires([])
  }, [])

  const { values, nextStates } = useMemo(() => evaluateCircuit(nodes, wires), [nodes, wires])

  // Триггеры и ячейки памяти хранят своё состояние в самом узле, а не
  // выводят его заново из текущих входов. Как только вычисленное
  // состояние отличается от сохранённого, переносим его в узел — это и
  // есть следующий "такт" схемы (как в реальной защёлке, реагирующей на
  // изменение входов). Сравнение перед записью не даёт зациклиться:
  // когда состояние уже совпадает, повторный рендер не запускается.
  useEffect(() => {
    if (nextStates.size === 0) return
    setNodes((prev) => {
      let changed = false
      const updated = prev.map((node) => {
        if (!nextStates.has(node.id)) return node
        const nextState = nextStates.get(node.id)
        if (statesEqual(node.state, nextState)) return node
        changed = true
        return { ...node, state: nextState }
      })
      return changed ? updated : prev
    })
  }, [nextStates])

  const nodesWithType = useMemo(
    () => nodes.map((node) => ({ ...node, type: ELEMENT_TYPES[node.typeId] })),
    [nodes],
  )

  return {
    nodes: nodesWithType,
    wires,
    values,
    addNode,
    moveNode,
    removeNode,
    toggleInput,
    renameNode,
    connect,
    removeWire,
    clear,
  }
}
