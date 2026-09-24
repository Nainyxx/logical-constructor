import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { evaluateCircuit } from '../entities/circuit'
import { loadCircuit, saveCircuit } from '../entities/storage'

let nextId = 1
const makeId = (prefix) => `${prefix}-${nextId++}`

// сдвигаем счётчик id за восстановленные из localStorage узлы/провода
function bumpIdCounter(nodes, wires) {
  let max = 0
  for (const { id } of [...nodes, ...wires]) {
    const n = Number(id.slice(id.lastIndexOf('-') + 1))
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  if (max >= nextId) nextId = max + 1
}

// автоподпись новых входов/выходов: A, B, C… и F, G, H…
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

// состояние схемы (узлы+провода) + вычисленные значения. storageKey —
// ключ автосохранения в localStorage (свой у каждой лабы/задания/свободного режима)
export function useCircuitState(storageKey) {
  const [nodes, setNodes] = useState(() => {
    const saved = storageKey ? loadCircuit(storageKey) : null
    if (saved) bumpIdCounter(saved.nodes, saved.wires)
    return saved?.nodes ?? []
  })
  const [wires, setWires] = useState(() => (storageKey ? loadCircuit(storageKey)?.wires ?? [] : []))

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

  // новое соединение вытесняет старое на том же входе; узел на себя (T-триггер) — можно
  const connect = useCallback((fromNodeId, fromPort, toNodeId, toPort) => {
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

  // сохраняем при каждом изменении схемы
  useEffect(() => {
    if (storageKey) saveCircuit(storageKey, nodes, wires)
  }, [storageKey, nodes, wires])

  // затравка для evaluateCircuit — комбинационная обратная связь держит
  // значение только если её передать явно (см. entities/circuit.js)
  const previousValuesRef = useRef(new Map())

  const { values, nextStates } = useMemo(() => {
    const result = evaluateCircuit(nodes, wires, previousValuesRef.current)
    previousValuesRef.current = result.values
    return result
  }, [nodes, wires])

  // переносим вычисленное состояние триггеров в узел — следующий "такт" схемы
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
