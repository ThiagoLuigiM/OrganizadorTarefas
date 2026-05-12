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
