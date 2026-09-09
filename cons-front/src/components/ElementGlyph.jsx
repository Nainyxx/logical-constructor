// Визуальное "тело" элемента — прямоугольник с символом для вентилей,
// тумблер для входа, лампа для выхода. Используется и в палитре
// (маленький превью), и на самом узле (в реальном размере).
//
// У тумблера и лампы фиксированный внутренний размер (не зависит от
// width/height контейнера) — так они не растягиваются в эллипс, а
// контейнер лишь центрирует их и задаёт кликабельную область узла.

export default function ElementGlyph({ type, width, height, on }) {
  if (type.kind === 'source') {
    return (
      <div className="glyph" style={{ width, height }}>
        <span className={`switch-track ${on ? 'is-on' : ''}`}>
          <span className="switch-knob" />
        </span>
      </div>
    )
  }

  if (type.kind === 'sink') {
    return (
      <div className="glyph" style={{ width, height }}>
        <span className={`lamp ${on ? 'is-on' : ''}`} />
      </div>
    )
  }

  return (
    <div className="glyph glyph--gate" style={{ width, height }}>
      <span className="glyph__symbol">{type.symbol}</span>
      {type.negated && <span className="glyph__bubble" />}
    </div>
  )
}
