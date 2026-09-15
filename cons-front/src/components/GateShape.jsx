// Значок вентиля по ГОСТ 2.743-91 (тот же стандарт, на который ссылаются
// методички лабораторных работ): прямоугольник с буквенным обозначением
// внутри — «&» (И), «≥1» (ИЛИ), «1» (НЕ), «=1» (Искл. ИЛИ) — и кружком
// инверсии на выходе у «-НЕ»-вариантов.
//
// Значок всегда рисуется ровно в размер узла (см. entities/layout.js) —
// сам не решает, где на холсте разместиться, только как выглядеть внутри
// отведённого прямоугольника. Кружков на концах выводов не рисует: те
// добавляет настоящий интерактивный Port поверх, в тех же координатах.

const STUB = 6 // отступ от края узла до тела значка — место под вывод
const BUBBLE_R = 4 // радиус кружка инверсии

export default function GateShape({ type, width, height }) {
  const { symbol, negated, inputCount } = type
  const top = 4
  const bottom = height - 4
  const mid = height / 2

  const bodyRight = negated ? width - STUB - BUBBLE_R * 2 - 2 : width - STUB
  const bubbleCx = bodyRight + BUBBLE_R + 1
  const outputStubFrom = negated ? bubbleCx + BUBBLE_R : bodyRight
  const bodyLeft = STUB

  const inputYs = Array.from({ length: inputCount }, (_, i) => (height / (inputCount + 1)) * (i + 1))

  return (
    <svg className="gate-shape" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g className="gate-shape__lines">
        {inputYs.map((y, i) => (
          <line key={i} x1={0} y1={y} x2={bodyLeft} y2={y} />
        ))}
        <line x1={outputStubFrom} y1={mid} x2={width} y2={mid} />
      </g>

      <rect
        className="gate-shape__body"
        x={bodyLeft}
        y={top}
        width={bodyRight - bodyLeft}
        height={bottom - top}
      />
      <text className="gate-shape__text" x={(bodyLeft + bodyRight) / 2} y={mid}>
        {symbol}
      </text>

      {negated && <circle className="gate-shape__bubble" cx={bubbleCx} cy={mid} r={BUBBLE_R} />}
    </svg>
  )
}
