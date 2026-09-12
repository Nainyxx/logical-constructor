import { Fragment } from 'react'
import ElementGlyph from './ElementGlyph'
import Port from './Port'
import { getInputPortPosition, getNodeSize, getOutputPortPosition } from '../entities/layout'

// Один элемент, размещённый на холсте: тело + его порты.
// Перетаскивание и подключение проводов обрабатывает Workspace —
// узел только сообщает о начале жеста.
export default function ElementNode({ node, value, onStartMove, onStartWire, onRemove }) {
  const { type } = node
  const size = getNodeSize(type)
  const outputs = value?.outputs ?? []
  const showName = type.kind === 'gate' || type.kind === 'memory'
  // Одно число под вентилем имеет смысл только при одном выходе —
  // у шифратора/дешифратора/триггера значение видно по точкам портов.
  const showValueBadge = showName && (type.outputCount ?? 1) <= 1

  return (
    <div
      className="node"
      style={{ left: node.x, top: node.y, width: size.width, height: size.height }}
      onPointerDown={(e) => onStartMove(e, node)}
    >
      {showName && <div className="node__label node__label--top">{type.label}</div>}

      <ElementGlyph type={type} width={size.width} height={size.height} on={value?.display} />

      {showValueBadge && (
        <div className="node__label node__label--bottom">
          <span className={`node__value ${value?.display ? 'is-on' : ''}`}>{value?.display ? 1 : 0}</span>
        </div>
      )}

      {Array.from({ length: type.inputCount }, (_, i) => {
        const pos = getInputPortPosition(type, i)
        const label = type.inputLabels?.[i]
        return (
          <Fragment key={`in-${i}`}>
            <Port nodeId={node.id} index={i} direction="in" x={pos.x} y={pos.y} />
            {label && (
              <span
                className="node__port-label node__port-label--in"
                style={{ left: pos.x, top: pos.y }}
              >
                {label}
              </span>
            )}
          </Fragment>
        )
      })}

      {Array.from({ length: type.outputCount ?? 0 }, (_, i) => {
        const pos = getOutputPortPosition(type, i)
        const label = type.outputLabels?.[i]
        return (
          <Fragment key={`out-${i}`}>
            <Port
              nodeId={node.id}
              index={i}
              direction="out"
              x={pos.x}
              y={pos.y}
              live={outputs[i]}
              onStartWire={onStartWire}
            />
            {label && (
              <span
                className="node__port-label node__port-label--out"
                style={{ left: pos.x, top: pos.y }}
              >
                {label}
              </span>
            )}
          </Fragment>
        )
      })}

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
