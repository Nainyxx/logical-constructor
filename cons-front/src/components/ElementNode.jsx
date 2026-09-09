import ElementGlyph from './ElementGlyph'
import Port from './Port'
import { getInputPortPosition, getNodeSize, getOutputPortPosition } from '../entities/layout'

// Один элемент, размещённый на холсте: тело + его порты.
// Перетаскивание и подключение проводов обрабатывает Workspace —
// узел только сообщает о начале жеста.
export default function ElementNode({ node, on, onStartMove, onStartWire, onRemove }) {
  const { type } = node
  const size = getNodeSize(type)

  return (
    <div
      className="node"
      style={{ left: node.x, top: node.y, width: size.width, height: size.height }}
      onPointerDown={(e) => onStartMove(e, node)}
    >
      {type.kind === 'gate' && <div className="node__label node__label--top">{type.label}</div>}

      <ElementGlyph type={type} width={size.width} height={size.height} on={on} />

      {type.kind === 'gate' && (
        <div className="node__label node__label--bottom">
          <span className={`node__value ${on ? 'is-on' : ''}`}>{on ? 1 : 0}</span>
        </div>
      )}

      {Array.from({ length: type.inputCount }, (_, i) => {
        const pos = getInputPortPosition(type, i)
        return <Port key={i} nodeId={node.id} index={i} direction="in" x={pos.x} y={pos.y} />
      })}

      {type.hasOutput &&
        (() => {
          const pos = getOutputPortPosition(type)
          return (
            <Port
              nodeId={node.id}
              index={0}
              direction="out"
              x={pos.x}
              y={pos.y}
              live={on}
              onStartWire={onStartWire}
            />
          )
        })()}

      <button
        className="node__remove"
        title="Удалить элемент"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(node.id)}
      >
        ×
      </button>
    </div>
  )
}
