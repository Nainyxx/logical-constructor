import { useEffect, useState } from 'react'
import { checkTask } from '../entities/taskCompletion'

export function useTaskReview(check, { nodes, wires }) {
  // Порядок входов и выходов влияет на сопоставление безымянных столбцов.
  const terminals = nodes.filter(n => ['INPUT', 'OUTPUT'].includes(n.typeId))
    .sort((a, b) => a.y - b.y || a.x - b.x)
  const signature = JSON.stringify([
    nodes.map(n => [n.id, n.typeId, n.label, check === 'mux' && n.on]),
    terminals.map(n => n.id), wires,
  ])
  const key = `logic-lab:verified:${check}`
  const [review, setReview] = useState(() => {
    try {
      if (localStorage.getItem(key) === signature) return { signature, done: true }
    } catch { /* Хранилище недоступно. */ }
    return null
  })
  if (review && review.signature !== signature) setReview(null)
  useEffect(() => {
    try {
      if (review?.done && review.signature === signature) localStorage.setItem(key, signature)
      else localStorage.removeItem(key)
    } catch { /* Проверка доступна и без сохранения. */ }
  }, [key, review, signature])
  function verify() {
    const error = checkTask(check, nodes, wires)
    setReview({ signature, done: !error, error })
  }
  return { review, verify }
}
