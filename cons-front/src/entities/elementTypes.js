// Описание всех типов элементов, которые можно положить на поле.
// Это единственное место, где определяется, "что такое" элемент —
// компоненты ниже (библиотека, узел на холсте, движок схемы, методичка)
// читают эти описания и не хранят логику элементов в себе.

export const ELEMENT_KIND = {
  SOURCE: 'source', // сам задаёт значение (переключатель)
  GATE: 'gate', // вычисляет значение по входам, без памяти
  SINK: 'sink', // только показывает значение (индикатор)
  MEMORY: 'memory', // хранит состояние между тактами (триггер)
}

// evaluate() для GATE/MEMORY получает (inputs, state) и может вернуть:
//  - boolean            — один выход (обычные вентили);
//  - { outputs, state } — несколько выходов и новое состояние узла
//                          (триггеру нужно помнить прошлое значение,
//                          а не только текущие входы).
//
// symbol — буквенное обозначение внутри прямоугольника по ГОСТ 2.743-91
// (см. components/GateShape.jsx): «&» — И, «≥1» — ИЛИ, «1» — НЕ/повторитель,
// «=1» — Исключающее ИЛИ. negated добавляет кружок инверсии на выходе —
// так один и тот же прямоугольник с «&» обслуживает и И, и И-НЕ. Именно
// в таком виде вентили нарисованы в методичках лабораторных работ.

export const ELEMENT_TYPES = {
  INPUT: {
    id: 'INPUT',
    kind: ELEMENT_KIND.SOURCE,
    label: 'Вход',
    description: 'Источник сигнала (переключатель 0/1)',
    inputCount: 0,
    outputCount: 1,
  },
  OUTPUT: {
    id: 'OUTPUT',
    kind: ELEMENT_KIND.SINK,
    label: 'Выход',
    description: 'Индикатор — показывает пришедший сигнал',
    inputCount: 1,
    outputCount: 0,
  },
  NOT: {
    id: 'NOT',
    kind: ELEMENT_KIND.GATE,
    label: 'НЕ',
    description: 'Инвертор — меняет сигнал на противоположный',
    symbol: '1',
    negated: true,
    formula: 'Y = ¬A',
    inputCount: 1,
    outputCount: 1,
    evaluate: ([a]) => !a,
  },
  AND: {
    id: 'AND',
    kind: ELEMENT_KIND.GATE,
    label: 'И',
    description: 'Конъюнкция — единица, только если все входы равны 1',
    symbol: '&',
    formula: 'Y = A ∧ B',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => a && b,
  },
  OR: {
    id: 'OR',
    kind: ELEMENT_KIND.GATE,
    label: 'ИЛИ',
    description: 'Дизъюнкция — единица, если хотя бы один вход равен 1',
    symbol: '≥1',
    formula: 'Y = A ∨ B',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => a || b,
  },
  XOR: {
    id: 'XOR',
    kind: ELEMENT_KIND.GATE,
    label: 'Искл. ИЛИ',
    description: 'Сложение по модулю 2 — единица, если входы различны',
    symbol: '=1',
    formula: 'Y = A ⊕ B',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => a !== b,
  },
  NAND: {
    id: 'NAND',
    kind: ELEMENT_KIND.GATE,
    label: 'И-НЕ',
    description: 'Штрих Шеффера — инверсия элемента «И»',
    symbol: '&',
    negated: true,
    formula: 'Y = ¬(A ∧ B)',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => !(a && b),
  },
  NOR: {
    id: 'NOR',
    kind: ELEMENT_KIND.GATE,
    label: 'ИЛИ-НЕ',
    description: 'Стрелка Пирса — инверсия элемента «ИЛИ»',
    symbol: '≥1',
    negated: true,
    formula: 'Y = ¬(A ∨ B)',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => !(a || b),
  },
  XNOR: {
    id: 'XNOR',
    kind: ELEMENT_KIND.GATE,
    label: 'Равнозначность',
    description: 'Инверсия «Искл. ИЛИ» — единица, если входы совпадают',
    symbol: '=1',
    negated: true,
    formula: 'Y = ¬(A ⊕ B)',
    inputCount: 2,
    outputCount: 1,
    evaluate: ([a, b]) => a === b,
  },
  D_TRIGGER: {
    id: 'D_TRIGGER',
    kind: ELEMENT_KIND.MEMORY,
    label: 'D-триггер',
    description: 'Хранит один бит — записывает D по такту C',
    boxLabel: 'T',
    inputCount: 2,
    inputLabels: ['D', 'C'],
    outputCount: 2,
    outputLabels: ['Q', "Q'"],
    initialState: () => ({ q: false, prevClock: false }),
    // Запись происходит по фронту такта (переход C из 0 в 1) — так триггер
    // можно свести самого на себя (T-триггер) без немедленного зацикливания.
    evaluate: ([d, c], state) => {
      const prevClock = state?.prevClock ?? false
      const q = c && !prevClock ? d : (state?.q ?? false)
      return { outputs: [q, !q], state: { q, prevClock: c } }
    },
  },
}

// Порядок и состав элементов в полной библиотеке (свободный режим).
// Для лабораторных работ список сокращается через lab.paletteIds
// (см. entities/labs.js) — так на каждой работе видны только уже
// изученные элементы.
export const FULL_PALETTE_IDS = [
  'INPUT',
  'OUTPUT',
  'NOT',
  'AND',
  'OR',
  'XOR',
  'NAND',
  'NOR',
  'XNOR',
  'D_TRIGGER',
]
