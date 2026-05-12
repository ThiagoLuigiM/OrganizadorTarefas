import { useMemo } from 'react'
import { useTasksApi } from './hooks/useTasksApi'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'
import TaskDetail from './components/TaskDetail'
import TitleBar from './components/TitleBar'
import type { TaskFilter } from './shared/types'

const FILTER_LABELS: Record<string, string> = { today: 'Hoje', priority: 'Prioritarias', all: 'Todas as tarefas' }

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d1a' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar categories={api.categories} filter={api.filter}
          pendingToday={pendingToday} pendingPriority={pendingPriority} pendingAll={pendingAll}
          onFilterChange={(f: TaskFilter) => { api.setFilter(f); api.setSelectedTaskId(null) }}
          onCreateCategory={(name, color) => api.createCategory({ name, color })} onDeleteCategory={api.deleteCategory} />
        <TaskList tasks={api.tasks} selectedTaskId={api.selectedTaskId} filterLabel={filterLabel}
          onSelectTask={api.setSelectedTaskId} onCreateTask={api.createTask} onUpdateTask={api.updateTask} />
        {selectedTask && (
          <TaskDetail task={selectedTask} subtasks={api.subtasks} categories={api.categories}
            onUpdate={api.updateTask} onDelete={api.deleteTask} onClose={() => api.setSelectedTaskId(null)}
            onCreateSubtask={api.createSubtask} onUpdateSubtask={api.updateSubtask} onDeleteSubtask={api.deleteSubtask} />
        )}
      </div>
    </div>
  )
}