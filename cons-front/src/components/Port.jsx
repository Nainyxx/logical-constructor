// точка соединения на краю узла; .port__hit больше .port__dot — легче попасть курсором
export default function Port({ nodeId, index, direction, x, y, live, connected, onStartWire }) {
  return (
    <div
      className={`port__hit port__hit--${direction}`}
      style={{ left: x, top: y }}
      data-port-node={nodeId}
      data-port-index={index}
      data-port-dir={direction}
      onPointerDown={direction === 'out' ? (e) => onStartWire(e, nodeId, index) : undefined}
    >
      <span className={`port__dot ${live ? 'is-live' : ''} ${connected ? 'is-connected' : ''}`} />
    </div>
  )
}
