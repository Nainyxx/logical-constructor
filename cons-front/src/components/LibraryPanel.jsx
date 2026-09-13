import { ELEMENT_TYPES, FULL_PALETTE_IDS } from '../entities/elementTypes'
import ElementGlyph from './ElementGlyph'

// Левая панель — библиотека элементов, из которой их перетаскивают на
// холст. В лабораторных работах список сокращается до элементов,
// уже изученных к этому моменту (см. entities/labs.js); без явного
// списка показывается полный набор — как в свободном режиме.
export default function LibraryPanel({ elementIds = FULL_PALETTE_IDS }) {
  return (
    <aside className="library">
      <div className="library__header">
        <h2>Библиотека элементов</h2>
        <p>Перетащите элемент на поле</p>
      </div>
      <div className="library__list">
        {elementIds.map((id) => (
          <LibraryItem key={id} type={ELEMENT_TYPES[id]} />
        ))}
      </div>
    </aside>
  )
}

function LibraryItem({ type }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('text/x-element-type', type.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="library-item" draggable onDragStart={handleDragStart}>
      <div className="library-item__glyph">
        <ElementGlyph type={type} width={56} height={type.kind === 'memory' ? 36 : 32} on={false} />
      </div>
      <div className="library-item__text">
        <span className="library-item__label">{type.label}</span>
        <span className="library-item__desc">{type.description}</span>
      </div>
    </div>
  )
}
