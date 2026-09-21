// Имя входа/выхода/столбца. «!Q» рисуется как Q с чертой сверху
// (инверсия) — так в методичках подписаны инверсные выходы триггеров.
export default function Name({ children }) {
  const text = String(children ?? '')
  return text.startsWith('!') && text.length > 1 ? <span className="overline">{text.slice(1)}</span> : text
}
