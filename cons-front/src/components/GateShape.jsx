// Классический значок вентиля (ГОСТ/ANSI): D-образный «И», округлое
// «ИЛИ» с вогнутой спинкой, «Исключающее ИЛИ» (то же плюс двойная линия
// спинки) и треугольник «НЕ». Кружок инверсии рисуется отдельно поверх
// формы — так один и тот же контур обслуживает и «И», и «И-НЕ».
//
// Значок всегда рисуется ровно в размер узла (см. entities/layout.js) —
// сам не решает, где на холсте разместиться, только как выглядеть
// внутри отведённого прямоугольника. Только цельная линия контура,
// никаких кружков на концах выводов: те рисует настоящий интерактивный
// Port поверх, в тех же координатах.

const STUB = 8 // отступ от края узла до тела значка — место под вывод
const BUBBLE_R = 4.5 // радиус кружка инверсии

export default function GateShape({ type, width, height }) {
  const { shape, negated, inputCount } = type
  const bodyTop = height * 0.12
  const bodyBottom = height * 0.88
  const mid = height / 2
  const hasBubble = shape === 'not' || negated

  const bodyRight = hasBubble ? width - STUB - BUBBLE_R * 2 - 2 : width - STUB
  const bubbleCx = bodyRight + BUBBLE_R + 1
  const outputStubFrom = hasBubble ? bubbleCx + BUBBLE_R : bodyRight
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

      <path className="gate-shape__body" d={bodyPath(shape, bodyLeft, bodyTop, bodyBottom, bodyRight, mid)} />

      {shape === 'xor' && (
        <path
          className="gate-shape__body gate-shape__body--line"
          d={backCurve(bodyLeft - 6, bodyTop, bodyBottom)}
        />
      )}

      {hasBubble && <circle className="gate-shape__bubble" cx={bubbleCx} cy={mid} r={BUBBLE_R} />}
    </svg>
  )
}

function bodyPath(shape, left, top, bottom, right, mid) {
  if (shape === 'not') return `M${left},${top} L${left},${bottom} L${right},${mid} Z`
  if (shape === 'and') {
    const r = (bottom - top) / 2
    return `M${left},${top} H${right - r} A${r},${r} 0 0 1 ${right - r},${bottom} H${left} Z`
  }
  // 'or' и 'xor' используют одну и ту же форму тела — вогнутая спинка,
  // заострённый выход; разница только в дополнительной линии спинки.
  const w = right - left
  const h = bottom - top
  return (
    `M${left},${top} ` +
    `C${left + w * 0.55},${top} ${left + w * 0.85},${top + h * 0.25} ${right},${mid} ` +
    `C${left + w * 0.85},${bottom - h * 0.25} ${left + w * 0.55},${bottom} ${left},${bottom} ` +
    `C${left + w * 0.28},${bottom - h * 0.22} ${left + w * 0.28},${top + h * 0.22} ${left},${top} Z`
  )
}

function backCurve(x, top, bottom) {
  const h = bottom - top
  return `M${x},${top} C${x + 10},${top + h * 0.22} ${x + 10},${bottom - h * 0.22} ${x},${bottom}`
}
