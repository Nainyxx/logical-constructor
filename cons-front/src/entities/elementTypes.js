// Описание всех типов элементов, которые можно положить на поле.
// Это единственное место, где определяется, "что такое" элемент —
// компоненты ниже (палитра, узел на холсте, движок схемы) читают
// эти описания и не хранят логику элементов в себе.

export const ELEMENT_KIND = {
  SOURCE: 'source', // сам задаёт значение (переключатель)
  GATE: 'gate', // вычисляет значение по входам, без памяти
  SINK: 'sink', // только показывает значение (лампочка)
  MEMORY: 'memory', // хранит состояние между тактами (триггеры, ячейки памяти)
}

// evaluate() для GATE/MEMORY получает (inputs, state) и может вернуть:
//  - boolean            — один выход (обычные вентили);
//  - boolean[]          — несколько выходов, без изменения состояния
//                          (шифратор, дешифратор — чисто комбинационные);
//  - { outputs, state } — несколько выходов и новое состояние узла
//                          (триггеры, память — им нужно помнить прошлое
//                          значение, а не только текущие входы).

export const ELEMENT_TYPES = {
  INPUT: {
    id: 'INPUT',
    kind: ELEMENT_KIND.SOURCE,
    label: 'Вход',
    inputCount: 0,
    outputCount: 1,
  },
  AND: {
    id: 'AND',
    kind: ELEMENT_KIND.GATE,
    label: 'И',
    symbol: '&',
    inputCount: 2,
    outputCount: 1,
    evaluate: (inputs) => inputs.every(Boolean),
  },
  OR: {
    id: 'OR',
    kind: ELEMENT_KIND.GATE,
    label: 'ИЛИ',
    symbol: '+',
    inputCount: 2,
    outputCount: 1,
    evaluate: (inputs) => inputs.some(Boolean),
  },
  NOT: {
    id: 'NOT',
    kind: ELEMENT_KIND.GATE,
    label: 'НЕ',
    symbol: '1',
    inputCount: 1,
    outputCount: 1,
    negated: true,
    evaluate: (inputs) => !inputs[0],
  },
  OUTPUT: {
    id: 'OUTPUT',
    kind: ELEMENT_KIND.SINK,
    label: 'Выход',
    inputCount: 1,
    outputCount: 0,
  },
  DECODER2: {
    id: 'DECODER2',
    kind: ELEMENT_KIND.GATE,
    label: 'Дешифратор',
    symbol: 'DC',
    inputCount: 2,
    inputLabels: ['A1', 'A0'],
    outputCount: 4,
    outputLabels: ['Y0', 'Y1', 'Y2', 'Y3'],
    // Двоичный код на входах превращается в единицу ровно на одном
    // из четырёх выходов — остальные выходы всегда в нуле.
    evaluate: (inputs) => {
      const code = (inputs[0] ? 2 : 0) + (inputs[1] ? 1 : 0)
      return [0, 1, 2, 3].map((i) => i === code)
    },
  },
  ENCODER4: {
    id: 'ENCODER4',
    kind: ELEMENT_KIND.GATE,
    label: 'Шифратор',
    symbol: 'CD',
    inputCount: 4,
    inputLabels: ['D0', 'D1', 'D2', 'D3'],
    outputCount: 2,
    outputLabels: ['A1', 'A0'],
    // Приоритетный шифратор: если включено сразу несколько входов,
    // на выход кодируется номер входа со старшим индексом.
    evaluate: (inputs) => {
      let active = -1
      for (let i = inputs.length - 1; i >= 0; i--) {
        if (inputs[i]) {
          active = i
          break
        }
      }
      if (active === -1) return [false, false]
      return [(active & 2) !== 0, (active & 1) !== 0]
    },
  },
  RS_TRIGGER: {
    id: 'RS_TRIGGER',
    kind: ELEMENT_KIND.MEMORY,
    label: 'RS-триггер',
    symbol: 'RS',
    inputCount: 2,
    inputLabels: ['S', 'R'],
    outputCount: 2,
    outputLabels: ['Q', "Q'"],
    initialState: () => ({ q: false }),
    // S устанавливает Q в единицу, R сбрасывает в ноль; если оба входа
    // выключены — триггер хранит то значение, что было раньше.
    evaluate: ([s, r], state) => {
      let q = state?.q ?? false
      if (s && !r) q = true
      else if (r && !s) q = false
      else if (s && r) q = false // запрещённая комбинация — трактуем как сброс
      return { outputs: [q, !q], state: { q } }
    },
  },
  MEMORY_CELL: {
    id: 'MEMORY_CELL',
    kind: ELEMENT_KIND.MEMORY,
    label: 'Память',
    symbol: 'RG',
    inputCount: 2,
    inputLabels: ['D', 'WE'],
    outputCount: 1,
    initialState: () => ({ q: false }),
    // Пока включено разрешение записи (WE), выход повторяет данные (D);
    // как только WE выключается, ячейка хранит последнее записанное значение.
    evaluate: ([d, we], state) => {
      const q = we ? d : (state?.q ?? false)
      return { outputs: [q], state: { q } }
    },
  },
}

// Порядок и состав элементов в нижней панели.
export const PALETTE_ELEMENT_IDS = [
  'INPUT',
  'AND',
  'OR',
  'NOT',
  'OUTPUT',
  'DECODER2',
  'ENCODER4',
  'RS_TRIGGER',
  'MEMORY_CELL',
]
