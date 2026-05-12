import { ipcMain, BrowserWindow } from 'electron'
import Store from 'electron-store'
import {
  getCategories, createCategory, deleteCategory,
  getTasks, createTask, updateTask, deleteTask, getPendingCount,
  getSubtasks, createSubtask, updateSubtask, deleteSubtask
} from './db'
import type { CreateCategoryInput, CreateTaskInput, UpdateTaskInput, TaskFilter } from '../renderer/shared/types'

export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  fabWindow: BrowserWindow,
  store: Store<{ fabPosition: { x: number; y: number } }>
): void {
  const broadcast = () => fabWindow.webContents.send('tasks-updated', getPendingCount())

  ipcMain.handle('get-categories', () => getCategories())
  ipcMain.handle('create-category', (_, input: CreateCategoryInput) => { const c = createCategory(input); broadcast(); return c })
  ipcMain.handle('delete-category', (_, id: number) => { deleteCategory(id); broadcast() })

  ipcMain.handle('get-tasks', (_, filter: TaskFilter) => getTasks(filter))
  ipcMain.handle('create-task', (_, input: CreateTaskInput) => { const t = createTask(input); broadcast(); return t })
  ipcMain.handle('update-task', (_, id: number, input: UpdateTaskInput) => { const t = updateTask(id, input); broadcast(); return t })
  ipcMain.handle('delete-task', (_, id: number) => { deleteTask(id); broadcast() })
  ipcMain.handle('get-pending-count', () => getPendingCount())

  ipcMain.handle('get-subtasks', (_, taskId: number) => getSubtasks(taskId))
  ipcMain.handle('create-subtask', (_, taskId: number, title: string) => createSubtask(taskId, title))
  ipcMain.handle('update-subtask', (_, id: number, completed: boolean) => updateSubtask(id, completed))
  ipcMain.handle('delete-subtask', (_, id: number) => deleteSubtask(id))

  ipcMain.handle('open-main', () => {
    if (mainWindow.isVisible()) { mainWindow.hide(); return }
    mainWindow.center()
    mainWindow.show()
    mainWindow.focus()
  })

  ipcMain.handle('minimize-window', () => mainWindow.minimize())
  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('close-window', () => mainWindow.hide())

  ipcMain.handle('get-fab-position', () => {
    const [x, y] = fabWindow.getPosition()
    return { x, y }
  })
  ipcMain.handle('move-fab-window', (_, x: number, y: number) => {
    const pos = { x: Math.round(x), y: Math.round(y) }
    fabWindow.setPosition(pos.x, pos.y)
    store.set('fabPosition', pos)
  })
}