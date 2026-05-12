---
title: OrganizadorTarefas — Design Spec
date: 2026-05-12
status: approved
---

# OrganizadorTarefas — Design Spec

## Visão Geral

Aplicativo desktop Windows para gerenciamento de tarefas pessoais. Fica acessível em qualquer momento via um botão flutuante (FAB) que permanece visível na tela mesmo quando o app principal está fechado.

## Stack Tecnológica

- **Runtime:** Electron (versão mais recente estável)
- **Bundler:** Electron Vite
- **Frontend:** React + TypeScript
- **Banco de dados:** SQLite via `better-sqlite3` (acesso exclusivo pelo Main process)
- **Persistência de UI:** `electron-store` (posição do FAB, preferências)
- **Agendamento:** `node-schedule` (verificação de prazos)

## Arquitetura

### Duas BrowserWindows

#### MainWindow
- Janela principal do app (900×600px, redimensionável)
- Exibe a interface completa: sidebar, lista de tarefas, painel de detalhes
- Pode ser fechada/reaberta sem encerrar o processo
- Abre posicionada próxima ao FAB (acima ou abaixo, conforme espaço disponível)

#### FabWindow
- Janela pequena (~72×72px), transparente, sem borda
- `alwaysOnTop: true` — visível sobre qualquer outra janela
- Arrastável pelo usuário; posição salva em `electron-store`
- Posição inicial: canto inferior direito da tela
- Exibe o botão FAB com contador de tarefas pendentes

### Comunicação IPC

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `open-main` | FabWindow → Main process | Usuário clicou no FAB |
| `tasks-updated` | Main process → FabWindow | Atualiza contador após mudança de tarefas |
| `task-focus` | Main process → MainWindow | Destaca tarefa ao clicar em notificação |
| `get-tasks` | Renderer → Main process | Leitura de tarefas do banco |
| `create-task` | Renderer → Main process | Criação de nova tarefa |
| `update-task` | Renderer → Main process | Edição de tarefa existente |
| `delete-task` | Renderer → Main process | Remoção de tarefa |

Toda leitura e escrita no banco de dados ocorre exclusivamente no Main process. Os renderers nunca acessam o SQLite diretamente.

### Inicialização

- App inicia mostrando apenas o FabWindow
- MainWindow é criada mas permanece oculta até o primeiro clique no FAB
- Opção de iniciar com o Windows via `app.setLoginItemSettings()` (configurável nas preferências)

## Modelo de Dados (SQLite)

### Tabela `categories`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | autoincrement |
| `name` | TEXT NOT NULL | ex: "Trabalho", "Pessoal" |
| `color` | TEXT NOT NULL | hex, ex: "#6c63ff" |
| `created_at` | INTEGER NOT NULL | unix timestamp |

### Tabela `tasks`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | autoincrement |
| `category_id` | INTEGER FK | nullable (sem categoria) |
| `title` | TEXT NOT NULL | |
| `notes` | TEXT | nullable |
| `priority` | TEXT NOT NULL | `'low'` \| `'medium'` \| `'high'` |
| `due_at` | INTEGER | nullable, unix timestamp |
| `completed_at` | INTEGER | nullable — null = pendente |
| `created_at` | INTEGER NOT NULL | unix timestamp |
| `position` | INTEGER NOT NULL | ordenação manual |

### Tabela `subtasks`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | autoincrement |
| `task_id` | INTEGER FK NOT NULL | |
| `title` | TEXT NOT NULL | |
| `completed_at` | INTEGER | nullable |
| `position` | INTEGER NOT NULL | |

**Contador do FAB:** `SELECT COUNT(*) FROM tasks WHERE completed_at IS NULL`

## UI/UX

### MainWindow — Layout (3 colunas)

**Coluna 1 — Sidebar (200px fixo):**
- Nome do app no topo
- Smart lists: "Hoje", "Prioritárias", "Todas" (com contadores)
- Seção de categorias com cor, nome e contagem
- Botão "+ Nova categoria"
- Rodapé com resumo (X pendentes, Y concluídas)

**Coluna 2 — Lista de tarefas (flex):**
- Header com nome da lista selecionada e botão "+ Nova tarefa"
- Cada item: checkbox, título, metadados (prazo, prioridade, categoria, progresso de subtarefas)
- Barra colorida na esquerda indica prioridade: vermelho (alta), amarelo (média), verde (baixa)
- Tarefas concluídas exibidas com opacidade reduzida e texto riscado

**Coluna 3 — Painel de detalhes (260px fixo):**
- Abre ao clicar em uma tarefa
- Campos editáveis: título, prioridade, vencimento, categoria, notas
- Lista de subtarefas com checkboxes individuais e botão para adicionar

### FabWindow — Estados

| Estado | Visual |
|--------|--------|
| Normal | Botão roxo (#6c63ff) com ícone ✓, badge vermelho com contagem |
| Hover | Botão ligeiramente maior e mais brilhante |
| Todas concluídas | Botão verde (#22c55e), sem badge |

### Comportamento do FAB
- Clique: abre/fecha a MainWindow posicionada próxima ao FAB
- Arrasto: reposiciona o FAB; nova posição salva automaticamente
- Badge desaparece quando não há tarefas pendentes

## Notificações

- `node-schedule` executa verificação a cada minuto no Main process
- Notificação nativa do Electron é disparada 15 minutos antes do vencimento de uma tarefa
- Cada tarefa recebe notificação no máximo uma vez (flag `notified_at` não persiste em banco — controlada em memória durante a sessão)
- Clique na notificação: abre MainWindow e destaca a tarefa via evento IPC `task-focus`

## Testes

- **Vitest** para lógica de negócio no Main process: CRUD de tarefas, cálculo do contador do FAB, lógica de agendamento de notificações
- Sem testes de UI automatizados nesta fase

## Estrutura de Diretórios (prevista)

```
OrganizadorTarefas/
├── src/
│   ├── main/              # Main process (Electron)
│   │   ├── index.ts       # Entry point, criação de janelas
│   │   ├── db.ts          # SQLite, migrations, queries
│   │   ├── ipc.ts         # Handlers IPC
│   │   └── scheduler.ts   # node-schedule, notificações
│   ├── renderer/          # React app (MainWindow)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Sidebar/
│   │   │   ├── TaskList/
│   │   │   └── TaskDetail/
│   │   └── hooks/         # useTasksapi IPC
│   └── fab/               # React app (FabWindow)
│       └── Fab.tsx
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-12-organizador-tarefas-design.md
├── package.json
└── electron.vite.config.ts
```
