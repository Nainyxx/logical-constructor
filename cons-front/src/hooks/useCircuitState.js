import { useCallback, useMemo, useState } from 'react'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { evaluateCircuit } from '../entities/circuit'

let nextId = 1
const makeId = (prefix) => `${prefix}-${nextId++}`

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
    setNodes((prev) => [...prev, { id, typeId, x, y, on: false }])
    return id
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
  const connect = useCallback((fromNodeId, toNodeId, toPort) => {
    if (fromNodeId === toNodeId) return
    setWires((prev) => [
      ...prev.filter((wire) => !(wire.toNodeId === toNodeId && wire.toPort === toPort)),
      { id: makeId('wire'), fromNodeId, toNodeId, toPort },
    ])
  }, [])

  const removeWire = useCallback((id) => {
    setWires((prev) => prev.filter((wire) => wire.id !== id))
  }, [])

  const clear = useCallback(() => {
    setNodes([])
    setWires([])
  }, [])

  const values = useMemo(() => evaluateCircuit(nodes, wires), [nodes, wires])

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
    connect,
    removeWire,
    clear,
  }
}
