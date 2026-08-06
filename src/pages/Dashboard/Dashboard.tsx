import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter/SearchFilter';
import { useFilters } from '../../context/FilterContext';
import { TaskColumn } from '../../components/TaskColumn';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ToastContainer } from '../../components/Toast';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { useCreateTask } from '../../hooks/useCreateTask';
import type { Task, CreateTaskInput } from '../../types/task';
import { TaskStatus } from '../../types/task';

// Column order for the Kanban board
const COLUMNS = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
];

type TaskMoveUpdate = { id: string; status: TaskStatus; position: number };

function applyTaskMoveUpdates(tasks: Task[], updates: TaskMoveUpdate[]) {
  return tasks.map((task) => {
    const update = updates.find((item) => item.id === task.id);
    return update ? { ...task, status: update.status, position: update.position } : task;
  });
}

function hasAppliedTaskMoveUpdates(tasks: Task[], updates: TaskMoveUpdate[]) {
  return updates.every((update) => {
    const task = tasks.find((item) => item.id === update.id);
    return task?.status === update.status && task.position === update.position;
  });
}

// Main dashboard page: displays tasks in a Kanban board layout
// Handles creating, editing, deleting tasks, and drag-and-drop between columns
export function Dashboard() {
  const { tasks, loading, error, createTask, updateTask, updateTasks, deleteTask } = useTasks();
  const { filters, clearFilters } = useFilters();
  const { toasts, showToast, removeToast } = useToast();

  const { setOnCreate } = useCreateTask();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [pendingMoveUpdates, setPendingMoveUpdates] = useState<TaskMoveUpdate[]>([]);
  const visibleTasks = optimisticTasks ?? tasks;

  useEffect(() => {
    if (pendingMoveUpdates.length > 0 && hasAppliedTaskMoveUpdates(tasks, pendingMoveUpdates)) {
      setOptimisticTasks(null);
      setPendingMoveUpdates([]);
    }
  }, [pendingMoveUpdates, tasks]);

  setOnCreate(() => setShowCreateForm(true));
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // CRUD handlers — each shows a toast notification on success or failure
  const handleCreate = async (input: CreateTaskInput) => {
    const result = await createTask(input);
    if (result.success) {
      showToast('Task created successfully', 'success');
      setShowCreateForm(false);
    } else {
      showToast(result.error ?? 'Failed to create task', 'error');
    }
  };

  const handleUpdate = async (input: CreateTaskInput) => {
    if (!editingTask) return;
    const result = await updateTask({ id: editingTask.id, ...input });
    if (result.success) {
      showToast('Task updated successfully', 'success');
      setEditingTask(null);
    } else {
      showToast(result.error ?? 'Failed to update task', 'error');
    }
  };

  const handleMoveTasks = async (updates: TaskMoveUpdate[]) => {
    if (updates.length === 0) return;
    setOptimisticTasks(applyTaskMoveUpdates(visibleTasks, updates));
    setPendingMoveUpdates(updates);

    const result = await updateTasks(updates);
    if (result.success) {
      showToast('Task moved successfully', 'success');
    } else {
      setOptimisticTasks(null);
      setPendingMoveUpdates([]);
      showToast(result.error ?? 'Failed to move task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    const result = await deleteTask(deletingTaskId);
    if (result.success) {
      showToast('Task deleted successfully', 'success');
      setDeletingTaskId(null);
    } else {
      showToast(result.error ?? 'Failed to delete task', 'error');
    }
  };

  return (
    <div className="dashboard">
      <div className="toolbar">
        <ViewToggle />
        <button type="button" className="toolbar__add-btn" aria-label="Add task" onClick={() => setShowCreateForm(true)}>
          <Plus size={20} />
        </button>
      </div>

      <SearchFilter />

      {/* Show loading spinner while fetching tasks */}
      {loading && visibleTasks.length === 0 && (
        <div className="loading-spinner"><div className="loading-spinner__circle" /></div>
      )}

      {/* Show error message if the query failed */}
      {error && (
        <div className="empty-results">
          <p className="empty-results__text">Failed to load tasks: {error}</p>
        </div>
      )}

      {!loading && visibleTasks.length === 0 && Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== undefined) ? (
        <div className="empty-results">
          <p className="empty-results__text">No tasks match the current filters</p>
          <button type="button" className="empty-results__btn" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
      <div className="board">
        {COLUMNS.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={visibleTasks}
            onEdit={setEditingTask}
            onDelete={setDeletingTaskId}
            onMoveTasks={handleMoveTasks}
          />
        ))}
      </div>
      )}

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <TaskForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
      </Modal>

      <Modal isOpen={editingTask !== null} onClose={() => setEditingTask(null)}>
        {editingTask && (
          <TaskForm initialData={editingTask} onSubmit={handleUpdate} onCancel={() => setEditingTask(null)} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
