import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// Set autoDownload to false as per user request
autoUpdater.autoDownload = false

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC ?? '', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1200,
    height: 800,
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST ?? '', 'index.html'))
  }
}

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  win?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  win?.webContents.send('update-not-available', info)
})

autoUpdater.on('download-progress', (progressObj) => {
  win?.webContents.send('download-progress', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  win?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (err) => {
  win?.webContents.send('update-error', err)
})

// IPC handlers for manual update control
ipcMain.handle('check-for-updates', async () => {
  return await autoUpdater.checkForUpdates()
})

ipcMain.handle('start-download', async () => {
  return await autoUpdater.downloadUpdate()
})

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
})
