# OrganizadorTarefas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Electron desktop app for gerenciamento de tarefas com FAB flutuante sempre-no-topo, janela principal com sidebar + lista + painel de detalhes, notificacoes de prazo, e persistencia em SQLite.

**Architecture:** Duas BrowserWindows — MainWindow (React: sidebar + lista + detalhes) e FabWindow (FAB always-on-top). Todo acesso ao SQLite fica no Main process; renderers comunicam via IPC atraves de um preload contextBridge. Posicao do FAB persiste em electron-store. Notificacoes via node-schedule 15 min antes do vencimento.

**Tech Stack:** Electron 28, electron-vite 2, React 18, TypeScript 5, better-sqlite3 9, electron-store 8, node-schedule 2, Vitest 1

---

## File Map

```
src/
  main/
    index.ts            Entry: cria MainWindow + FabWindow, registra IPC, inicia scheduler
    db.ts               SQLite: initDb/closeDb/getDb + CRUD categories/tasks/subtasks
    ipc.ts              Registra todos os handlers IPC (delega para db.ts)
    scheduler.ts        node-schedule: dispara notificacoes 15 min antes do vencimento
    __tests__/
      db.test.ts        Testes unitarios para db.ts
      scheduler.test.ts Testes para logica de agendamento
  preload/
    index.ts            contextBridge: expoe window.api para os dois renderers
  renderer/
    index.html          HTML shell da MainWindow
    fab.html            HTML shell da FabWindow
    main.tsx            React root da MainWindow
    fab.tsx             React root da FabWindow
    shared/
      types.ts          Tipos TypeScript compartilhados
    components/
      Sidebar.tsx       Painel esquerdo: smart lists + categorias
      TaskList.tsx      Painel central: lista de TaskItem
      TaskItem.tsx      Linha de tarefa individual
      TaskDetail.tsx    Painel direito: campos editaveis + subtarefas
    hooks/
      useTasksApi.ts    Encapsula chamadas IPC em estado React
    App.tsx             Root: conecta Sidebar + TaskList + TaskDetail
    global.css          Variaveis CSS + estilos base
  fab/
    Fab.tsx             Botao FAB com badge de contagem
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `src/renderer/index.html`
- Create: `src/renderer/fab.html`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "organizador-tarefas",
  "version": "1.0.0",
  "description": "Desktop task manager with floating FAB",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.0.0",
    "@types/node-schedule": "^2.1.7",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "electron": "^28.3.0",
    "electron-vite": "^2.3.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "vite": "^5.3.0"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "electron-store": "^8.2.0",
    "node-schedule": "^2.1.1",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create electron.vite.config.ts**

```ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main_window: resolve(__dirname, 'src/renderer/index.html'),
          fab_window: resolve(__dirname, 'src/renderer/fab.html')
        }
      }
    }
  }
})
```

- [ ] **Step 4: Create tsconfig.json**

```json
{ "files": [], "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }] }
```

- [ ] **Step 5: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true, "module": "CommonJS", "moduleResolution": "node",
    "target": "ES2020", "lib": ["ES2020"], "strict": true,
    "esModuleInterop": true, "skipLibCheck": true, "types": ["node"]
  },
  "include": ["electron.vite.config.*", "src/main/**/*", "src/preload/**/*"]
}
```

- [ ] **Step 6: Create tsconfig.web.json**

```json
{
  "compilerOptions": {
    "composite": true, "module": "ESNext", "moduleResolution": "bundler",
    "target": "ES2020", "lib": ["ES2020", "DOM"], "strict": true,
    "esModuleInterop": true, "skipLibCheck": true, "jsx": "react-jsx"
  },
  "include": ["src/renderer/**/*"]
}
```

- [ ] **Step 7: Create src/renderer/index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head><meta charset="UTF-8" /><title>OrganizadorTarefas</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/renderer/fab.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <style>* { margin: 0; padding: 0; box-sizing: border-box; } html, body { background: transparent; overflow: hidden; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/fab.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: scaffold Electron Vite + React + TypeScript project"
```

---

## Task 2: Shared Types + Preload API

**Files:**
- Create: `src/renderer/shared/types.ts`
- Create: `src/preload/index.ts`

- [ ] **Step 1: Create src/renderer/shared/types.ts**

```ts
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
```

- [ ] **Step 2: Create src/preload/index.ts**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/shared/types.ts src/preload/index.ts
git commit -m "feat: shared types and preload contextBridge API"
```

---

## Task 3: Database — Init + Schema (TDD)

**Files:**
- Create: `src/main/db.ts`
- Create: `src/main/__tests__/db.test.ts`

- [ ] **Step 1: Write failing tests for DB init**

Create `src/main/__tests__/db.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { initDb, closeDb, getDb } from '../db'

const TEST_DB = join(tmpdir(), `ot-test-${Date.now()}.db`)
beforeEach(() => { initDb(TEST_DB) })
afterEach(() => { closeDb(); if (existsSync(TEST_DB)) unlinkSync(TEST_DB) })

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --reporter=verbose`
Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 3: Create src/main/db.ts**

```ts
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
```

- [ ] **Step 4: Run tests — expect PASS (4 tests)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 5: Commit**

```bash
git add src/main/db.ts src/main/__tests__/db.test.ts
git commit -m "feat: database init, schema, and migrations"
```

---

## Task 4: Database — Categories CRUD (TDD)

**Files:**
- Modify: `src/main/db.ts` (append)
- Modify: `src/main/__tests__/db.test.ts` (append)

- [ ] **Step 1: Append failing category tests to db.test.ts**

```ts
import { getCategories, createCategory, deleteCategory } from '../db'

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
```

- [ ] **Step 2: Run — expect FAIL (`getCategories is not a function`)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 3: Append category functions to db.ts**

```ts
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
```

- [ ] **Step 4: Run — expect PASS (8 tests)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 5: Commit**

```bash
git add src/main/db.ts src/main/__tests__/db.test.ts
git commit -m "feat: categories CRUD in database layer"
```

---

## Task 5: Database — Tasks CRUD + Pending Count (TDD)

**Files:**
- Modify: `src/main/db.ts` (append)
- Modify: `src/main/__tests__/db.test.ts` (append)

- [ ] **Step 1: Append failing task tests to db.test.ts**

```ts
import { getTasks, createTask, updateTask, deleteTask, getPendingCount } from '../db'

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
```

- [ ] **Step 2: Run — expect FAIL (`getTasks is not a function`)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 3: Append task functions to db.ts**

```ts
export function getTasks(filter: TaskFilter): Task[] {
  const db = getDb()
  const pendingFirst = 'ORDER BY (CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END), position ASC'
  if (filter === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    return db.prepare(`SELECT * FROM tasks WHERE completed_at IS NULL AND due_at BETWEEN ? AND ? ORDER BY position ASC`)
      .all(start.getTime(), end.getTime()) as Task[]
  }
  if (filter === 'priority') {
    return db.prepare(`SELECT * FROM tasks WHERE completed_at IS NULL AND priority = 'high' ORDER BY position ASC`).all() as Task[]
  }
  if (typeof filter === 'number') {
    return db.prepare(`SELECT * FROM tasks WHERE category_id = ? ${pendingFirst}`).all(filter) as Task[]
  }
  return db.prepare(`SELECT * FROM tasks ${pendingFirst}`).all() as Task[]
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
```

- [ ] **Step 4: Run — expect PASS (all + 9 new tests)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 5: Commit**

```bash
git add src/main/db.ts src/main/__tests__/db.test.ts
git commit -m "feat: tasks CRUD and pending count in database layer"
```

---

## Task 6: Database — Subtasks CRUD (TDD)

**Files:**
- Modify: `src/main/db.ts` (append)
- Modify: `src/main/__tests__/db.test.ts` (append)

- [ ] **Step 1: Append failing subtask tests to db.test.ts**

```ts
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
```

- [ ] **Step 2: Run — expect FAIL (`getSubtasks is not a function`)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 3: Append subtask functions to db.ts**

```ts
export function getSubtasks(taskId: number): Subtask[] {
  return getDb().prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC').all(taskId) as Subtask[]
}

export function createSubtask(taskId: number, title: string): Subtask {
  const db = getDb()
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM subtasks WHERE task_id = ?').get(taskId) as { m: number | null }).m ?? -1
  const result = db.prepare('INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)').run(taskId, title, maxPos + 1)
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid) as Subtask
}

export function updateSubtask(id: number, completed: boolean): Subtask {
  const db = getDb()
  db.prepare('UPDATE subtasks SET completed_at = ? WHERE id = ?').run(completed ? Date.now() : null, id)
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask
}

export function deleteSubtask(id: number): void {
  getDb().prepare('DELETE FROM subtasks WHERE id = ?').run(id)
}
```

- [ ] **Step 4: Run — expect PASS (all + 7 new tests)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 5: Commit**

```bash
git add src/main/db.ts src/main/__tests__/db.test.ts
git commit -m "feat: subtasks CRUD in database layer"
```

---

## Task 7: IPC Handlers + Main Process Entry

**Files:**
- Create: `src/main/ipc.ts`
- Create: `src/main/index.ts`

- [ ] **Step 1: Create src/main/ipc.ts**

```ts
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
```

- [ ] **Step 2: Create src/main/index.ts**

```ts
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
    width: 900, height: 600, minWidth: 700, minHeight: 500, show: false,
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
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/fab.html`)
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
  registerIpcHandlers(mainWindow, fabWindow)
  const stopScheduler = startScheduler(mainWindow, fabWindow)
  app.on('before-quit', stopScheduler)
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
```

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc.ts src/main/index.ts
git commit -m "feat: IPC handlers and main process window management"
```

---

## Task 8: FAB Renderer

**Files:**
- Create: `src/fab/Fab.tsx`
- Create: `src/renderer/fab.tsx`

- [ ] **Step 1: Create src/fab/Fab.tsx**

```tsx
import { useEffect, useState } from 'react'

export default function Fab() {
  const [count, setCount] = useState(0)
  const allDone = count === 0

  useEffect(() => {
    window.api.getPendingCount().then(setCount)
    const unsub = window.api.onTasksUpdated(setCount)
    return unsub
  }, [])

  return (
    <div style={{ width: 72, height: 72, WebkitAppRegion: 'drag' as never, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onClick={() => window.api.openMain()}
        style={{
          WebkitAppRegion: 'no-drag' as never,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: allDone ? '#22c55e' : '#6c63ff', color: 'white', fontSize: 22,
          cursor: 'pointer', position: 'relative',
          boxShadow: allDone ? '0 4px 16px rgba(34,197,94,0.5)' : '0 4px 16px rgba(108,99,255,0.5)',
          transition: 'background 0.2s'
        }}>
        ✓
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#ef4444',
            borderRadius: '50%', width: 18, height: 18, fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create src/renderer/fab.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import Fab from '../fab/Fab'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Fab /></React.StrictMode>
)
```

- [ ] **Step 3: Commit**

```bash
git add src/fab/Fab.tsx src/renderer/fab.tsx
git commit -m "feat: FAB renderer with pending count badge"
```

---

## Task 9: useTasksApi Hook

**Files:**
- Create: `src/renderer/hooks/useTasksApi.ts`

- [ ] **Step 1: Create src/renderer/hooks/useTasksApi.ts**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/hooks/useTasksApi.ts
git commit -m "feat: useTasksApi hook wrapping IPC in React state"
```

---

## Task 10: Sidebar Component

**Files:**
- Create: `src/renderer/components/Sidebar.tsx`

- [ ] **Step 1: Create src/renderer/components/Sidebar.tsx**

```tsx
import { useState } from 'react'
import type { Category, TaskFilter } from '../shared/types'

const COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

interface Props {
  categories: Category[]; filter: TaskFilter
  pendingToday: number; pendingPriority: number; pendingAll: number
  onFilterChange: (f: TaskFilter) => void
  onCreateCategory: (name: string, color: string) => Promise<void>
  onDeleteCategory: (id: number) => Promise<void>
}

export default function Sidebar({ categories, filter, pendingToday, pendingPriority, pendingAll, onFilterChange, onCreateCategory, onDeleteCategory }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await onCreateCategory(newName.trim(), newColor)
    setNewName(''); setNewColor(COLORS[0]); setAdding(false)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? '#1a1a35' : 'transparent',
    color: active ? '#e2e2f0' : '#888', marginBottom: 2, textAlign: 'left'
  })

  return (
    <aside style={{ width: 200, background: '#111122', borderRight: '1px solid #1e1e35', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: 16, borderBottom: '1px solid #1e1e35' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#a78bfa' }}>✓ OrganizadorTarefas</span>
      </div>
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SMART LISTS</div>
        {([['today', '📅 Hoje', pendingToday], ['priority', '⬆ Prioritárias', pendingPriority], ['all', '○ Todas', pendingAll]] as [TaskFilter, string, number][]).map(([f, label, count]) => (
          <button key={String(f)} onClick={() => onFilterChange(f)} style={btnStyle(filter === f)}>
            <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
            {count > 0 && <span style={{ background: '#6c63ff', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{count}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 16px 4px', marginTop: 8, flex: 1 }}>
        <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CATEGORIAS</div>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => onFilterChange(cat.id)} style={btnStyle(filter === cat.id)}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12 }}>{cat.name}</span>
            <span onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id) }}
              style={{ color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</span>
          </button>
        ))}
        {adding ? (
          <div style={{ marginTop: 6 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#e2e2f0', fontSize: 12, marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleAdd} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ ...btnStyle(false), color: '#444', fontSize: 12, marginTop: 2 }}>+ Nova categoria</button>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/components/Sidebar.tsx
git commit -m "feat: Sidebar component with smart lists and category management"
```

---

## Task 11: TaskList + TaskItem Components

**Files:**
- Create: `src/renderer/components/TaskItem.tsx`
- Create: `src/renderer/components/TaskList.tsx`

- [ ] **Step 1: Create src/renderer/components/TaskItem.tsx**

```tsx
import type { Task } from '../shared/types'

const PRI: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const PRI_LABEL: Record<string, string> = { high: '⬆ Alta', medium: '— Média', low: '⬇ Baixa' }

interface Props {
  task: Task; selected: boolean
  onSelect: () => void; onToggleComplete: () => void
}

export default function TaskItem({ task, selected, onSelect, onToggleComplete }: Props) {
  const done = task.completed_at !== null
  const dueLabel = task.due_at
    ? new Date(task.due_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null
  const overdue = task.due_at && !done && task.due_at < Date.now()

  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: selected ? '#1e1e3a' : '#1a1a2e',
      borderRadius: 8, padding: '10px 12px', marginBottom: 6,
      borderLeft: `3px solid ${PRI[task.priority]}`,
      cursor: 'pointer', opacity: done ? 0.45 : 1
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggleComplete() }} style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        border: done ? 'none' : '2px solid #555', background: done ? '#22c55e' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white'
      }}>
        {done && '✓'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#e2e2f0', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </div>
        <div style={{ color: '#888', fontSize: 10, marginTop: 2, display: 'flex', gap: 6 }}>
          {dueLabel && <span style={{ color: overdue ? '#ef4444' : '#888' }}>{dueLabel}</span>}
          <span style={{ color: PRI[task.priority] }}>{PRI_LABEL[task.priority]}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/renderer/components/TaskList.tsx**

```tsx
import { useState } from 'react'
import type { Task, CreateTaskInput, Priority, UpdateTaskInput } from '../shared/types'
import TaskItem from './TaskItem'

interface Props {
  tasks: Task[]; selectedTaskId: number | null; filterLabel: string
  onSelectTask: (id: number | null) => void
  onCreateTask: (input: CreateTaskInput) => Promise<void>
  onUpdateTask: (id: number, input: UpdateTaskInput) => Promise<void>
}

export default function TaskList({ tasks, selectedTaskId, filterLabel, onSelectTask, onCreateTask, onUpdateTask }: Props) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    await onCreateTask({ title: newTitle.trim(), priority: newPriority })
    setNewTitle(''); setNewPriority('medium'); setAdding(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e35', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e2f0' }}>{filterLabel}</span>
        <button onClick={() => setAdding(true)} style={{ marginLeft: 'auto', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>
          + Nova tarefa
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {adding && (
          <div style={{ background: '#1e1e35', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título da tarefa" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false) }}
              style={{ width: '100%', background: '#111122', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#e2e2f0', fontSize: 12, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button key={p} onClick={() => setNewPriority(p)} style={{
                  flex: 1, border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11,
                  background: newPriority === p ? (p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e') : '#1a1a2e',
                  color: newPriority === p ? 'white' : '#888'
                }}>
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleCreate} style={{ flex: 1, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: 5, cursor: 'pointer', fontSize: 11 }}>Criar</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 4, padding: 5, cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
            </div>
          </div>
        )}
        {tasks.length === 0 && !adding && (
          <div style={{ textAlign: 'center', color: '#555', fontSize: 12, marginTop: 40 }}>Nenhuma tarefa aqui.</div>
        )}
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} selected={selectedTaskId === task.id}
            onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
            onToggleComplete={() => onUpdateTask(task.id, { completed_at: task.completed_at === null ? Date.now() : null })} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/TaskItem.tsx src/renderer/components/TaskList.tsx
git commit -m "feat: TaskItem and TaskList components"
```

---

## Task 12: TaskDetail Component

**Files:**
- Create: `src/renderer/components/TaskDetail.tsx`

- [ ] **Step 1: Create src/renderer/components/TaskDetail.tsx**

```tsx
import { useState, useEffect } from 'react'
import type { Task, Subtask, Priority, UpdateTaskInput, Category } from '../shared/types'

const PRI_COLOR: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

interface Props {
  task: Task; subtasks: Subtask[]; categories: Category[]
  onUpdate: (id: number, input: UpdateTaskInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
  onCreateSubtask: (taskId: number, title: string) => Promise<void>
  onUpdateSubtask: (id: number, completed: boolean) => Promise<void>
  onDeleteSubtask: (id: number) => Promise<void>
}

export default function TaskDetail({ task, subtasks, categories, onUpdate, onDelete, onClose, onCreateSubtask, onUpdateSubtask, onDeleteSubtask }: Props) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [newSub, setNewSub] = useState('')

  useEffect(() => { setTitle(task.title); setNotes(task.notes ?? '') }, [task.id])

  const handleTitleBlur = () => { if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() }) }
  const handleNotesBlur = () => { if (notes !== (task.notes ?? '')) onUpdate(task.id, { notes: notes || null }) }
  const handleAddSub = async () => { if (!newSub.trim()) return; await onCreateSubtask(task.id, newSub.trim()); setNewSub('') }
  const dueDateValue = task.due_at
    ? new Date(task.due_at - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

  const label9: React.CSSProperties = { fontSize: 9, color: '#555', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }
  const inputStyle: React.CSSProperties = { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', color: '#e2e2f0', fontSize: 12 }

  return (
    <div style={{ width: 260, background: '#111122', borderLeft: '1px solid #1e1e35', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e35', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: '#e2e2f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={label9}>TÍTULO</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} style={inputStyle} />
        </div>
        <div>
          <div style={label9}>PRIORIDADE</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button key={p} onClick={() => onUpdate(task.id, { priority: p })} style={{
                flex: 1, border: task.priority === p ? `1px solid ${PRI_COLOR[p]}` : '1px solid transparent',
                borderRadius: 4, padding: 4, cursor: 'pointer', fontSize: 11,
                background: task.priority === p ? PRI_COLOR[p] + '33' : '#1a1a2e',
                color: task.priority === p ? PRI_COLOR[p] : '#888'
              }}>
                {p === 'high' ? '⬆ Alta' : p === 'medium' ? '— Média' : '⬇ Baixa'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={label9}>VENCIMENTO</div>
          <input type="datetime-local" value={dueDateValue}
            onChange={(e) => onUpdate(task.id, { due_at: e.target.value ? new Date(e.target.value).getTime() : null })}
            style={{ ...inputStyle, fontSize: 11 }} />
        </div>
        <div>
          <div style={label9}>CATEGORIA</div>
          <select value={task.category_id ?? ''} onChange={(e) => onUpdate(task.id, { category_id: e.target.value ? Number(e.target.value) : null })}
            style={inputStyle}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div style={label9}>NOTAS</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} rows={3}
            placeholder="Adicionar notas..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div>
          <div style={label9}>SUBTAREFAS</div>
          {subtasks.map((sub) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <button onClick={() => onUpdateSubtask(sub.id, sub.completed_at === null)} style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
                background: sub.completed_at ? '#22c55e' : 'transparent',
                border: sub.completed_at ? 'none' : '1px solid #555',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white'
              }}>
                {sub.completed_at ? '✓' : ''}
              </button>
              <span style={{ flex: 1, fontSize: 11, color: '#ccc', textDecoration: sub.completed_at ? 'line-through' : 'none' }}>{sub.title}</span>
              <button onClick={() => onDeleteSubtask(sub.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova subtarefa"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSub() }}
              style={{ flex: 1, background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', color: '#e2e2f0', fontSize: 11 }} />
            <button onClick={handleAddSub} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>+</button>
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} style={{ marginTop: 'auto', background: 'none', border: '1px solid #333', borderRadius: 6, padding: 6, color: '#888', cursor: 'pointer', fontSize: 11 }}>
          Excluir tarefa
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/components/TaskDetail.tsx
git commit -m "feat: TaskDetail component with inline editing and subtask management"
```

---

## Task 13: App.tsx + Global CSS + Entry Points

**Files:**
- Create: `src/renderer/global.css`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/main.tsx`

- [ ] **Step 1: Create src/renderer/global.css**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0d0d1a; color: #e2e2f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
button { font-family: inherit; }
input, textarea, select { font-family: inherit; outline: none; }
input:focus, textarea:focus, select:focus { border-color: #6c63ff !important; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
```

- [ ] **Step 2: Create src/renderer/App.tsx**

```tsx
import { useMemo } from 'react'
import { useTasksApi } from './hooks/useTasksApi'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'
import TaskDetail from './components/TaskDetail'
import type { TaskFilter } from './shared/types'

const FILTER_LABELS: Record<string, string> = { today: 'Hoje', priority: 'Prioritárias', all: 'Todas as tarefas' }

export default function App() {
  const api = useTasksApi()

  const filterLabel = typeof api.filter === 'number'
    ? api.categories.find((c) => c.id === api.filter)?.name ?? 'Categoria'
    : FILTER_LABELS[api.filter as string]

  const pendingToday = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0)
    const e = new Date(); e.setHours(23, 59, 59, 999)
    return api.tasks.filter((t) => t.completed_at === null && t.due_at !== null && t.due_at >= s.getTime() && t.due_at <= e.getTime()).length
  }, [api.tasks])

  const pendingPriority = useMemo(
    () => api.tasks.filter((t) => t.completed_at === null && t.priority === 'high').length,
    [api.tasks]
  )
  const pendingAll = useMemo(() => api.tasks.filter((t) => t.completed_at === null).length, [api.tasks])
  const selectedTask = api.tasks.find((t) => t.id === api.selectedTaskId) ?? null

  if (api.loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>Carregando...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d0d1a' }}>
      <Sidebar categories={api.categories} filter={api.filter}
        pendingToday={pendingToday} pendingPriority={pendingPriority} pendingAll={pendingAll}
        onFilterChange={(f: TaskFilter) => { api.setFilter(f); api.setSelectedTaskId(null) }}
        onCreateCategory={api.createCategory} onDeleteCategory={api.deleteCategory} />
      <TaskList tasks={api.tasks} selectedTaskId={api.selectedTaskId} filterLabel={filterLabel}
        onSelectTask={api.setSelectedTaskId} onCreateTask={api.createTask} onUpdateTask={api.updateTask} />
      {selectedTask && (
        <TaskDetail task={selectedTask} subtasks={api.subtasks} categories={api.categories}
          onUpdate={api.updateTask} onDelete={api.deleteTask} onClose={() => api.setSelectedTaskId(null)}
          onCreateSubtask={api.createSubtask} onUpdateSubtask={api.updateSubtask} onDeleteSubtask={api.deleteSubtask} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create src/renderer/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/global.css src/renderer/App.tsx src/renderer/main.tsx
git commit -m "feat: App assembly, global CSS theme, and main entry point"
```

---

## Task 14: Scheduler + Notifications (TDD)

**Files:**
- Create: `src/main/scheduler.ts`
- Create: `src/main/__tests__/scheduler.test.ts`

- [ ] **Step 1: Write failing tests for scheduler logic**

Create `src/main/__tests__/scheduler.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldNotify } from '../scheduler'

describe('shouldNotify', () => {
  it('returns true when due within 15 min and not completed', () => {
    const now = Date.now()
    expect(shouldNotify({ dueAt: now + 10 * 60 * 1000, completedAt: null, alreadyNotified: false, now })).toBe(true)
  })
  it('returns false when due more than 15 min away', () => {
    const now = Date.now()
    expect(shouldNotify({ dueAt: now + 20 * 60 * 1000, completedAt: null, alreadyNotified: false, now })).toBe(false)
  })
  it('returns false when task is completed', () => {
    const now = Date.now()
    expect(shouldNotify({ dueAt: now + 5 * 60 * 1000, completedAt: now - 1000, alreadyNotified: false, now })).toBe(false)
  })
  it('returns false when already notified', () => {
    const now = Date.now()
    expect(shouldNotify({ dueAt: now + 5 * 60 * 1000, completedAt: null, alreadyNotified: true, now })).toBe(false)
  })
  it('returns false when task is past due', () => {
    const now = Date.now()
    expect(shouldNotify({ dueAt: now - 1000, completedAt: null, alreadyNotified: false, now })).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL (`Cannot find module '../scheduler'`)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 3: Create src/main/scheduler.ts**

```ts
import schedule from 'node-schedule'
import type { BrowserWindow } from 'electron'
import { getTasks } from './db'

const WINDOW_MS = 15 * 60 * 1000
const notifiedIds = new Set<number>()

export interface ShouldNotifyInput {
  dueAt: number; completedAt: number | null; alreadyNotified: boolean; now: number
}

export function shouldNotify({ dueAt, completedAt, alreadyNotified, now }: ShouldNotifyInput): boolean {
  if (completedAt !== null || alreadyNotified) return false
  const timeUntilDue = dueAt - now
  return timeUntilDue > 0 && timeUntilDue <= WINDOW_MS
}

export function startScheduler(mainWindow: BrowserWindow, _fabWindow: BrowserWindow): () => void {
  const job = schedule.scheduleJob('* * * * *', () => checkTasks(mainWindow))
  return () => { job.cancel() }
}

function checkTasks(mainWindow: BrowserWindow): void {
  const { Notification } = require('electron')
  const now = Date.now()
  for (const task of getTasks('all')) {
    if (!task.due_at) continue
    if (!shouldNotify({ dueAt: task.due_at, completedAt: task.completed_at, alreadyNotified: notifiedIds.has(task.id), now })) continue
    notifiedIds.add(task.id)
    const notif = new Notification({ title: 'Tarefa próxima do vencimento', body: task.title })
    notif.on('click', () => { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('task-focus', task.id) })
    notif.show()
  }
}
```

- [ ] **Step 4: Run — expect PASS (all + 5 new tests)**

Run: `npm test -- --reporter=verbose`

- [ ] **Step 5: Commit**

```bash
git add src/main/scheduler.ts src/main/__tests__/scheduler.test.ts
git commit -m "feat: scheduler with testable notification logic"
```

---

## Task 15: Run Dev Server + Smoke Test

- [ ] **Step 1: Start the app**

Run: `npm run dev`
Expected: Electron launches with FAB roxo no canto inferior direito. Sem erros no console.

- [ ] **Step 2: Verify FabWindow**

- FAB aparece sobre todas as outras janelas
- Badge vermelho ausente (0 tarefas)
- FAB pode ser arrastado para qualquer posicao na tela

- [ ] **Step 3: Open MainWindow**

- Clicar no FAB abre a MainWindow proxima ao botao
- MainWindow mostra sidebar (Hoje, Prioritárias, Todas) + lista vazia + sem painel de detalhes
- Clicar no FAB novamente fecha a MainWindow

- [ ] **Step 4: Create a task**

- Clicar "+ Nova tarefa" → digitar titulo → selecionar prioridade Alta → Enter
- Tarefa aparece na lista com barra vermelha
- Badge vermelho aparece no FAB com contagem 1

- [ ] **Step 5: Open task detail**

- Clicar na tarefa abre o painel de detalhes (coluna direita)
- Editar titulo → clicar fora → titulo atualizado
- Adicionar nota → clicar fora → nota salva
- Definir data de vencimento → campo atualizado
- Adicionar subtarefa → subtarefa aparece → marcar como concluida

- [ ] **Step 6: Complete a task**

- Clicar no checkbox de uma tarefa → tarefa fica com opacidade reduzida e texto riscado
- Badge do FAB decrementa (vai para 0 se era a unica tarefa)
- FAB fica verde quando todas as tarefas estao concluidas

- [ ] **Step 7: Create a category and filter**

- Na sidebar: clicar "+ Nova categoria" → inserir nome → escolher cor → Criar
- Categoria aparece na sidebar
- Clicar na categoria → lista filtrada (vazia se nenhuma tarefa tem essa categoria)
- Criar tarefa com a categoria selecionada → aparece no filtro correto

- [ ] **Step 8: Verify FAB position persistence**

- Arrastar o FAB para um canto diferente
- Fechar o app (Ctrl+C no terminal, ou fechar o Electron)
- Rodar `npm run dev` novamente
- FAB deve aparecer na ultima posicao salva

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "feat: complete OrganizadorTarefas v1 — all features working"
```
