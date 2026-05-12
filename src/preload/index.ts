import { contextBridge, ipcRenderer } from 'electron'
import type { CreateTaskInput, UpdateTaskInput, CreateCategoryInput, TaskFilter } from '../renderer/shared/types'

contextBridge.exposeInMainWorld('api', {
  getCategories: () => ipcRenderer.invoke('get-categories'),
  createCategory: (input: CreateCategoryInput) => ipcRenderer.invoke('create-category', input),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),
  getTasks: (filter: TaskFilter) => ipcRenderer.invoke('get-tasks', filter),
  createTask: (input: CreateTaskInput) => ipcRenderer.invoke('create-task', input),
  updateTask: (id: number, input: UpdateTaskInput) => ipcRenderer.invoke('update-task', id, input),
  deleteTask: (id: number) => ipcRenderer.invoke('delete-task', id),
  getPendingCount: () => ipcRenderer.invoke('get-pending-count'),
  getSubtasks: (taskId: number) => ipcRenderer.invoke('get-subtasks', taskId),
  createSubtask: (taskId: number, title: string) => ipcRenderer.invoke('create-subtask', taskId, title),
  updateSubtask: (id: number, completed: boolean) => ipcRenderer.invoke('update-subtask', id, completed),
  deleteSubtask: (id: number) => ipcRenderer.invoke('delete-subtask', id),
  openMain: () => ipcRenderer.invoke('open-main'),
  onTasksUpdated: (cb: (count: number) => void) => {
    const h = (_: unknown, n: number) => cb(n)
    ipcRenderer.on('tasks-updated', h)
    return () => ipcRenderer.off('tasks-updated', h)
  },
  onTaskFocus: (cb: (id: number) => void) => {
    const h = (_: unknown, id: number) => cb(id)
    ipcRenderer.on('task-focus', h)
    return () => ipcRenderer.off('task-focus', h)
  }
})
