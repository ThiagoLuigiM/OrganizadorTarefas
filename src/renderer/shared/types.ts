export type Priority = 'low' | 'medium' | 'high'
export type TaskFilter = number | 'today' | 'priority' | 'all'

export interface Category { id: number; name: string; color: string; created_at: number }

export interface Task {
  id: number; category_id: number | null; title: string; notes: string | null
  priority: Priority; due_at: number | null; completed_at: number | null
  created_at: number; position: number
}

export interface Subtask {
  id: number; task_id: number; title: string; completed_at: number | null; position: number
}

export interface CreateTaskInput {
  category_id?: number | null; title: string; notes?: string
  priority: Priority; due_at?: number | null
}

export interface UpdateTaskInput {
  title?: string; notes?: string | null; priority?: Priority
  due_at?: number | null; category_id?: number | null
  completed_at?: number | null; position?: number
}

export interface CreateCategoryInput { name: string; color: string }

export interface ElectronAPI {
  getCategories: () => Promise<Category[]>
  createCategory: (input: CreateCategoryInput) => Promise<Category>
  deleteCategory: (id: number) => Promise<void>
  getTasks: (filter: TaskFilter) => Promise<Task[]>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: number, input: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  getPendingCount: () => Promise<number>
  getSubtasks: (taskId: number) => Promise<Subtask[]>
  createSubtask: (taskId: number, title: string) => Promise<Subtask>
  updateSubtask: (id: number, completed: boolean) => Promise<Subtask>
  deleteSubtask: (id: number) => Promise<void>
  openMain: () => Promise<void>
  onTasksUpdated: (cb: (count: number) => void) => () => void
  onTaskFocus: (cb: (taskId: number) => void) => () => void
}

declare global { interface Window { api: ElectronAPI } }
