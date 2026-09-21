import { ELEMENT_TYPES } from '../entities/elementTypes'
import TypePreview from './TypePreview'

// Левая панель — библиотека элементов, из которой их перетаскивают на
// холст. В лабораторных работах — плоский список уже изученных к этому
// моменту элементов (см. entities/labs.js, paletteIds); в свободном
// режиме — полный набор, разбитый на группы с заголовками (groups).
export default function LibraryPanel({ elementIds, groups }) {
  const sections = groups ?? [{ title: null, ids: elementIds }]

  return (
    <aside className="library">
      <div className="library__header">
        <h2>Библиотека элементов</h2>
        <p>Перетащите элемент на поле</p>
      </div>
      {sections.map((section) => (
        <div key={section.title ?? 'all'} className="library__group">
          {section.title && <h3 className="library__group-title">{section.title}</h3>}
          <div className="library__list">
            {section.ids.map((id) => (
              <LibraryItem key={id} type={ELEMENT_TYPES[id]} />
            ))}
          </div>
        </div>
      ))}
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
        <TypePreview type={type} />
      </div>
      <div className="library-item__text">
        <span className="library-item__label">{type.label}</span>
        <span className="library-item__desc">{type.description}</span>
      </div>
    </div>
  )
}
