import GateShape from './GateShape'

// Визуальное "тело" элемента: классический значок вентиля для gate,
// прямоугольник с буквой для memory (триггер — так их и рисуют по ГОСТ),
// тумблер для входа, круглый индикатор с цифрой для выхода.
//
// У тумблера и индикатора фиксированный внутренний размер (не зависит
// от width/height контейнера) — контейнер лишь центрирует их и задаёт
// кликабельную область узла, поэтому форма никогда не искажается в
// эллипс при нестандартных пропорциях узла.
export default function ElementGlyph({ type, width, height, on }) {
  if (type.kind === 'source') {
    return (
      <div className="glyph" style={{ width, height }}>
        <span className={`switch-track ${on ? 'is-on' : ''}`}>
          <span className="switch-knob">{on ? 1 : 0}</span>
        </span>
      </div>
    )
  }

  if (type.kind === 'sink') {
    return (
      <div className="glyph" style={{ width, height }}>
        <span className={`indicator ${on ? 'is-on' : ''}`}>{on ? 1 : 0}</span>
      </div>
    )
  }

  if (type.kind === 'memory') {
    return (
      <div className="glyph glyph--box" style={{ width, height }}>
        <span className="glyph__symbol">{type.boxLabel}</span>
      </div>
    )
  }

  return (
    <div className="glyph" style={{ width, height }}>
      <GateShape type={type} width={width} height={height} />
    </div>
  )
}
