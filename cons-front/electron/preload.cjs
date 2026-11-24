const { ipcRenderer } = require('electron')

// В десктопной сборке исходный DOCX лежит внутри app.asar.
window.addEventListener('click', event => {
  const link = event.target.closest?.('a[download]')
  if (!link || !link.href.endsWith('.docx')) return
  event.preventDefault()
  ipcRenderer.invoke('save-document', new URL(link.href).pathname.split('/').pop())
}, true)
