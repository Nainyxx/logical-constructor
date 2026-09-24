import ElementGlyph from './ElementGlyph'
import { getNodeSize } from '../entities/layout'

// уменьшенный снимок элемента для карточки библиотеки
export default function TypePreview({ type }) {
  const { width, height } = getNodeSize(type)
  // ужимаем высокие узлы (регистры, MUX), чтобы карточка не разрасталась
  const scale = Math.min(0.8, 84 / height, 96 / width)
  return (
    <div className="preview" style={{ width: width * scale, height: height * scale }}>
      <div className="preview__inner" style={{ width, height, transform: `scale(${scale})` }}>
        <ElementGlyph type={type} on={false} preview />
      </div>
    </div>
  )
}
