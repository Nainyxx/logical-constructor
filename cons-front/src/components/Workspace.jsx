import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ElementNode from './ElementNode'
import TruthTablePanel from './TruthTablePanel'
import WireLayer from './WireLayer'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { WORLD_SIZE, getNodeSize, snap } from '../entities/layout'
import { buildCircuitTable } from '../entities/truthTable'

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5
const FIT_MAX_SCALE = 1.25 // «Вся схема» не должна раздувать маленькую схему на весь экран
const CLICK_THRESHOLD = 4 // px — меньше — считаем это кликом, а не перетаскиванием

// рабочее поле: пан/зум, drop из палитры, перетаскивание узлов, протяжка проводов
export default function Workspace({
  nodes,
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
  emptyHint = 'Перетащите элементы из библиотеки на поле и соедините их проводниками',
  tableOpenByDefault = false,
}) {
  const containerRef = useRef(null)
  const interactionRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [draftWire, setDraftWire] = useState(null)
  const [showTable, setShowTable] = useState(tableOpenByDefault)
  const [showHelp, setShowHelp] = useState(false)

  // слушатели на window стабильны (см. эффект ниже) — читают актуальные
  // пропсы через ref, а не из замыкания
  const latestRef = useRef(null)
  latestRef.current = { view, nodes, moveNode, toggleInput, connect }

  // вписываем схему в экран при первом рендере
  useLayoutEffect(() => {
    fitToView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function screenToWorld(clientX, clientY) {
    const { view } = latestRef.current
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    }
  }

  // берём ближайший к курсору порт, а не первый в DOM — .port__hit у соседних портов перекрываются
  function findInputPortAt(clientX, clientY) {
    const candidates = document
      .elementsFromPoint(clientX, clientY)
      .filter((el) => el.dataset?.portDir === 'in')
    if (candidates.length === 0) return null

    let best = null
    let bestDistance = Infinity
    for (const el of candidates) {
      const rect = el.getBoundingClientRect()
      const dx = rect.left + rect.width / 2 - clientX
      const dy = rect.top + rect.height / 2 - clientY
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        best = el
      }
    }
    return { nodeId: best.dataset.portNode, portIndex: Number(best.dataset.portIndex) }
  }

  // --- начало жестов -------------------------------------------------

  function handleBackgroundPointerDown(e) {
    interactionRef.current = {
      type: 'pan',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewX: view.x,
      startViewY: view.y,
    }
  }

  function handleNodePointerDown(e, node) {
    e.stopPropagation()
    interactionRef.current = {
      type: 'move-node',
      nodeId: node.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
      moved: false,
    }
  }

  function handleWireStart(e, nodeId, portIndex) {
    e.stopPropagation()
    const world = screenToWorld(e.clientX, e.clientY)
    interactionRef.current = { type: 'wire', fromNodeId: nodeId, fromPort: portIndex }
    setDraftWire({ fromNodeId: nodeId, fromPort: portIndex, x: world.x, y: world.y })
  }

  // --- продолжение/завершение жеста — слушатели на window, чтобы не срывалось за краем узла ---

  useEffect(() => {
    function handlePointerMove(e) {
      const interaction = interactionRef.current
      if (!interaction) return
      const { view, moveNode } = latestRef.current

      if (interaction.type === 'pan') {
        setView((v) => ({
          ...v,
          x: interaction.startViewX + (e.clientX - interaction.startClientX),
          y: interaction.startViewY + (e.clientY - interaction.startClientY),
        }))
      } else if (interaction.type === 'move-node') {
        const dx = (e.clientX - interaction.startClientX) / view.scale
        const dy = (e.clientY - interaction.startClientY) / view.scale
        if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) interaction.moved = true
        moveNode(interaction.nodeId, snap(interaction.startNodeX + dx), snap(interaction.startNodeY + dy))
      } else if (interaction.type === 'wire') {
        const world = screenToWorld(e.clientX, e.clientY)
        setDraftWire((d) => d && { ...d, x: world.x, y: world.y })
      }
    }

    function handlePointerUp(e) {
      const interaction = interactionRef.current
      if (!interaction) return
      const { nodes, toggleInput, connect } = latestRef.current

      if (interaction.type === 'move-node' && !interaction.moved) {
        const node = nodes.find((n) => n.id === interaction.nodeId)
        if (node?.type.kind === 'source') toggleInput(node.id)
      }

      if (interaction.type === 'wire') {
        const target = findInputPortAt(e.clientX, e.clientY)
        if (target) connect(interaction.fromNodeId, interaction.fromPort, target.nodeId, target.portIndex)
        setDraftWire(null)
      }

      interactionRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  // зум к курсору колесом; слушатель нативный, чтобы работал preventDefault
  useEffect(() => {
    const el = containerRef.current
    function handleWheel(e) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
        const worldX = (cursorX - v.x) / v.scale
        const worldY = (cursorY - v.y) / v.scale
        return { scale: nextScale, x: cursorX - worldX * nextScale, y: cursorY - worldY * nextScale }
      })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // --- инструменты снизу: зум, вписать схему, очистить -----------------

  function zoomBy(factor) {
    const rect = containerRef.current.getBoundingClientRect()
    setView((v) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const cx = rect.width / 2
      const cy = rect.height / 2
      const worldX = (cx - v.x) / v.scale
      const worldY = (cy - v.y) / v.scale
      return { scale: nextScale, x: cx - worldX * nextScale, y: cy - worldY * nextScale }
    })
  }

  function fitToView() {
    const rect = containerRef.current.getBoundingClientRect()
    if (nodes.length === 0) {
      setView({ x: rect.width / 2 - WORLD_SIZE / 2, y: rect.height / 2 - WORLD_SIZE / 2, scale: 1 })
      return
    }
    const PADDING = 80
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    nodes.forEach((node) => {
      const size = getNodeSize(node.type)
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + size.width)
      maxY = Math.max(maxY, node.y + size.height)
    })
    const spanX = maxX - minX + PADDING * 2
    const spanY = maxY - minY + PADDING * 2
    const scale = Math.min(FIT_MAX_SCALE, Math.max(MIN_SCALE, Math.min(rect.width / spanX, rect.height / spanY)))
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    setView({ x: rect.width / 2 - midX * scale, y: rect.height / 2 - midY * scale, scale })
  }

  // --- перетаскивание элементов из палитры ---------------------------

  function handleDrop(e) {
    e.preventDefault()
    const typeId = e.dataTransfer.getData('text/x-element-type')
    if (!typeId) return
    const world = screenToWorld(e.clientX, e.clientY)
    const size = getNodeSize(ELEMENT_TYPES[typeId])
    addNode(typeId, snap(world.x - size.width / 2), snap(world.y - size.height / 2))
  }

  // подключённость портов — для статуса внизу и подсветки самих портов
  const { connections, freeInputs } = useMemo(() => {
    const map = new Map(nodes.map((n) => [n.id, { inputs: new Set(), outputs: new Set() }]))
    wires.forEach((w) => {
      map.get(w.fromNodeId)?.outputs.add(w.fromPort ?? 0)
      map.get(w.toNodeId)?.inputs.add(w.toPort)
    })
    const free = nodes.reduce((sum, n) => sum + n.type.inputCount - (map.get(n.id)?.inputs.size ?? 0), 0)
    return { connections: map, freeInputs: free }
  }, [nodes, wires])

  const table = useMemo(() => (showTable ? buildCircuitTable(nodes, wires) : null), [showTable, nodes, wires])

  const status =
    nodes.length === 0
      ? { text: 'Разместите элементы', ready: false }
      : freeInputs > 0
        ? { text: `Не подключено входов: ${freeInputs}`, ready: false }
        : { text: 'Все соединения корректны', ready: true }

  return (
    <div className="workspace-shell">
      {showHelp && (
        <p className="workspace__help">
          Перетащите элемент из библиотеки на поле. Тяните от точки справа (выход) к точке слева (вход) — так
          соединяются провода. Клик по проводу удаляет его, клик по тумблеру «Входа» переключает 0/1, клик по подписи
          A/F переименовывает элемент (имя «!Q» рисуется с чертой). Колесо мыши — масштаб, перетаскивание фона — сдвиг.
        </p>
      )}
      <div
        ref={containerRef}
        className="workspace"
        onPointerDown={handleBackgroundPointerDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div
          className="workspace__world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <div className="workspace__grid" style={{ width: WORLD_SIZE, height: WORLD_SIZE }} />

          <WireLayer nodes={nodes} wires={wires} values={values} draftWire={draftWire} onDeleteWire={removeWire} />

          {nodes.map((node) => (
            <ElementNode
              key={node.id}
              node={node}
              value={values.get(node.id)}
              connectedInputs={connections.get(node.id).inputs}
              connectedOutputs={connections.get(node.id).outputs}
              onStartMove={handleNodePointerDown}
              onStartWire={handleWireStart}
              onRemove={removeNode}
              onRename={renameNode}
            />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="workspace__empty">
            <span className="workspace__empty-icon" aria-hidden="true" />
            <p>{emptyHint}</p>
          </div>
        )}
      </div>

      {showTable && <TruthTablePanel table={table} />}

      <div className="workspace__toolbar">
        <div className="workspace__zoom">
          <button type="button" title="Уменьшить" onClick={() => zoomBy(1 / 1.25)}>
            −
          </button>
          <span>{Math.round(view.scale * 100)}%</span>
          <button type="button" title="Увеличить" onClick={() => zoomBy(1.25)}>
            +
          </button>
        </div>
        <button type="button" className="workspace__toolbar-btn" disabled={nodes.length === 0} onClick={fitToView}>
          Вся схема
        </button>
        <button type="button" className="workspace__toolbar-btn" disabled={nodes.length === 0} onClick={clear}>
          Очистить
        </button>
        <button
          type="button"
          className={`workspace__toolbar-btn ${showTable ? 'is-active' : ''}`}
          onClick={() => setShowTable((v) => !v)}
        >
          Таблица истинности
        </button>
        <button
          type="button"
          className={`workspace__toolbar-btn workspace__toolbar-btn--icon ${showHelp ? 'is-active' : ''}`}
          title="Как пользоваться"
          onClick={() => setShowHelp((v) => !v)}
        >
          ?
        </button>
        <span className={`workspace__status ${status.ready ? 'is-ready' : ''}`}>
          <span className="workspace__status-dot" />
          {status.text}
        </span>
      </div>
    </div>
  )
}
