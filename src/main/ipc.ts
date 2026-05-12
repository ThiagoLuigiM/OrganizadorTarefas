import { ipcMain, BrowserWindow } from 'electron'
import {
  getCategories, createCategory, deleteCategory,
  getTasks, createTask, updateTask, deleteTask, getPendingCount,
  getSubtasks, createSubtask, updateSubtask, deleteSubtask
} from './db'
import type { CreateCategoryInput, CreateTaskInput, UpdateTaskInput, TaskFilter } from '../renderer/shared/types'

export function registerIpcHandlers(mainWindow: BrowserWindow, fabWindow: BrowserWindow): void {
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
    const [fx, fy] = fabWindow.getPosition()
    const [fw, fh] = fabWindow.getSize()
    const [mw, mh] = mainWindow.getSize()
    let x = fx + Math.floor(fw / 2) - Math.floor(mw / 2)
    let y = fy - mh - 8
    if (y < 0) y = fy + fh + 8
    if (x < 0) x = 0
    mainWindow.setPosition(x, y)
    mainWindow.show()
    mainWindow.focus()
  })
}