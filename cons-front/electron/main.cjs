// точка входа десктопной версии: открывает собранный vite-бандл из dist/
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const { copyFile } = require('node:fs/promises')
const path = require('node:path')

ipcMain.handle('save-document', async (event, filename) => {
  if (typeof filename !== 'string' || !/^(?:lab-[1-5]|vse-laby|shablon-otcheta|rukovodstvo-polzovatelya)\.docx$/.test(filename)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  try {
    const result = await dialog.showSaveDialog(win, {
      title: 'Сохранить документ',
      defaultPath: path.join(app.getPath('documents'), filename),
      filters: [{ name: 'Документ Word', extensions: ['docx'] }],
    })
    if (!result.canceled) await copyFile(path.join(__dirname, '..', 'dist', 'docs', filename), result.filePath)
  } catch (error) {
    dialog.showErrorBox('Не удалось сохранить документ', error.message)
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Конструктор логических схем',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
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
