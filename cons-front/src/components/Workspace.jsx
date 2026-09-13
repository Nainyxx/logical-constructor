import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ElementNode from './ElementNode'
import WireLayer from './WireLayer'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import { WORLD_SIZE, getNodeSize } from '../entities/layout'

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5
const CLICK_THRESHOLD = 4 // px — меньше — считаем это кликом, а не перетаскиванием

/**
 * Бесконечное (в пределах WORLD_SIZE) рабочее поле в клетку.
 * Отвечает за:
 *  - панорамирование и зум поля,
 *  - перетаскивание элементов из палитры (drop),
 *  - перемещение уже размещённых элементов,
 *  - протягивание проводов между портами.
 * Всё это — разные фазы одного и того же жеста "нажал — потянул —
 * отпустил", поэтому они собраны в один reducer-подобный interactionRef.
 */
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
}) {
  const containerRef = useRef(null)
  const interactionRef = useRef(null)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const [draftWire, setDraftWire] = useState(null)

  // Слушатели на window вешаются один раз (см. эффект ниже) и не должны
  // пересоздаваться при каждом кадре перетаскивания — поэтому читают
  // актуальные пропсы/состояние через этот ref, а не из замыкания.
  const latestRef = useRef(null)
  latestRef.current = { view, nodes, moveNode, toggleInput, connect }

  // Центрируем видимую область поля при первом рендере.
  useLayoutEffect(() => {
    const rect = containerRef.current.getBoundingClientRect()
    setView({ x: rect.width / 2 - WORLD_SIZE / 2, y: rect.height / 2 - WORLD_SIZE / 2, scale: 1 })
  }, [])

  // Читает view из latestRef, а не из замыкания рендера — эту функцию
  // вызывают и стабильные обработчики на window (см. эффект ниже),
  // которым нужен всегда самый свежий масштаб/сдвиг поля.
  function screenToWorld(clientX, clientY) {
    const { view } = latestRef.current
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    }
  }

  // На компактных вентилях с двумя входами кликабельные зоны соседних
  // портов (увеличенные — см. .port__hit) перекрываются сильнее, чем
  // расстояние между самими портами. Поэтому среди всех входов под
  // курсором берём не первый попавшийся в DOM, а тот, чей центр
  // физически ближе всего к точке отпускания.
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

  // --- продолжение и завершение жестов (слушатели на window,
  //     чтобы жест не срывался, если курсор ушёл с элемента) ---------

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
        moveNode(interaction.nodeId, interaction.startNodeX + dx, interaction.startNodeY + dy)
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

  // Колесо мыши — зум к точке под курсором. Подключаем нативно,
  // чтобы можно было отменить прокрутку страницы (preventDefault).
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
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(rect.width / spanX, rect.height / spanY)))
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
    addNode(typeId, world.x - size.width / 2, world.y - size.height / 2)
  }

  const status =
    nodes.length === 0 ? 'Разместите элементы' : wires.length === 0 ? 'Соедините элементы' : 'Схема собрана'

  return (
    <div className="workspace-shell">
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
              onStartMove={handleNodePointerDown}
              onStartWire={handleWireStart}
              onRemove={removeNode}
              onRename={renameNode}
            />
          ))}
        </div>
      </div>

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
        <button type="button" className="workspace__toolbar-btn" onClick={fitToView}>
          Показать всю схему
        </button>
        <button type="button" className="workspace__toolbar-btn" onClick={clear}>
          Очистить поле
        </button>
        <span className={`workspace__status ${wires.length > 0 ? 'is-ready' : ''}`}>
          <span className="workspace__status-dot" />
          {status}
        </span>
      </div>
    </div>
  )
}
