import { useState, useEffect, useCallback } from 'react'
import type { Task, Category, Subtask, TaskFilter, CreateTaskInput, UpdateTaskInput, CreateCategoryInput } from '../shared/types'

export interface TasksApi {
  categories: Category[]; tasks: Task[]; subtasks: Subtask[]
  selectedTaskId: number | null; filter: TaskFilter; loading: boolean
  setFilter: (f: TaskFilter) => void
  setSelectedTaskId: (id: number | null) => void
  createCategory: (input: CreateCategoryInput) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<void>
  updateTask: (id: number, input: UpdateTaskInput) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  createSubtask: (taskId: number, title: string) => Promise<void>
  updateSubtask: (id: number, completed: boolean) => Promise<void>
  deleteSubtask: (id: number) => Promise<void>
}

export function useTasksApi(): TasksApi {
  const [categories, setCategories] = useState<Category[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [filter, setFilterState] = useState<TaskFilter>('today')
  const [loading, setLoading] = useState(true)

  const refreshCategories = useCallback(async () => setCategories(await window.api.getCategories()), [])
  const refreshTasks = useCallback(async (f: TaskFilter) => setTasks(await window.api.getTasks(f)), [])
  const refreshSubtasks = useCallback(async (id: number) => setSubtasks(await window.api.getSubtasks(id)), [])

  useEffect(() => {
    Promise.all([refreshCategories(), refreshTasks(filter)]).finally(() => setLoading(false))
    const unsub = window.api.onTaskFocus((taskId) => setSelectedTaskId(taskId))
    return unsub
  }, [])

  useEffect(() => {
    if (selectedTaskId !== null) refreshSubtasks(selectedTaskId)
    else setSubtasks([])
  }, [selectedTaskId])

  const setFilter = useCallback((f: TaskFilter) => { setFilterState(f); refreshTasks(f) }, [refreshTasks])

  const createCategory = useCallback(async (input: CreateCategoryInput) => {
    await window.api.createCategory(input); await refreshCategories()
  }, [refreshCategories])

  const deleteCategory = useCallback(async (id: number) => {
    await window.api.deleteCategory(id)
    await refreshCategories(); await refreshTasks(filter)
  }, [filter, refreshCategories, refreshTasks])

  const createTask = useCallback(async (input: CreateTaskInput) => {
    await window.api.createTask(input); await refreshTasks(filter)
  }, [filter, refreshTasks])

  const updateTask = useCallback(async (id: number, input: UpdateTaskInput) => {
    await window.api.updateTask(id, input)
    await refreshTasks(filter)
    if (selectedTaskId === id) await refreshSubtasks(id)
  }, [filter, selectedTaskId, refreshTasks, refreshSubtasks])

  const deleteTask = useCallback(async (id: number) => {
    await window.api.deleteTask(id)
    if (selectedTaskId === id) setSelectedTaskId(null)
    await refreshTasks(filter)
  }, [filter, selectedTaskId, refreshTasks])

  const createSubtask = useCallback(async (taskId: number, title: string) => {
    await window.api.createSubtask(taskId, title); await refreshSubtasks(taskId)
  }, [refreshSubtasks])

  const updateSubtask = useCallback(async (id: number, completed: boolean) => {
    await window.api.updateSubtask(id, completed)
    if (selectedTaskId !== null) await refreshSubtasks(selectedTaskId)
  }, [selectedTaskId, refreshSubtasks])

  const deleteSubtask = useCallback(async (id: number) => {
    await window.api.deleteSubtask(id)
    if (selectedTaskId !== null) await refreshSubtasks(selectedTaskId)
  }, [selectedTaskId, refreshSubtasks])

  return {
    categories, tasks, subtasks, selectedTaskId, filter, loading,
    setFilter, setSelectedTaskId,
    createCategory, deleteCategory, createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask
  }
}