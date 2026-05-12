import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { initDb, closeDb, getDb, getCategories, createCategory, deleteCategory, getTasks, createTask, updateTask, deleteTask, getPendingCount } from '../db'

let TEST_DB = ''
beforeEach(() => { TEST_DB = join(tmpdir(), `ot-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`); initDb(TEST_DB) })
afterEach(() => { closeDb(); [TEST_DB, TEST_DB + '-wal', TEST_DB + '-shm'].forEach(f => { if (existsSync(f)) unlinkSync(f) }) })

describe('initDb', () => {
  it('creates the database file', () => {
    expect(existsSync(TEST_DB)).toBe(true)
  })
  it('creates categories table', () => {
    expect(getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get()).toBeTruthy()
  })
  it('creates tasks table', () => {
    expect(getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").get()).toBeTruthy()
  })
  it('creates subtasks table', () => {
    expect(getDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subtasks'").get()).toBeTruthy()
  })
})
describe('categories', () => {
  it('getCategories returns empty array initially', () => {
    expect(getCategories()).toEqual([])
  })
  it('createCategory inserts and returns the category', () => {
    const cat = createCategory({ name: 'Trabalho', color: '#6c63ff' })
    expect(cat.id).toBeGreaterThan(0)
    expect(cat.name).toBe('Trabalho')
    expect(cat.color).toBe('#6c63ff')
    expect(cat.created_at).toBeGreaterThan(0)
  })
  it('getCategories returns all categories ordered by created_at', () => {
    createCategory({ name: 'Trabalho', color: '#6c63ff' })
    createCategory({ name: 'Pessoal', color: '#22c55e' })
    const cats = getCategories()
    expect(cats).toHaveLength(2)
    expect(cats[0].name).toBe('Trabalho')
  })
  it('deleteCategory removes it', () => {
    const cat = createCategory({ name: 'Temp', color: '#fff' })
    deleteCategory(cat.id)
    expect(getCategories()).toHaveLength(0)
  })
})

describe('tasks', () => {
  it('getTasks("all") returns empty initially', () => { expect(getTasks('all')).toEqual([]) })

  it('createTask inserts and returns the task', () => {
    const task = createTask({ title: 'Test', priority: 'medium' })
    expect(task.id).toBeGreaterThan(0)
    expect(task.title).toBe('Test')
    expect(task.completed_at).toBeNull()
    expect(task.category_id).toBeNull()
  })

  it('getTasks("all") returns pending tasks before completed', () => {
    createTask({ title: 'A', priority: 'low' })
    const b = createTask({ title: 'B', priority: 'high' })
    updateTask(b.id, { completed_at: Date.now() })
    expect(getTasks('all')[0].title).toBe('A')
  })

  it('getTasks("priority") returns only high-priority pending', () => {
    createTask({ title: 'Low', priority: 'low' })
    createTask({ title: 'High', priority: 'high' })
    const tasks = getTasks('priority')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('High')
  })

  it('getTasks("today") returns tasks due today', () => {
    const today = new Date(); today.setHours(12, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    createTask({ title: 'Today', priority: 'medium', due_at: today.getTime() })
    createTask({ title: 'Tomorrow', priority: 'medium', due_at: tomorrow.getTime() })
    const tasks = getTasks('today')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Today')
  })

  it('getTasks(categoryId) returns tasks for that category', () => {
    const cat = createCategory({ name: 'Work', color: '#fff' })
    createTask({ title: 'Work task', priority: 'low', category_id: cat.id })
    createTask({ title: 'No cat', priority: 'low' })
    expect(getTasks(cat.id)).toHaveLength(1)
  })

  it('updateTask updates specified fields only', () => {
    const task = createTask({ title: 'Old', priority: 'low' })
    const updated = updateTask(task.id, { title: 'New', priority: 'high' })
    expect(updated.title).toBe('New')
    expect(updated.priority).toBe('high')
  })

  it('deleteTask removes the task', () => {
    const task = createTask({ title: 'Del', priority: 'low' })
    deleteTask(task.id)
    expect(getTasks('all')).toHaveLength(0)
  })

  it('getPendingCount counts only incomplete tasks', () => {
    const t1 = createTask({ title: 'T1', priority: 'low' })
    createTask({ title: 'T2', priority: 'low' })
    updateTask(t1.id, { completed_at: Date.now() })
    expect(getPendingCount()).toBe(1)
  })
})

import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../db'

describe('subtasks', () => {
  it('getSubtasks returns empty array for a new task', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    expect(getSubtasks(task.id)).toEqual([])
  })
  it('createSubtask inserts and returns subtask', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    const sub = createSubtask(task.id, 'Step one')
    expect(sub.id).toBeGreaterThan(0)
    expect(sub.task_id).toBe(task.id)
    expect(sub.title).toBe('Step one')
    expect(sub.completed_at).toBeNull()
  })
  it('getSubtasks returns subtasks in position order', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    createSubtask(task.id, 'First')
    createSubtask(task.id, 'Second')
    const subs = getSubtasks(task.id)
    expect(subs[0].title).toBe('First')
    expect(subs[1].title).toBe('Second')
  })
  it('updateSubtask(id, true) sets completed_at', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    const sub = createSubtask(task.id, 'Do thing')
    expect(updateSubtask(sub.id, true).completed_at).toBeGreaterThan(0)
  })
  it('updateSubtask(id, false) clears completed_at', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    const sub = createSubtask(task.id, 'Do thing')
    updateSubtask(sub.id, true)
    expect(updateSubtask(sub.id, false).completed_at).toBeNull()
  })
  it('deleteSubtask removes it', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    const sub = createSubtask(task.id, 'Remove me')
    deleteSubtask(sub.id)
    expect(getSubtasks(task.id)).toHaveLength(0)
  })
  it('deleting a task cascades to subtasks', () => {
    const task = createTask({ title: 'Parent', priority: 'low' })
    createSubtask(task.id, 'Child')
    deleteTask(task.id)
    expect(getSubtasks(task.id)).toHaveLength(0)
  })
})
