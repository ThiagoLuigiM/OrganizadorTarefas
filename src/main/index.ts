import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { initDb } from './db'
import { registerIpcHandlers } from './ipc'
import { startScheduler } from './scheduler'

const store = new Store<{ fabPosition: { x: number; y: number } }>()
let mainWindow: BrowserWindow
let fabWindow: BrowserWindow

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900, height: 600, minWidth: 700, minHeight: 500,
    show: false, center: true, frame: false, backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false
    }
  })
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  win.on('close', (e) => { e.preventDefault(); win.hide() })
  return win
}

function createFabWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const saved = store.get('fabPosition', { x: width - 90, y: height - 90 })
  const win = new BrowserWindow({
    width: 72, height: 72, x: saved.x, y: saved.y,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false
    }
  })
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/fab.html')
  } else {
    win.loadFile(join(__dirname, '../renderer/fab.html'))
  }
  win.on('moved', () => {
    const [x, y] = win.getPosition()
    store.set('fabPosition', { x, y })
  })
  return win
}

app.whenReady().then(() => {
  initDb(join(app.getPath('userData'), 'tasks.db'))
  mainWindow = createMainWindow()
  fabWindow = createFabWindow()
  registerIpcHandlers(mainWindow, fabWindow, store)
  const stopScheduler = startScheduler(mainWindow, fabWindow)
  app.on('before-quit', stopScheduler)
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })