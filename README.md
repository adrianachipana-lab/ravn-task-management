# Task Management App

A Kanban-style task management application built for the RAVN frontend challenge. Users can browse, create, edit, delete, and filter tasks across multiple status columns, with drag-and-drop support and a responsive mobile layout.

## Live Demo

https://ravn-task-management.vercel.app

## Screenshots

### Dashboard (Board View)
<!-- Add screenshot or GIF here -->

The main view displays tasks organized in five Kanban columns: Backlog, To Do, In Progress, Done, and Cancelled. Each card shows the task name, tags, due date, estimated points, and assignee avatar.

### My Tasks (List View)
<!-- Add screenshot or GIF here -->

An alternative table layout groups tasks by status in collapsible sections. Clicking a row opens the edit form.

### Create / Edit Task
<!-- Add screenshot or GIF here -->

A modal with chip-style selectors for estimate, assignee, tags, and due date. On mobile, the date picker uses an iOS-style 3D scroll wheel.

### Profile Modal
<!-- Add screenshot or GIF here -->

Clicking the header avatar opens a compact profile modal/popover with the logged-in user's avatar, name, email, type, and account dates. The data comes from the API `profile` query.

### Notifications
<!-- Add screenshot or GIF here -->

The header bell opens a notification center with recent task actions. Create, update, delete, move, and reorder notifications include task-specific details, such as the task name and changed fields.

### Settings
<!-- Add screenshot or GIF here -->

Displays the logged-in user's profile information fetched from the API.

## Setup & Running

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/adrianachipana-lab/ravn-task-management.git
cd ravn-task-management

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API token
```

### Running

```bash
# Development server
npm run dev

# Production build
npm run build

# Run tests
npm run test:run

# Type checking
npm run typecheck

# Lint
npm run lint
```

## Tech Stack & Rationale

| Technology | Why |
|---|---|
| **React 19** | Latest stable version with improved performance |
| **TypeScript** | Type safety catches bugs at compile time, better IDE support |
| **Vite 8** | Fastest build tool available, instant HMR |
| **Apollo Client** | Industry-standard GraphQL client with built-in caching and hooks |
| **React Router 7** | Client-side routing with lazy-loaded pages for code splitting |
| **Lucide React** | Lightweight, tree-shakeable icon library |
| **@ncdai/react-wheel-picker** | iOS-style 3D wheel date picker for mobile |
| **Oxlint** | Fast Rust-based linter |
| **Prettier** | Consistent code formatting |
| **Vitest** | Fast unit testing integrated with Vite |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BottomNav/       # Mobile bottom navigation
│   ├── ConfirmDialog/   # Delete confirmation modal
│   ├── DatePicker/      # iOS-style 3D wheel date picker
│   ├── ErrorBoundary/   # Runtime error catch boundary
│   ├── Header/          # Top bar with search, profile popover, and notification center
│   ├── LoadingSpinner/  # Loading indicator
│   ├── MobileTabs/      # Mobile tab navigation
│   ├── Modal/           # Reusable modal overlay
│   ├── SearchFilter/    # Collapsible filter panel
│   ├── Sidebar/         # Desktop sidebar navigation
│   ├── TaskCard/        # Individual task card (board view)
│   ├── TaskColumn/      # Kanban column with drag-and-drop
│   ├── TaskForm/        # Create/edit task form with chip selectors
│   ├── Toast/           # Toast UI for global notifications
│   └── ViewToggle/      # Board/list view toggle
├── constants/           # Shared UI options and navigation definitions
├── context/             # React contexts (filters, create-task bridge, notifications)
├── graphql/             # Apollo client, queries, and mutations
├── hooks/               # Custom hooks (useTasks, useNotifications, useCreateTask)
├── pages/               # Route pages (Dashboard, MyTasks, Settings, NotFound)
├── styles/              # Global CSS and design tokens
├── types/               # TypeScript type definitions
└── utils/               # Pure utility functions (dates, tags, avatars, filters, notifications)
```

## Architecture Decisions

- **CSS Variables + BEM**: Chose vanilla CSS with design tokens over CSS-in-JS or Tailwind for simplicity and zero runtime cost. BEM naming prevents class collisions without build tools.
- **Apollo Client over fetch**: Apollo provides automatic caching, refetching, loading/error states, and TypeScript integration out of the box.
- **Shared UI catalogs**: Status, tag, and point options live in `src/constants/taskOptions.ts` because the API accepts these enum values but does not expose a metadata query for rendering form/filter options. Navigation routes and labels live in `src/constants/navigation.ts` so desktop and mobile navigation stay in sync.
- **Lazy-loaded pages**: Each page is code-split with `React.lazy()` to minimize the initial bundle size.
- **Context for cross-component communication**: `FilterContext` shares filter state between the search bar (Header) and the filter panel (SearchFilter) without prop drilling. `CreateTaskContext` bridges the bottom nav's "+" button with the dashboard's modal.
- **Server-side + client-side filtering**: Filters like status, tags, and assignee are sent to the API. Date filtering is done client-side because the API requires exact timestamp matching.
- **Optimistic drag-and-drop updates**: Task moves are reflected in the UI immediately, then synchronized with the API. If the API rejects the update, the UI reverts and shows an error toast.
- **Integer task positions**: Reordering renumbers affected tasks with integer positions (`1, 2, 3...`) to avoid backend/database errors from fractional values. Status and position changes happen through drag-and-drop, not through the edit form.
- **`useMemo` for context values**: Prevents unnecessary re-renders of all consumers when the provider re-renders.

## Features Completed

### Core Requirements
- [x] Dashboard with 5 Kanban columns (Backlog, To Do, In Progress, Done, Cancelled)
- [x] Task cards with name, tags, due date, points, and assignee
- [x] Connected to the GraphQL API with Apollo Client
- [x] Loading spinners and error states
- [x] Empty state when no tasks match filters
- [x] Create task via modal (red "+" button)
- [x] Edit task via 3-dot menu
- [x] Delete task with confirmation dialog
- [x] Toast notifications for success/error feedback
- [x] Notification center in the header bell with specific recent task actions
- [x] Search by name (real-time filtering)
- [x] Advanced filters: status, assignee, due date, points, tags
- [x] Settings page with user profile from API

### Bonus Features (from challenge doc)
- [x] **Drag and drop** between columns — updates the task status via API on drop
- [x] **Task count per column** — displayed in the column header as `(03)`
- [x] **List view** — My Tasks page with a table layout grouped by status, collapsible sections
- [x] **Date color coding** — green (on time), yellow (< 2 days left), red (overdue). Applied both to the date text on task cards and to the left border accent on the list view rows
- [x] **Stagger animations** — cards animate in with a cascading delay on page load

### Additional Features (from Figma design)
- [x] **iOS-style 3D wheel date picker** — The Figma includes both Android and iPhone mobile designs. I chose the iPhone design, implementing the scroll-wheel date picker with 3D barrel rotation (using `@ncdai/react-wheel-picker`).
- [x] **Responsive mobile layout** — Sidebar becomes a slide-in drawer, bottom navigation bar for quick access, mobile tab navigation between Dashboard and Tasks.
- [x] **View toggle** — Switch between board (Kanban) and list (table) views using the toolbar icons.

### Additional UX Improvements
- [x] **Same-column task reordering** — Cards can be reordered inside a column by dropping before/after another card, updating the editable `position` field through the API.
- [x] **Visual drop indicators** — While dragging, a red insertion line shows whether the task will be placed before or after the hovered card.
- [x] **Optimistic task moves** — The board updates immediately on drop and waits for backend confirmation, avoiding a slow drag-and-drop feel.
- [x] **Neutral avatar fallback** — Users without a valid API avatar show a local generic SVG instead of a misleading stock face.
- [x] **Profile popover** — Clicking the header avatar shows a compact profile summary using the `profile` query.
- [x] **Specific action notifications** — Create, update, delete, and move notifications include task names. Updates list changed fields such as assignee, due date, points, tags, and title changes; moves distinguish column changes from same-column reordering.
- [x] **Advanced filter panel** — The Figma only shows a search bar, but the challenge doc requires filtering by status, tags, assignee, due date, and estimated points. I added a collapsible filter panel with dropdowns and tag toggle buttons that sends filters to the API. Available in both Dashboard and My Tasks views.
- [x] **Error boundary** — Catches runtime errors and shows a recovery UI instead of a white screen.
- [x] **Click-outside to close** — Menus, dropdowns, and modals close when clicking outside.
- [x] **Keyboard support** — Escape key closes modals, accessible labels on all interactive elements.
- [x] **React Doctor 100/100** — Zero warnings for performance, accessibility, security, and maintainability.

## API

- **Backend**: `https://syn-api-production-e95c.up.railway.app/graphql`
- **Authentication**: Bearer token via `VITE_API_TOKEN` environment variable
- **Queries**: `tasks`, `profile`, `users`
- **Mutations**: `createTask`, `updateTask`, `deleteTask`
