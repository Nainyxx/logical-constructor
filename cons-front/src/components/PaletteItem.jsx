import ElementGlyph from './ElementGlyph'

// Одна карточка в нижней панели: превью элемента + подпись.
// Перетаскивается на холст через стандартный HTML drag-and-drop.
export default function PaletteItem({ type }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('text/x-element-type', type.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="palette-item" draggable onDragStart={handleDragStart}>
      <ElementGlyph type={type} width={56} height={type.kind === 'source' ? 28 : 36} on={false} />
      <span className="palette-item__label">{type.label}</span>
    </div>
  )
}
