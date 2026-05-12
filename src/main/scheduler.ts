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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Notification } = require('electron')
  const now = Date.now()
  for (const task of getTasks('all')) {
    if (!task.due_at) continue
    if (!shouldNotify({ dueAt: task.due_at, completedAt: task.completed_at, alreadyNotified: notifiedIds.has(task.id), now })) continue
    notifiedIds.add(task.id)
    const notif = new Notification({ title: 'Tarefa proxima do vencimento', body: task.title })
    notif.on('click', () => { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('task-focus', task.id) })
    notif.show()
  }
}
