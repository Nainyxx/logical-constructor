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

// ---- заготовки для описаний элементов ниже ---------------------------------

const QQ = [{ label: 'Q' }, { label: 'Q', inverted: true, overline: true }]
const BITS = [{ label: 'Q0' }, { label: 'Q1' }, { label: 'Q2' }, { label: 'Q3' }]
const bitsOf = (state) => [0, 1, 2, 3].map((i) => !!((state?.bits ?? 0) & (1 << i)))

function combo(id, label, description, box, inputs, outputs, evaluate) {
  return {
    id,
    kind: ELEMENT_KIND.GATE,
    label,
    description,
    box,
    pins: { inputs: inputs.map((name) => ({ label: name })), outputs: outputs.map((name) => ({ label: name })) },
    inputCount: inputs.length,
    outputCount: outputs.length,
    evaluate,
  }
}

// Элемент с памятью. Состояние хранится в самом узле; пока схема считает
// «такт», наружу выдаётся сохранённое состояние (peek), а новое —
// вычисляется отдельно (см. entities/circuit.js). next(inputs, state) —
// новое состояние по текущим входам.
function memory(id, label, description, box, inputPins, outputPins, { initialState, peek, next }) {
  return {
    id,
    kind: ELEMENT_KIND.MEMORY,
    label,
    description,
    box,
    pins: { inputs: inputPins, outputs: outputPins },
    inputCount: inputPins.length,
    outputCount: outputPins.length,
    initialState,
    peek,
    evaluate: (inputs, state) => {
      const nextState = next(inputs, state)
      return { outputs: peek(nextState), state: nextState }
    },
  }
}

// Триггер, управляемый фронтом: запись только в момент перехода тактового
// входа (последний вход) из 0 в 1. prevClock: null — такт ещё не
// наблюдался: первое вычисление не считается фронтом, иначе триггер,
// тактируемый выходом другого триггера, «срабатывал» бы сам при включении.
function edgeTriggered({ peek, load, initial }) {
  return {
    initialState: () => ({ ...initial, prevClock: null }),
    peek,
    next: (inputs, state) => {
      const clock = !!inputs[inputs.length - 1]
      const rising = clock && state?.prevClock === false
      const kept = rising ? load(inputs.slice(0, -1), state) : state
      return { ...initial, ...kept, prevClock: clock }
    },
  }
}

// evaluate() для GATE/MEMORY получает (inputs, state) и может вернуть:
//  - boolean            — один выход (обычные вентили);
//  - { outputs, state } — несколько выходов и новое состояние узла
//                          (триггеру нужно помнить прошлое значение,
//                          а не только текущие входы).
//
// symbol — буквенное обозначение внутри прямоугольника по ГОСТ 2.743-91
// (см. entities/symbols.js): «&» — И, «≥1» — ИЛИ, «1» — НЕ/повторитель,
// «=1» — Исключающее ИЛИ. negated добавляет кружок инверсии на выходе —
// так один и тот же прямоугольник с «&» обслуживает и И, и И-НЕ. Именно
// в таком виде вентили нарисованы в методичках лабораторных работ.
//
// У функциональных узлов (HS, SM, DC, MUX, триггеры, регистры) вместо
// symbol — box (заголовок корпуса) и pins (метки выводов): корпус и
// положение портов вычисляются по числу выводов (см. entities/layout.js).

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
  // ---- функциональные узлы из методичек (лаб. 2–3) --------------------
  // Комбинационные: вычисляют выходы по текущим входам. В лабораторных
  // работах их собирают из вентилей вручную; готовыми они доступны в
  // свободном режиме. Выводы подписаны как в методичках (A, B, S, P, X1, Y1…).
  HS: combo('HS', 'Полусумматор', 'Складывает два бита: сумма S и перенос P', { title: 'HS' }, ['A', 'B'], ['S', 'P'], ([a, b]) => [
    a !== b,
    a && b,
  ]),
  SM: combo('SM', 'Полный сумматор', 'Складывает A, B и перенос P0 из младшего разряда', { title: 'SM' }, ['A', 'B', 'P0'], ['S', 'P'], ([a, b, p0]) => [
    (a !== b) !== p0,
    (a && b) || (p0 && a !== b),
  ]),
  DC: combo('DC', 'Дешифратор 2 в 4', 'Код на X1, X2 включает ровно один из выходов Y1…Y4', { title: 'DC' }, ['X1', 'X2'], ['Y1', 'Y2', 'Y3', 'Y4'], ([x1, x2]) => {
    const active = (x1 ? 1 : 0) + (x2 ? 2 : 0)
    return [0, 1, 2, 3].map((k) => k === active)
  }),
  CD: combo('CD', 'Шифратор 4 в 2', 'Номер активного входа в двоичном коде на Y1 (младший), Y2', { title: 'CD' }, ['X1', 'X2', 'X3', 'X4'], ['Y1', 'Y2'], ([, x2, x3, x4]) => [
    x2 || x4,
    x3 || x4,
  ]),
  MUX2: combo('MUX2', 'Мультиплексор 2 в 1', 'Пропускает на выход D1 при A = 0 и D2 при A = 1', { title: 'MUX' }, ['D1', 'D2', 'A'], ['Y'], ([d1, d2, a]) => (a ? d2 : d1)),
  MUX4: combo('MUX4', 'Мультиплексор 4 в 1', 'Пропускает на выход D1…D4 по адресу A2A1', { title: 'MUX' }, ['D1', 'D2', 'D3', 'D4', 'A1', 'A2'], ['Y'], ([d1, d2, d3, d4, a1, a2]) => [d1, d2, d3, d4][(a1 ? 1 : 0) + (a2 ? 2 : 0)]),
  DMX2: combo('DMX2', 'Демультиплексор 1 в 2', 'Передаёт D на Y1 при A = 0 и на Y2 при A = 1', { title: 'DMX' }, ['D', 'A'], ['Y1', 'Y2'], ([d, a]) => [d && !a, d && a]),
  DMX4: combo('DMX4', 'Демультиплексор 1 в 4', 'Передаёт D на один из выходов Y1…Y4 по адресу A2A1', { title: 'DMX' }, ['D', 'A1', 'A2'], ['Y1', 'Y2', 'Y3', 'Y4'], ([d, a1, a2]) => {
    const active = (a1 ? 1 : 0) + (a2 ? 2 : 0)
    return [0, 1, 2, 3].map((k) => d && k === active)
  }),

  // ---- триггеры и регистры (лаб. 4–5) ---------------------------------
  RS_TRIGGER: memory('RS_TRIGGER', 'RS-триггер', 'Асинхронный: S = 1 устанавливает Q, R = 1 сбрасывает; S = R = 1 запрещено', { title: 'RS' }, [{ label: 'S' }, { label: 'R' }], QQ, {
    initialState: () => ({ q: false, bad: false }),
    peek: (state) => (state?.bad ? [false, false] : [state?.q ?? false, !(state?.q ?? false)]),
    next: ([s, r], state) => (s && r ? { q: false, bad: true } : s ? { q: true, bad: false } : r ? { q: false, bad: false } : { q: state?.q ?? false, bad: false }),
  }),
  D_LATCH: memory('D_LATCH', 'D-триггер (защёлка)', 'По уровню: пока C = 1, выход повторяет D; при C = 0 хранит', { title: 'D' }, [{ label: 'D' }, { label: 'C' }], QQ, {
    initialState: () => ({ q: false }),
    peek: (state) => [state?.q ?? false, !(state?.q ?? false)],
    next: ([d, c], state) => ({ q: c ? d : (state?.q ?? false) }),
  }),
  D_TRIGGER: memory('D_TRIGGER', 'D-триггер', 'По фронту: записывает D в момент перехода C из 0 в 1', { title: 'D' }, [{ label: 'D' }, { label: 'C', dynamic: true }], QQ, edgeTriggered({
    peek: (state) => [state?.q ?? false, !(state?.q ?? false)],
    load: ([d], state) => ({ q: d ?? state?.q }),
    initial: { q: false },
  })),
  T_TRIGGER: memory('T_TRIGGER', 'T-триггер', 'Счётный: меняет состояние на каждом такте C — делит частоту на два', { title: 'T' }, [{ label: 'C', dynamic: true }], QQ, edgeTriggered({
    peek: (state) => [state?.q ?? false, !(state?.q ?? false)],
    load: (_, state) => ({ q: !(state?.q ?? false) }),
    initial: { q: false },
  })),
  RG: memory('RG', 'Параллельный регистр', 'Четыре D-триггера с общим тактом C: по фронту записывает D0…D3', { title: 'RG', wide: true }, [{ label: 'D0' }, { label: 'D1' }, { label: 'D2' }, { label: 'D3' }, { label: 'C', dynamic: true }], BITS, edgeTriggered({
    peek: (state) => bitsOf(state),
    load: (d) => ({ bits: d.slice(0, 4).reduce((sum, v, i) => sum + (v ? 1 << i : 0), 0) }),
    initial: { bits: 0 },
  })),
  RG_SHIFT: memory('RG_SHIFT', 'Регистр сдвига', 'Четыре разряда: по каждому фронту C всё слово сдвигается на разряд, в Q0 входит D', { title: 'RG', subtitle: '→', wide: true }, [{ label: 'D' }, { label: 'C', dynamic: true }], BITS, edgeTriggered({
    peek: (state) => bitsOf(state),
    load: ([d], state) => ({ bits: (((state?.bits ?? 0) << 1) | (d ? 1 : 0)) & 15 }),
    initial: { bits: 0 },
  })),
}

// Порядок и состав элементов в полной библиотеке (свободный режим).
// Для лабораторных работ список сокращается через lab.paletteIds
// (см. entities/labs.js) — так на каждой работе видны только уже
// изученные элементы.
export const FULL_PALETTE_GROUPS = [
  { title: 'Базовые элементы', ids: ['INPUT', 'OUTPUT', 'NOT', 'AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'] },
  { title: 'Сумматоры и коммутаторы', ids: ['HS', 'SM', 'DC', 'CD', 'MUX2', 'MUX4', 'DMX2', 'DMX4'] },
  { title: 'Триггеры и регистры', ids: ['RS_TRIGGER', 'D_LATCH', 'D_TRIGGER', 'T_TRIGGER', 'RG', 'RG_SHIFT'] },
]

export const FULL_PALETTE_IDS = FULL_PALETTE_GROUPS.flatMap((group) => group.ids)
