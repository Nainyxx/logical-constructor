// Описание всех типов элементов, которые можно положить на поле.
// Это единственное место, где определяется, "что такое" элемент —
// компоненты ниже (палитра, узел на холсте, движок схемы) читают
// эти описания и не хранят логику элементов в себе.

export const ELEMENT_KIND = {
  SOURCE: 'source', // сам задаёт значение (переключатель)
  GATE: 'gate', // вычисляет значение по входам
  SINK: 'sink', // только показывает значение (лампочка)
}

export const ELEMENT_TYPES = {
  INPUT: {
    id: 'INPUT',
    kind: ELEMENT_KIND.SOURCE,
    label: 'Вход',
    inputCount: 0,
    hasOutput: true,
  },
  AND: {
    id: 'AND',
    kind: ELEMENT_KIND.GATE,
    label: 'И',
    symbol: '&',
    inputCount: 2,
    hasOutput: true,
    evaluate: (inputs) => inputs.every(Boolean),
  },
  OR: {
    id: 'OR',
    kind: ELEMENT_KIND.GATE,
    label: 'ИЛИ',
    symbol: '+',
    inputCount: 2,
    hasOutput: true,
    evaluate: (inputs) => inputs.some(Boolean),
  },
  NOT: {
    id: 'NOT',
    kind: ELEMENT_KIND.GATE,
    label: 'НЕ',
    symbol: '1',
    inputCount: 1,
    hasOutput: true,
    negated: true,
    evaluate: (inputs) => !inputs[0],
  },
  OUTPUT: {
    id: 'OUTPUT',
    kind: ELEMENT_KIND.SINK,
    label: 'Выход',
    inputCount: 1,
    hasOutput: false,
  },
}

// Порядок и состав элементов в нижней панели.
export const PALETTE_ELEMENT_IDS = ['INPUT', 'AND', 'OR', 'NOT', 'OUTPUT']
