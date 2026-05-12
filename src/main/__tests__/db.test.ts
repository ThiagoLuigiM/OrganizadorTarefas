import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { initDb, closeDb, getDb, getCategories, createCategory, deleteCategory } from '../db'

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

