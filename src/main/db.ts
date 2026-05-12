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
