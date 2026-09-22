import ElementGlyph from './ElementGlyph'
import { getNodeSize } from '../entities/layout'

// Уменьшенный «снимок» элемента библиотеки: тот же ElementGlyph, что и
// на холсте (в том числе индикатор), только уменьшенный целиком и без
// тумблера — в карточке он не кликабелен и ничего не переключает.
export default function TypePreview({ type }) {
  const { width, height } = getNodeSize(type)
  // Высокие узлы (регистры, мультиплексор) ужимаем, чтобы карточка не разрасталась.
  const scale = Math.min(0.8, 84 / height, 96 / width)
  return (
    <div className="preview" style={{ width: width * scale, height: height * scale }}>
      <div className="preview__inner" style={{ width, height, transform: `scale(${scale})` }}>
        <ElementGlyph type={type} on={false} preview />
      </div>
    </div>
  )
}
