import { useState } from 'react'
import ElementGlyph from './ElementGlyph'
import Name from './Name'
import Port from './Port'
import { getInputPortPosition, getNodeSize, getOutputPortPosition } from '../entities/layout'

// Один элемент, размещённый на холсте: тело + его порты + подпись.
// Перетаскивание и подключение проводов обрабатывает Workspace —
// узел только сообщает о начале жеста.
export default function ElementNode({ node, value, connectedInputs, connectedOutputs, onStartMove, onStartWire, onRemove, onRename }) {
  const { type } = node
  const size = getNodeSize(type)
  const outputs = value?.outputs ?? []
  const nameable = type.kind === 'source' || type.kind === 'sink'

  return (
    <div
      className="node"
      style={{ left: node.x, top: node.y, width: size.width, height: size.height }}
      onPointerDown={(e) => onStartMove(e, node)}
    >
      <ElementGlyph type={type} on={value?.display} />

      {nameable && (
        <NodeName
          side={type.kind === 'source' ? 'left' : 'right'}
          value={node.label}
          placeholder={type.kind === 'source' ? 'A' : 'F'}
          onCommit={(v) => onRename(node.id, v)}
        />
      )}

      {Array.from({ length: type.inputCount }, (_, i) => {
        const pos = getInputPortPosition(type, i)
        return <Port key={`in-${i}`} nodeId={node.id} index={i} direction="in" x={pos.x} y={pos.y} connected={connectedInputs.has(i)} />
      })}

      {Array.from({ length: type.outputCount ?? 0 }, (_, i) => {
        const pos = getOutputPortPosition(type, i)
        return (
          <Port
            key={`out-${i}`}
            nodeId={node.id}
            index={i}
            direction="out"
            x={pos.x}
            y={pos.y}
            live={outputs[i]}
            connected={connectedOutputs.has(i)}
            onStartWire={onStartWire}
          />
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
// но лабораторные работы требуют конкретное имя (S, P, Q0, D1…), поэтому
// подпись можно переименовать прямым кликом. «!Q» — Q с чертой.
function NodeName({ side, value, placeholder, onCommit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const className = `node__name node__name--${side}`

  if (editing) {
    return (
      <input
        className={`${className} node__name-input`}
        autoFocus
        value={draft}
        maxLength={6}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
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
      className={className}
      title="Переименовать"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      <Name>{value || placeholder}</Name>
    </button>
  )
}
