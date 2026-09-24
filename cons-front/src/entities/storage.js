// сохранение схемы в localStorage — свой ключ у каждой лабы/задания/свободного режима

const PREFIX = 'logic-lab:circuit:'

export function loadCircuit(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data?.nodes) || !Array.isArray(data?.wires)) return null
    return data
  } catch {
    return null
  }
}

export function saveCircuit(key, nodes, wires) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ nodes, wires }))
  } catch {
    // квота/приватный режим — молча игнорируем
  }
}
