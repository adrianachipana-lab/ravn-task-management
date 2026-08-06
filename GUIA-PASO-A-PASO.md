# Task Management App - Guia Paso a Paso

Esta guia explica como funciona cada parte de la app, que conceptos de React usa, y por que se hizo de esa manera.

---

## Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables de UI
│   ├── Sidebar/        # Navegacion lateral
│   ├── Header/         # Barra superior
│   ├── TaskCard/       # Tarjeta individual de tarea
│   ├── TaskColumn/     # Columna del kanban (Backlog, Todo, etc.)
│   ├── TaskForm/       # Formulario para crear/editar tareas
│   ├── Modal/          # Modal generico reutilizable
│   ├── ConfirmDialog/  # Dialogo de confirmacion (para delete)
│   ├── SearchFilter/   # Barra de filtros y busqueda
│   ├── BottomNav/      # Navegacion mobile inferior
│   ├── MobileTabs/     # Tabs mobile entre Dashboard y My Tasks
│   ├── ViewToggle/     # Toggle visual board/list
│   ├── LoadingSpinner/ # Indicador de carga
│   └── Toast/          # Notificaciones temporales
├── pages/              # Paginas (cada una es una ruta)
│   ├── Dashboard/      # Pagina principal con el board
│   ├── MyTasks/        # Vista tipo lista agrupada por estado
│   ├── Settings/       # Pagina de perfil del usuario
│   └── NotFound/       # Pagina 404
├── hooks/              # Custom hooks (logica reutilizable)
│   ├── useTasks.ts     # CRUD de tareas via GraphQL/Apollo
│   ├── useCreateTask.ts# Puente para abrir create desde mobile nav
│   └── useToast.ts     # Manejo de notificaciones
├── graphql/            # Apollo Client, queries y mutations
├── context/            # Filtros globales y bridge de create task
├── types/              # Tipos de TypeScript
│   └── task.ts         # Task, User, enums, inputs
├── styles/             # Estilos globales
│   ├── variables.css   # Design tokens (colores, spacing, etc.)
│   └── global.css      # Reset CSS y layout base
├── utils/              # Funciones utilitarias
│   ├── date.ts         # Formateo de fechas y color coding
│   ├── tags.ts         # Labels y clases CSS para tags
│   └── avatar.ts       # Validacion de avatar y fallback neutral
├── App.tsx             # Componente raiz con routing
└── main.tsx            # Punto de entrada de la app
```

**Por que esta estructura?**
- **components/**: Cada componente reutilizable tiene su carpeta con `.tsx` e `index.ts`. Los estilos viven en CSS global con convencion BEM y tokens.
- **pages/**: Separamos paginas de componentes porque las paginas son las que se conectan a las rutas.
- **hooks/**: La logica de negocio vive en hooks, no en componentes. Asi los componentes solo se encargan de renderizar.
- **graphql/**: Centraliza queries/mutations para no mezclar strings GraphQL dentro de UI.
- **context/**: Mantiene estado compartido como filtros y acciones globales pequeñas.
- **types/**: Centralizar tipos evita duplicacion y facilita cambios.

---

## Conceptos de React Explicados

### 1. JSX y Componentes

```tsx
// Un componente es una funcion que retorna JSX
export function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <h3>{task.name}</h3>    {/* Expresion JS dentro de {} */}
    </article>
  );
}
```

JSX parece HTML pero es JavaScript. Se transforma en `React.createElement()` calls. Cada componente es una funcion que retorna UI.

### 2. Props (Propiedades)

```tsx
// Las props son los "argumentos" de un componente
interface TaskCardProps {
  task: Task;           // Data para mostrar
  index: number;        // Posicion para animacion stagger
  onEdit: (task: Task) => void;   // Callback al padre
  onDelete: (id: string) => void; // Callback al padre
}

export function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  // Usamos las props para renderizar y manejar eventos
}
```

**Flujo de datos**: Los datos bajan del padre al hijo via props. Los eventos suben del hijo al padre via callbacks.

### 3. useState - Estado Local

```tsx
// useState retorna [valor, setter]
const [menuOpen, setMenuOpen] = useState(false);

// Cuando llamamos setMenuOpen, React re-renderiza el componente
<button onClick={() => setMenuOpen(!menuOpen)}>
```

**Donde usamos useState:**
- `Dashboard`: modales abiertos/cerrados, tarea seleccionada, tareas optimistas durante drag & drop
- `TaskCard`: menu de opciones abierto/cerrado
- `TaskForm`: cada campo del formulario
- `TaskColumn`: estado visual de drag-over y linea de insercion

### 4. useEffect - Side Effects

```tsx
useEffect(() => {
  if (!menuOpen) return;

  // Side effect: escuchar clicks en el document
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);

  // Cleanup: se ejecuta al desmontar o cuando menuOpen cambia
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [menuOpen]); // Solo se ejecuta cuando menuOpen cambia
```

**Donde usamos useEffect:**
- `TaskCard`: cerrar menu al clickear fuera
- `Modal`: bloquear scroll del body, cerrar con Escape
- `useToast`: auto-dismiss despues de 3 segundos
- `Dashboard`: mantener el estado optimista hasta que el backend confirme el mismo orden

### 5. useRef - Referencias al DOM

```tsx
const menuRef = useRef<HTMLDivElement>(null);

// useRef nos da acceso directo al elemento DOM
// Sin causar re-renders (a diferencia de useState)
<div ref={menuRef}>
  {/* Podemos usar menuRef.current para leer propiedades del DOM */}
</div>
```

### 6. Custom Hooks

```tsx
// useTasks encapsula TODA la logica de comunicacion con la API
export function useTasks() {
  const { filters } = useFilters();
  const { data, loading, error, refetch } = useQuery(GET_TASKS);

  const updateTasks = useCallback(async (inputs: UpdateTaskInput[]) => {
    // Ejecuta updateTask para las tareas afectadas y hace un refetch al final
  }, []);

  return { tasks: data?.tasks ?? [], loading, error, createTask, updateTask, updateTasks, deleteTask };
}
```

**Por que custom hooks?**
- Separan logica de UI
- Son reutilizables en cualquier componente
- Testeable independientemente
- El componente queda limpio y facil de leer

### 7. Rendering Lists con .map() y key

```tsx
{columnTasks.map((task, index) => (
  <TaskCard
    key={task.id}     // key UNICO para que React trackee cambios
    task={task}
    index={index}     // Para stagger animation
    onEdit={onEdit}
    onDelete={onDelete}
  />
))}
```

**key** es obligatorio al renderizar listas. React lo usa para saber que elementos cambiaron, se agregaron o se eliminaron. Sin key, React re-renderiza todo. Con key, solo actualiza lo que cambio.

### 8. Conditional Rendering

```tsx
// Ternario: si no hay tareas, mostrar empty state
{columnTasks.length === 0 ? (
  <div className="task-column__empty"><p>No tasks</p></div>
) : (
  columnTasks.map(...)
)}

// && para renderizar condicionalmente
{menuOpen && <div className="task-card__menu">...</div>}

// null = no renderizar nada
if (!isOpen) return null;
```

### 9. React Router - Navegacion SPA

```tsx
// App.tsx - Define las rutas
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<NotFound />} />  {/* Catch-all = 404 */}
  </Routes>
</BrowserRouter>

// Sidebar.tsx - Links de navegacion
<NavLink
  to="/settings"
  className={({ isActive }) =>
    `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
  }
>
```

**NavLink vs Link**: NavLink sabe si la ruta esta activa y puede aplicar estilos.

### 10. Formularios Controlados

```tsx
// Cada input tiene su estado en React
const [name, setName] = useState('');

<input
  value={name}                    // React controla el valor
  onChange={(e) => setName(e.target.value)}  // Actualiza en cada keystroke
/>
```

El flujo es: usuario escribe -> onChange -> setState -> React re-renderiza -> input muestra nuevo valor. Esto nos da control total sobre los datos.

### 11. Composition con children

```tsx
// Modal no sabe que va adentro, acepta cualquier children
<Modal isOpen={true} title="Create Task">
  <TaskForm />    {/* children - puede ser CUALQUIER componente */}
</Modal>

// Dentro de Modal:
function Modal({ children }: { children: React.ReactNode }) {
  return <div className="modal__body">{children}</div>;
}
```

---

## TypeScript en React

### Typing Props con Interfaces

```tsx
interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}
```

### Const Objects como Enums (patron moderno)

```tsx
// Los enums de TS no funcionan con erasableSyntaxOnly
// Usamos const objects que son 100% JavaScript valido
export const TaskStatus = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

// Extraemos el tipo del objeto
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
// Resultado: 'BACKLOG' | 'TODO' | 'IN_PROGRESS'
```

### import type vs import

```tsx
// import type: solo para tipos, se borra en compilacion
import type { Task, CreateTaskInput } from '../types/task';

// import normal: para valores que se usan en runtime
import { TaskStatus } from '../types/task';
```

### Record<K, V> y Partial<T>

```tsx
// Record: mapa tipado
const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  // ...
};

// Partial: todos los campos opcionales
interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;  // solo id es obligatorio
}
```

---

## Estilos: CSS Global + BEM + Design Tokens

### BEM

```tsx
<article className="task-card">
  <h3 className="task-card__title">{task.name}</h3>
</article>
```

Se uso CSS global con nombres BEM (`task-card__title`, `task-card--dragging`) para mantener clases predecibles, evitar runtime extra y seguir cerca del design system.

### Variables CSS (Design Tokens)

```css
/* variables.css - Un solo lugar para todos los valores */
:root {
  --color-primary: #da584b;
  --spacing-md: 16px;
  --radius-md: 8px;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --duration-fast: 120ms;
}

/* Se usan en cualquier componente */
.task-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: transform var(--duration-fast) var(--ease-out);
}
```

---

## Animaciones (Emil Kowalski Design Principles)

### Stagger Animation en Cards

```css
.task-card {
  opacity: 0;
  animation: cardEnter 400ms var(--ease-out) forwards;
  animation-delay: var(--stagger-delay, 0ms);
}

/* Cada card entra 50ms despues de la anterior */
```

```tsx
<article style={{ '--stagger-delay': `${index * 50}ms` }}>
```

### Hover: solo en dispositivos con mouse

```css
/* Evita hover falsos en touch devices */
@media (hover: hover) and (pointer: fine) {
  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
  }
}
```

### Botones con feedback tactil

```css
.button:active {
  transform: scale(0.97);  /* Feedback instantaneo */
}
```

### Modales: nunca desde scale(0)

```css
/* MAL: aparece de la nada */
.modal { transform: scale(0); }

/* BIEN: empieza casi visible */
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
}
```

### Easing curves custom

```css
/* ease-out custom: da sensacion de respuesta inmediata */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

/* Los easings default de CSS son debiles.
   Estos custom curves hacen que las animaciones
   se sientan intencionales y profesionales. */
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## Flujo de Datos: Como funciona el CRUD

### Crear Tarea

```
1. Usuario clickea boton "+"
2. Dashboard: setShowCreateModal(true)
3. Se renderiza Modal con TaskForm dentro
4. Usuario llena el formulario (controlled inputs)
5. Usuario clickea "Create Task"
6. TaskForm llama onSubmit(data) -> callback al padre
7. Dashboard: handleCreate llama useTasks.createTask(data)
8. useTasks ejecuta createTask mutation en la API
9. Apollo/refetch actualiza la lista y React re-renderiza
10. showToast('Task created', 'success')
11. setShowCreateModal(false) -> modal se cierra
```

### Editar Tarea

```
1. Usuario clickea los 3 dots en una tarjeta
2. TaskCard: setMenuOpen(true) -> aparece dropdown
3. Usuario clickea "Edit"
4. TaskCard: onEdit(task) -> callback al padre
5. Dashboard: setEditingTask(task) -> abre modal con datos
6. TaskForm recibe initialData -> campos pre-llenados
7. Usuario modifica y clickea "Update Task"
8. Dashboard: handleUpdate -> useTasks.updateTask({id, ...data})
9. useTasks ejecuta updateTask mutation y refetch
10. Toast de exito, modal se cierra
```

### Eliminar Tarea

```
1. Usuario clickea los 3 dots -> "Delete"
2. TaskCard: onDelete(task.id) -> callback al padre
3. Dashboard: setDeletingTaskId(id) -> abre ConfirmDialog
4. Usuario clickea "Delete" en el dialogo
5. Dashboard: handleDelete -> useTasks.deleteTask(id)
6. useTasks ejecuta deleteTask mutation y refetch
7. Toast de exito, dialogo se cierra
```

### Filtrar Tareas

```
1. Usuario clickea "Filter" en toolbar
2. Dashboard: setSearchOpen(true) -> aparece SearchFilter
3. Usuario escribe o selecciona filtros
4. SearchFilter: onChange(newFilters) -> callback al padre
5. SearchFilter actualiza FilterContext
6. useTasks envia filtros soportados al query tasks
7. DueDate se filtra client-side porque la API exige timestamp exacto
8. Si 0 resultados: se muestra el estado vacio (`empty-results`)
```

### Drag & Drop y Reordenamiento

```
1. TaskCard escribe task-id y task-status en dataTransfer al iniciar drag
2. TaskColumn detecta si el cursor esta en la mitad superior o inferior de una card
3. Se muestra una linea roja indicando si la tarea caera antes o despues
4. Al soltar, TaskColumn calcula el nuevo orden de la columna
5. Se generan updates con posiciones enteras (1, 2, 3...) para evitar errores de DB
6. Dashboard aplica el cambio optimistamente para que la UI responda al instante
7. useTasks ejecuta updateTask para las tareas afectadas y hace refetch al final
8. Dashboard mantiene el estado optimista hasta que el backend confirma el mismo orden
9. Si la API falla, se revierte al estado real y aparece un toast de error
```

Esto no era un requerimiento explicito como reorder dentro de la misma columna, pero se agrego porque el documento menciona editar `position` y porque hace que el Kanban se sienta completo.

---

## Stack Tecnologico

| Tecnologia | Para que |
|---|---|
| React 19 | Libreria de UI |
| TypeScript | Type safety |
| Vite | Build tool + dev server |
| Apollo Client | Cliente GraphQL, cache, loading/error states |
| React Router | Routing SPA |
| Lucide React | Iconos |
| CSS global + BEM | Estilos predecibles con bajo overhead |
| CSS Custom Properties | Design tokens globales |
| Vitest + Testing Library | Tests unitarios/de componentes |
| Vercel | Deploy de produccion |

---

## Como Correr el Proyecto

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Build de produccion
npm run build

# Type-check sin build
npm run typecheck

# Tests
npm run test:run

# Lint
npm run lint
```

---

## Checklist del Challenge

| # | Requirement | Status |
|---|---|---|
| 1 | Folder structure | Hecho |
| 1 | Routing (Dashboard, Settings, 404) | Hecho |
| 1 | Styles solution (CSS global BEM + tokens) | Hecho |
| 2 | Sidebar con logo y navegacion | Hecho |
| 2 | Header con avatar y notificaciones | Hecho |
| 2 | Columnas (Backlog, Todo, In Progress, Done, Cancelled) | Hecho |
| 2 | Task cards con nombre, tags, fecha, puntos, avatar | Hecho |
| 2 | Menu de opciones (3 dots) | Hecho |
| 2 | Iconos de grid/list view | Hecho |
| 2 | Boton "+" para crear | Hecho |
| 3 | Mostrar tareas en columna segun status | Hecho |
| 3 | Empty state cuando no hay resultados | Hecho |
| 3 | Modal de crear tarea con boton "+" | Hecho |
| 3 | Error handling (toasts de error) | Hecho |
| 4 | Editar tarea (modal con campos editables) | Hecho |
| 4 | Confirmar y cancelar en edicion | Hecho |
| 4 | Notificacion de exito/error en update | Hecho |
| 4 | Eliminar tarea con confirmacion | Hecho |
| 4 | Notificacion de exito/error en delete | Hecho |
| 5 | Filtrar por: Name, Status, Points, Assignee, DueDate | Hecho |
| 5 | Empty state con filtros activos | Hecho |
| 6 | Pagina Settings con info del usuario | Hecho |
| Bonus | Color coding de fechas (green/yellow/red) | Hecho |
| Bonus | Conteo de tareas por columna | Hecho |
| Bonus | Animaciones al agregar tareas | Hecho |
| Bonus | Drag & drop entre columnas con update de status | Hecho |
| Extra | Reordenar tareas dentro de la misma columna | Hecho |
| Extra | Indicador visual de insercion durante drag | Hecho |
| Extra | Updates optimistas al mover tareas | Hecho |
| Extra | Fallback neutral para usuarios sin avatar valido | Hecho |
| Extra | Deploy en Vercel | Hecho |
