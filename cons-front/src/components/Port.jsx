// Точка соединения на краю узла. Сам порт не хранит логику соединения —
// он лишь сообщает Workspace о начале перетаскивания провода (для выхода)
// и помечает себя данными (для распознавания под курсором на входе).
//
// Кликабельная зона (.port__hit) заметно больше видимой точки
// (.port__dot) — иначе в кружок пришлось бы попадать пиксель в пиксель.
export default function Port({ nodeId, index, direction, x, y, live, onStartWire }) {
  return (
    <div
      className={`port__hit port__hit--${direction}`}
      style={{ left: x, top: y }}
      data-port-node={nodeId}
      data-port-index={index}
      data-port-dir={direction}
      onPointerDown={direction === 'out' ? (e) => onStartWire(e, nodeId, index) : undefined}
    >
      <span className={`port__dot ${live ? 'is-live' : ''}`} />
    </div>
  )
}
