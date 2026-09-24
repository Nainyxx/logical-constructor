// УГО по описанию из entities/symbols.js. pad — поля под внешние подписи выводов (X1, Y2…)

const R = 4 // радиус кружка инверсии
const TRI = 6 // полувысота треугольника динамического входа
const PIN_GAP = 9 // отступ подписи вывода от вертикальной линии корпуса

export default function BoxSymbol({ box, scale = 1, pad = 0, className = '' }) {
  const { width, height, body, title, titleY, subtitle, inputs, outputs } = box
  const cx = (body.x1 + body.x2) / 2

  return (
    <svg
      className={`symbol ${className}`}
      width={(width + pad * 2) * scale}
      height={height * scale}
      viewBox={`${-pad} 0 ${width + pad * 2} ${height}`}
      aria-hidden="true"
    >
      <g className="symbol__lines">
        {inputs.map((pin, i) => (
          <line key={`il-${i}`} x1={0} y1={pin.y} x2={body.x1} y2={pin.y} />
        ))}
        {outputs.map((pin, i) => (
          <line key={`ol-${i}`} x1={body.x2 + (pin.inverted ? R * 2 : 0)} y1={pin.y} x2={width} y2={pin.y} />
        ))}
        <rect className="symbol__body" x={body.x1} y={body.y1} width={body.x2 - body.x1} height={body.y2 - body.y1} />
        {outputs.map(
          (pin, i) => pin.inverted && <circle key={`ob-${i}`} className="symbol__bubble" cx={body.x2 + R} cy={pin.y} r={R} />,
        )}
        {inputs.map(
          (pin, i) =>
            pin.dynamic && (
              <polyline
                key={`dyn-${i}`}
                points={`${body.x1},${pin.y - TRI} ${body.x1 + TRI + 2},${pin.y} ${body.x1},${pin.y + TRI}`}
              />
            ),
        )}
      </g>

      {title && (
        <text className="symbol__title" x={cx} y={titleY}>
          {title}
        </text>
      )}
      {subtitle && (
        <text className="symbol__subtitle" x={cx} y={titleY + 15}>
          {subtitle}
        </text>
      )}

      {inputs.map((pin, i) => (
        <g key={`it-${i}`}>
          {pin.label && (
            <text className="symbol__pin" x={body.x1 + (pin.dynamic ? TRI + PIN_GAP + 1 : PIN_GAP)} y={pin.y} textAnchor="start">
              {pin.label}
            </text>
          )}
          {pin.name && (
            <text className="symbol__name" x={-7} y={pin.y} textAnchor="end">
              {pin.name}
            </text>
          )}
        </g>
      ))}
      {outputs.map((pin, i) => (
        <g key={`ot-${i}`}>
          {pin.label && (
            <text
              className={`symbol__pin ${pin.overline ? 'is-overline' : ''}`}
              x={body.x2 - PIN_GAP}
              y={pin.y}
              textAnchor="end"
            >
              {pin.label}
            </text>
          )}
          {pin.name && (
            <text
              className={`symbol__name ${pin.overline ? 'is-overline' : ''}`}
              x={width + 7}
              y={pin.y}
              textAnchor="start"
            >
              {pin.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
