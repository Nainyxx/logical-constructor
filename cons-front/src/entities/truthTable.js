// Строит таблицу истинности комбинационного элемента напрямую по его
// evaluate() — так таблица в методичке гарантированно не разойдётся
// с тем, что реально считает схема.

export function buildTruthTable(type) {
  const n = type.inputCount
  const rows = []
  for (let mask = 0; mask < 2 ** n; mask++) {
    const inputs = Array.from({ length: n }, (_, i) => Boolean(mask & (1 << (n - 1 - i))))
    const raw = type.evaluate(inputs)
    const outputs = Array.isArray(raw) ? raw : [raw]
    rows.push({ inputs, outputs })
  }
  return rows
}
