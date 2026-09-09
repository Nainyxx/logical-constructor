import { ELEMENT_TYPES, PALETTE_ELEMENT_IDS } from '../entities/elementTypes'
import PaletteItem from './PaletteItem'

// Нижняя панель — список доступных элементов, из которого их
// перетаскивают на холст.
export default function Palette() {
  return (
    <div className="palette">
      {PALETTE_ELEMENT_IDS.map((id) => (
        <PaletteItem key={id} type={ELEMENT_TYPES[id]} />
      ))}
    </div>
  )
}
