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