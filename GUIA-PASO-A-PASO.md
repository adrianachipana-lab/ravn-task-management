# Task Management App - Step-by-Step Guide

This guide explains how the application is organized, which React concepts it uses, and the reasoning behind the main implementation decisions.

---

## Project Structure

```text
src/
├── components/         # Reusable UI components
│   ├── Sidebar/        # Side navigation
│   ├── Header/         # Top bar with search, notifications, and avatar
│   ├── TaskCard/       # Individual task card for the board view
│   ├── TaskColumn/     # Kanban column by status
│   ├── TaskForm/       # Create/edit task form
│   ├── Modal/          # Reusable modal shell
│   ├── ConfirmDialog/  # Delete confirmation dialog
│   ├── SearchFilter/   # Search and advanced filters
│   ├── BottomNav/      # Mobile bottom navigation
│   ├── MobileTabs/     # Mobile tabs between Dashboard and My Tasks
│   ├── ViewToggle/     # Board/list view toggle
│   ├── LoadingSpinner/ # Loading indicator
│   └── Toast/          # Temporary notifications
├── pages/              # Route-level pages
│   ├── Dashboard/      # Main Kanban board
│   ├── MyTasks/        # List/table task view
│   ├── Settings/       # User profile page
│   └── NotFound/       # 404 fallback page
├── hooks/              # Reusable state and API logic
│   ├── useTasks.ts     # Task CRUD through GraphQL/Apollo
│   ├── useCreateTask.ts# Bridge for opening create task from mobile nav
│   └── useNotifications.ts # Notification context access
├── graphql/            # Apollo client, queries, and mutations
├── constants/          # Shared UI options and navigation definitions
├── context/            # Filter state and create-task bridge
├── types/              # TypeScript domain types
│   └── task.ts         # Task, User, enums, inputs
├── styles/             # Global styles
│   ├── variables.css   # Design tokens
│   └── global.css      # Reset, layout, and component styles
├── utils/              # Pure helpers
│   ├── date.ts         # Date formatting and color coding
│   ├── tags.ts         # Tag labels and CSS class helpers
│   └── avatar.ts       # Avatar validation and neutral fallback
├── App.tsx             # Root component and routing
└── main.tsx            # Application entry point
```

Why this structure:

- `components/` contains reusable UI building blocks.
- `pages/` contains route-level views that coordinate data and page state.
- `hooks/` keeps business logic and API operations outside UI components.
- `graphql/` centralizes queries and mutations.
- `constants/` stores local UI option catalogs for API enum values and shared navigation definitions.
- `context/` shares small pieces of cross-component state, such as filters.
- `types/` keeps the domain model consistent across the app.
- `utils/` contains pure helpers that can be tested independently.

---

## React Concepts Used

### 1. JSX and Components

```tsx
export function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <h3 className="task-card__title">{task.name}</h3>
    </article>
  );
}
```

JSX looks like HTML, but it is JavaScript syntax compiled into React calls. Each component is a function that returns UI.

### 2. Props

```tsx
interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}
```

Data flows down through props. Events flow back up through callback props.

### 3. Local State with `useState`

```tsx
const [menuOpen, setMenuOpen] = useState(false);
```

Local state is used for UI interactions such as open menus, active modals, form fields, collapsed sections, drag-over states, and optimistic task moves.

### 4. Side Effects with `useEffect`

```tsx
useEffect(() => {
  if (!menuOpen) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [menuOpen]);
```

Effects are used for browser interactions such as outside-click detection, Escape key handling, scroll locking, toast timers, and keeping optimistic drag-and-drop state until the backend confirms the same task order.

### 5. DOM References with `useRef`

```tsx
const menuRef = useRef<HTMLDivElement>(null);
```

Refs are used when the app needs direct access to DOM nodes, for example detecting whether a click happened outside a menu or modal.

### 6. Custom Hooks

```tsx
export function useTasks() {
  const { filters } = useFilters();
  const { data, loading, error, refetch } = useQuery(GET_TASKS);

  return {
    tasks: data?.tasks ?? [],
    loading,
    error,
    refetch,
  };
}
```

Custom hooks keep reusable logic outside components. `useTasks` owns GraphQL CRUD operations, `useNotifications` exposes toast and notification-center state, and `useCreateTask` connects mobile navigation with the dashboard create modal.

### 7. List Rendering and Keys

```tsx
{columnTasks.map((task, index) => (
  <TaskCard
    key={task.id}
    task={task}
    index={index}
    onEdit={onEdit}
    onDelete={onDelete}
  />
))}
```

Keys let React track which item changed, moved, or was removed. Task IDs are used as stable keys.

### 8. Conditional Rendering

```tsx
{columnTasks.length === 0 ? (
  <div className="task-column__empty">
    <p>No tasks</p>
  </div>
) : (
  columnTasks.map(...)
)}
```

Conditional rendering is used for empty states, loading states, modals, dropdowns, menus, and error states.

### 9. React Router

```tsx
<BrowserRouter>
  <Routes>
    <Route path={ROUTES.dashboard} element={<Dashboard />} />
    <Route path={ROUTES.myTasks} element={<MyTasks />} />
    <Route path={ROUTES.settings} element={<Settings />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

The app is a client-side SPA. `NavLink` is used for navigation items because it exposes the active route state for styling.

### 10. Controlled Forms

```tsx
const [name, setName] = useState('');

<input
  value={name}
  onChange={(event) => setName(event.target.value)}
/>
```

Task creation and editing use controlled form fields so React owns the current form value and can validate or submit predictable data.

### 11. Composition with `children`

```tsx
<Modal isOpen={showCreateForm} onClose={closeModal}>
  <TaskForm onSubmit={handleCreate} onCancel={closeModal} />
</Modal>
```

The modal component does not know what content it renders. It receives children, which keeps it reusable for create, edit, and confirmation flows.

---

## TypeScript in React

### Props with Interfaces

```tsx
interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}
```

Interfaces document component contracts and catch incorrect usage during development.

### Const Objects as Enums

```tsx
export const TaskStatus = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
```

The project uses const objects instead of TypeScript enums because they compile to plain JavaScript patterns and work well with strict TypeScript settings.

### `import type`

```tsx
import type { Task, UpdateTaskInput } from '../types/task';
```

Type-only imports make runtime imports cleaner and avoid shipping unnecessary values.

---

## Styling: Global CSS + BEM + Design Tokens

The project uses global CSS with BEM naming and CSS variables.

```tsx
<article className="task-card task-card--dragging">
  <h3 className="task-card__title">{task.name}</h3>
</article>
```

BEM conventions used:

- Block: `task-card`, `sidebar`, `modal`, `task-table`
- Element: `task-card__title`, `sidebar__nav-item`, `modal__overlay`
- Modifier: `task-card--dragging`, `sidebar__nav-item--active`

Design tokens live in `variables.css`:

```css
:root {
  --color-primary: #da584b;
  --color-bg-main: #222528;
  --spacing-md: 16px;
  --radius-md: 8px;
}
```

This keeps colors, spacing, radius, and animation durations consistent across the app.

---

## GraphQL and Apollo Client

The app talks to the challenge API through Apollo Client.

```tsx
const { data, loading, error, refetch } = useQuery(GET_TASKS, {
  variables: { input: apiInput },
  fetchPolicy: 'cache-and-network',
});
```

Why Apollo:

- Built-in loading and error states
- Query and mutation hooks
- Cache management
- Easy refetch after mutations
- Clear integration with TypeScript types

The API token is read from environment variables:

```env
VITE_API_URL=https://syn-api-production-e95c.up.railway.app/graphql
VITE_API_TOKEN=your-token-here
```

Status, tag, and point options are defined locally in `src/constants/taskOptions.ts`. They are not fetched from the API because the challenge API accepts those enum values but does not expose a metadata query for option lists. Navigation routes and labels are centralized in `src/constants/navigation.ts` so sidebar, mobile tabs, bottom nav, and route definitions stay aligned.

---

## Dashboard Flow

1. `Dashboard` calls `useTasks()` to load tasks.
2. Tasks are grouped by status through `TaskColumn`.
3. Each `TaskColumn` renders matching `TaskCard` components.
4. The red plus button opens `TaskForm` inside `Modal`.
5. Create, update, delete, and drag-and-drop actions call GraphQL mutations through `useTasks`.
6. Toasts display success or error feedback.

The board uses five statuses:

- Backlog
- To Do
- In Progress
- Done
- Cancelled

---

## Task Card

Each task card shows:

- Task name
- Tags
- Due date
- Estimated points
- Assignee avatar
- Three-dot options menu

The date color is calculated with helper functions:

- Green: on time
- Yellow: less than two days left
- Red: overdue

Invalid or missing user avatars are replaced with a local neutral SVG fallback.

---

## Create and Edit Task Flow

The same `TaskForm` component is used for both create and edit.

For create:

```tsx
<TaskForm onSubmit={handleCreate} onCancel={closeCreateForm} />
```

For edit:

```tsx
<TaskForm
  initialData={editingTask}
  onSubmit={handleUpdate}
  onCancel={closeEditForm}
/>
```

Fields handled by the form:

- Name
- Tags
- Due date
- Estimated points
- Assignee

Status and position are preserved by the edit form. Those values are changed from the board drag-and-drop flow instead.

The mobile date picker uses `@ncdai/react-wheel-picker` to match the iOS-style picker shown in the Figma design.

---

## Search and Filters

The app supports:

- Name
- Due date
- Assignee
- Status
- Tags
- Estimated points

Most filters are sent to the API. Due date is filtered client-side by comparing the date portion because the API expects exact timestamps.

When filters return no results, the UI shows an empty state and a clear-filters action.

---

## Drag and Drop

Drag-and-drop supports:

- Moving a task to another column
- Reordering tasks inside the same column
- Updating the task status
- Updating integer task positions
- Showing a red insertion indicator before or after the hovered card
- Optimistically updating the UI before the backend response finishes

The implementation avoids fractional positions. When a card is moved, the affected tasks are renumbered with integer positions:

```text
1, 2, 3, 4...
```

This keeps the mutation payload aligned with the backend expectations and avoids invalid database values.

---

## My Tasks View

`MyTasks` provides a list/table layout grouped by status.

Features:

- Collapsible sections
- Task count per section
- First visible tag plus a `+N` button for extra tags
- Assignee avatar and name
- Due date color accents
- Row click opens the edit modal

---

## Settings Page

The header avatar opens a compact profile popover with the logged-in user's name, email, type, creation date, and avatar.

The settings route also uses the `profile` query and displays:

- Full name
- Email
- Type
- Position
- Created at
- Updated at
- Avatar

There was no provided design for this screen, so it follows the same spacing, colors, and card style used in the rest of the app.

---

## Error Handling

The app handles errors at several levels:

- Query errors show an error state.
- Mutation errors show toast notifications.
- Delete actions require confirmation.
- `ErrorBoundary` catches unexpected runtime errors.
- Invalid avatars fall back to a local default image.

---

## Performance and Quality

Quality checks used:

```bash
npm run typecheck
npm run lint
npm run test
npx react-doctor@latest --verbose
```

Current React Doctor result:

```text
Score: 100 / 100
No issues found
```

Performance-related decisions:

- Lazy-loaded route pages
- Memoized filter-derived values
- Optimistic drag-and-drop updates
- Batched task position mutations followed by a single refetch
- Pure helpers outside render-heavy components where appropriate

---

## Deployment

The app is deployed on Vercel.

Production URL:

```text
https://ravn-task-management.vercel.app
```

For SPA routing, `vercel.json` rewrites all routes back to `index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Requirement Checklist

### Initial Setup

- [x] Folder structure
- [x] Routing configuration
- [x] Styles solution
- [x] TypeScript setup
- [x] Linter
- [x] Error boundary

### Dashboard UI

- [x] Sidebar logo
- [x] Sidebar navigation items
- [x] Active navigation state
- [x] Header avatar
- [x] Notification icon
- [x] Notification center with specific recent task actions
- [x] Search icon
- [x] Board/list view icons
- [x] Red plus button
- [x] Status columns
- [x] Task cards with name, tags, due date, points, avatar, and options menu

### API Integration

- [x] Tasks query
- [x] Loading state
- [x] Error state
- [x] Empty state
- [x] Create task mutation
- [x] Create error handling

### Update and Delete

- [x] Update task mutation
- [x] Edit modal
- [x] Editable name, due date, tags, estimated points, and assignee
- [x] Status and position updates through drag-and-drop
- [x] Confirm and cancel buttons
- [x] Delete task mutation
- [x] Delete confirmation
- [x] Success and error notifications

### Search and Filters

- [x] Name filter
- [x] Due date filter
- [x] Assignee filter
- [x] Status filter
- [x] Tags filter
- [x] Estimated points filter
- [x] Empty results UI

### Profile

- [x] Settings route
- [x] Profile query
- [x] Full name
- [x] Email
- [x] Type
- [x] Position
- [x] Created at
- [x] Updated at

### Bonus and UX Improvements

- [x] Drag and drop between columns
- [x] Same-column task reordering
- [x] Task count per column
- [x] List view
- [x] Date color coding
- [x] Card animations
- [x] Visual drop indicators
- [x] Optimistic task moves
- [x] Responsive mobile layout
- [x] Neutral avatar fallback
- [x] Header profile popover
- [x] Specific action notifications with task names, changed update fields, and move/reorder context
- [x] React Doctor 100/100
