// точка входа десктопной версии: открывает собранный vite-бандл из dist/
const { app, BrowserWindow, Menu } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Конструктор логических схем',
    autoHideMenuBar: true,
  })
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

Menu.setApplicationMenu(null)

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
