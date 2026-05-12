import Database from 'better-sqlite3'
import type { Category, Task, Subtask, CreateTaskInput, UpdateTaskInput, CreateCategoryInput, TaskFilter } from '../renderer/shared/types'

let db: Database.Database | null = null

export function initDb(dbPath: string): void {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
}

export function closeDb(): void { db?.close(); db = null }

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, color TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL, notes TEXT, priority TEXT NOT NULL DEFAULT 'medium',
      due_at INTEGER, completed_at INTEGER, created_at INTEGER NOT NULL, position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL, completed_at INTEGER, position INTEGER NOT NULL DEFAULT 0
    );
  `)
}

export function getCategories(): Category[] {
  return getDb().prepare('SELECT * FROM categories ORDER BY created_at ASC').all() as Category[]
}

export function createCategory(input: CreateCategoryInput): Category {
  const db = getDb(); const now = Date.now()
  const result = db.prepare('INSERT INTO categories (name, color, created_at) VALUES (?, ?, ?)').run(input.name, input.color, now)
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}

export function deleteCategory(id: number): void {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id)
}

export function getTasks(filter: TaskFilter): Task[] {
  const db = getDb()
  const pendingFirst = 'ORDER BY (CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END), position ASC'
  if (filter === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    return db.prepare('SELECT * FROM tasks WHERE completed_at IS NULL AND due_at BETWEEN ? AND ? ORDER BY position ASC')
      .all(start.getTime(), end.getTime()) as Task[]
  }
  if (filter === 'priority') {
    return db.prepare("SELECT * FROM tasks WHERE completed_at IS NULL AND priority = 'high' ORDER BY position ASC").all() as Task[]
  }
  if (typeof filter === 'number') {
    return db.prepare('SELECT * FROM tasks WHERE category_id = ? ' + pendingFirst).all(filter) as Task[]
  }
  return db.prepare('SELECT * FROM tasks ' + pendingFirst).all() as Task[]
}

export function createTask(input: CreateTaskInput): Task {
  const db = getDb(); const now = Date.now()
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM tasks').get() as { m: number | null }).m ?? -1
  const result = db.prepare(
    'INSERT INTO tasks (category_id, title, notes, priority, due_at, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(input.category_id ?? null, input.title, input.notes ?? null, input.priority, input.due_at ?? null, now, maxPos + 1)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task
}

export function updateTask(id: number, input: UpdateTaskInput): Task {
  const db = getDb()
  const e = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task
  const m: Task = { ...e }
  if (input.title !== undefined) m.title = input.title
  if (input.notes !== undefined) m.notes = input.notes
  if (input.priority !== undefined) m.priority = input.priority
  if (input.due_at !== undefined) m.due_at = input.due_at
  if (input.category_id !== undefined) m.category_id = input.category_id
  if (input.completed_at !== undefined) m.completed_at = input.completed_at
  if (input.position !== undefined) m.position = input.position
  db.prepare('UPDATE tasks SET category_id=?, title=?, notes=?, priority=?, due_at=?, completed_at=?, position=? WHERE id=?')
    .run(m.category_id, m.title, m.notes, m.priority, m.due_at, m.completed_at, m.position, id)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task
}

export function deleteTask(id: number): void { getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id) }

export function getPendingCount(): number {
  return (getDb().prepare('SELECT COUNT(*) as c FROM tasks WHERE completed_at IS NULL').get() as { c: number }).c
}
