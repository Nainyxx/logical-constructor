import { useState } from 'react'
import styles from '../index.css?inline'

async function renderReport(workspace, title, indicators) {
  const world = workspace.querySelector('.workspace__world')
  const nodes = [...world.querySelectorAll('.node')]
  // В отчёт входят также узлы и изгибы проводов за краем текущего окна.
  const bounds = nodes.map(n => ({ x: n.offsetLeft, y: n.offsetTop, width: n.offsetWidth, height: n.offsetHeight }))
  for (const path of world.querySelectorAll('.wire-visible')) bounds.push(path.getBBox())
  const x = bounds.length ? Math.min(...bounds.map(b => b.x)) - 80 : 0
  const y = bounds.length ? Math.min(...bounds.map(b => b.y)) - 36 : 0
  const width = Math.max(580, ...bounds.map(b => b.x + b.width - x + 80))
  const height = Math.max(160, ...bounds.map(b => b.y + b.height - y + 36))
  const copy = world.cloneNode(true)
  copy.style.transform = `translate(${-x}px, ${-y}px)`
  copy.querySelectorAll('.node__remove, .wire-marker, .wire-hit').forEach(n => n.remove())

  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', width)
  svg.setAttribute('height', height)
  svg.setAttribute('data-theme', document.documentElement.dataset.theme || '')
  const css = document.createElementNS(ns, 'style')
  css.textContent = styles
  const area = document.createElementNS(ns, 'foreignObject')
  area.setAttribute('width', width)
  area.setAttribute('height', height)
  area.append(copy)
  svg.append(css, area)
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
  await img.decode()

  const header = indicators.length ? 78 : 46
  const scale = Math.min(2, 4096 / Math.max(width, height + header))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil((height + header) * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  const theme = getComputedStyle(workspace)
  ctx.fillStyle = theme.getPropertyValue('--bg')
  ctx.fillRect(0, 0, width, height + header)
  ctx.fillStyle = theme.color
  ctx.font = 'bold 20px sans-serif'
  ctx.fillText(title, 18, 30)
  indicators.forEach((done, i) => {
    const left = 18 + i * 175
    ctx.fillStyle = theme.getPropertyValue(done ? '--live' : '--danger')
    ctx.beginPath()
    ctx.arc(left + 7, 56, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = theme.color
    ctx.font = '14px sans-serif'
    ctx.fillText(`№${i + 1} ${done ? 'выполнено' : 'не выполнено'}`, left + 21, 61)
  })
  ctx.drawImage(img, 0, header)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG')), 'image/png'))
}

export function ScreenshotButton({ workspace, title, indicators }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function capture() {
    setBusy(true)
    setMessage('')
    try {
      const png = renderReport(workspace.current, title, indicators)
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
        setMessage('Снимок скопирован. Вставьте в Word сочетанием Ctrl+V.')
      } catch {
        const url = URL.createObjectURL(await png)
        const link = document.createElement('a')
        link.href = url
        link.download = title.replace(' · ', ' — ') + '.png'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 60000)
        setMessage('Снимок передан для сохранения в PNG.')
      }
    } catch {
      setMessage('Не удалось создать снимок.')
    } finally {
      setBusy(false)
    }
  }
  return <>
    <button type="button" className="workspace__toolbar-btn" onClick={capture} disabled={busy}>Скриншот</button>
    {message && <span className="screenshot-message" role="status">{message}</span>}
  </>
}
