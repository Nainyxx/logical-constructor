import { useRef } from 'react'
import { ELEMENT_TYPES } from '../entities/elementTypes'
import TypePreview from './TypePreview'

// библиотека элементов слева: плоский список в лабах (paletteIds), группы в свободном режиме
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
  const glyphRef = useRef(null)

  // без setDragImage браузер тащит снимок всей карточки (с текстом) — вместо
  // этого под курсором едет только значок
  function handleDragStart(e) {
    e.dataTransfer.setData('text/x-element-type', type.id)
    e.dataTransfer.effectAllowed = 'copy'
    if (glyphRef.current) {
      const { width, height } = glyphRef.current.getBoundingClientRect()
      e.dataTransfer.setDragImage(glyphRef.current, width / 2, height / 2)
    }
  }

  return (
    <div className="library-item" draggable onDragStart={handleDragStart}>
      <div className="library-item__glyph" ref={glyphRef}>
        <TypePreview type={type} />
      </div>
      <div className="library-item__text">
        <span className="library-item__label">{type.label}</span>
        <span className="library-item__desc">{type.description}</span>
      </div>
    </div>
  )
}
