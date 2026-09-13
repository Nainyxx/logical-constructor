import { Fragment, useState } from 'react'
import ElementGlyph from './ElementGlyph'
import Port from './Port'
import { getInputPortPosition, getNodeSize, getOutputPortPosition } from '../entities/layout'

// Один элемент, размещённый на холсте: тело + его порты + подписи.
// Перетаскивание и подключение проводов обрабатывает Workspace —
// узел только сообщает о начале жеста.
export default function ElementNode({ node, value, onStartMove, onStartWire, onRemove, onRename }) {
  const { type } = node
  const size = getNodeSize(type)
  const outputs = value?.outputs ?? []
  const nameable = type.kind === 'source' || type.kind === 'sink'
  // Единственное число под вентилем — только когда выход один: у
  // триггера/шифратора значение видно по цвету самих портов.
  const showValueBadge = type.kind === 'gate'

  return (
    <div
      className="node"
      style={{ left: node.x, top: node.y, width: size.width, height: size.height }}
      onPointerDown={(e) => onStartMove(e, node)}
    >
      {nameable && (
        <NodeName value={node.label} placeholder={type.kind === 'source' ? 'A' : 'F'} onCommit={(v) => onRename(node.id, v)} />
      )}

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
              <span className="node__port-label node__port-label--in" style={{ left: pos.x, top: pos.y }}>
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
              <span className="node__port-label node__port-label--out" style={{ left: pos.x, top: pos.y }}>
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

// Имя входа/выхода (A, B, F…) — по умолчанию подставляется автоматически,
// но лабораторные работы часто требуют конкретное имя (S, P, Q0…), поэтому
// подпись можно переименовать прямым кликом.
function NodeName({ value, placeholder, onCommit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        className="node__label node__label--top node__name-input"
        autoFocus
        value={draft}
        maxLength={4}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          onCommit(draft.trim())
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className="node__label node__label--top node__name"
      title="Переименовать"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      {value || placeholder}
    </button>
  )
}
