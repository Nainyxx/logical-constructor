import ElementGlyph from './ElementGlyph'
import { getNodeSize } from '../entities/layout'

// Уменьшенный «снимок» элемента библиотеки: тот же ElementGlyph, что и
// на холсте, только уменьшенный целиком (в том числе тумблер и индикатор).
export default function TypePreview({ type }) {
  const { width, height } = getNodeSize(type)
  // Высокие узлы (регистры, мультиплексор) ужимаем, чтобы карточка не разрасталась.
  const scale = Math.min(0.8, 84 / height, 96 / width)
  return (
    <div className="preview" style={{ width: width * scale, height: height * scale }}>
      <div className="preview__inner" style={{ width, height, transform: `scale(${scale})` }}>
        <ElementGlyph type={type} on={false} />
      </div>
    </div>
  )
}
