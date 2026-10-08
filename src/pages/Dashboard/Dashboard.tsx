import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter';
import { TaskColumn } from '../../components/TaskColumn';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useFilters } from '../../hooks/useFilters';
import { useNotifications } from '../../hooks/useNotifications';
import type { Task, TaskPositionUpdate } from '../../types/task';
import { TASK_STATUS_LABELS, TASK_STATUS_VALUES } from '../../constants/taskOptions';
import { hasActiveFilters } from '../../utils/filters';

function applyTaskPositionUpdates(tasks: Task[], updates: TaskPositionUpdate[]) {
  return tasks.map((task) => {
    const update = updates.find((item) => item.id === task.id);
    return update ? { ...task, status: update.status, position: update.position } : task;
  });
}

function hasAppliedTaskPositionUpdates(tasks: Task[], updates: TaskPositionUpdate[]) {
  return updates.every((update) => {
    const task = tasks.find((item) => item.id === update.id);
    return task?.status === update.status && task.position === update.position;
  });
}

export function Dashboard() {
  const {
    tasks,
    loading,
    error,
    updateTasks,
    showCreateForm,
    setShowCreateForm,
    editingTask,
    setEditingTask,
    deletingTaskId,
    setDeletingTaskId,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useTaskActions();
  const { filters, clearFilters } = useFilters();
  const { showNotification } = useNotifications();

  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [pendingMoveUpdates, setPendingMoveUpdates] = useState<TaskPositionUpdate[]>([]);
  const visibleTasks = optimisticTasks ?? tasks;

  useEffect(() => {
    if (pendingMoveUpdates.length > 0 && hasAppliedTaskPositionUpdates(tasks, pendingMoveUpdates)) {
      setOptimisticTasks(null);
      setPendingMoveUpdates([]);
    }
  }, [pendingMoveUpdates, tasks]);

  const handleMoveTasks = async (updates: TaskPositionUpdate[], movedTaskId: string) => {
    if (updates.length === 0) return;
    setOptimisticTasks(applyTaskPositionUpdates(visibleTasks, updates));
    setPendingMoveUpdates(updates);

    const result = await updateTasks(updates);
    if (result.success) {
      const movedTask = visibleTasks.find((task) => task.id === movedTaskId);
      const movedUpdate = updates.find((update) => update.id === movedTaskId);
      const taskName = movedTask?.name ?? 'Task';
      const message =
        movedTask && movedUpdate && movedTask.status !== movedUpdate.status
          ? `Task "${taskName}" was moved from ${TASK_STATUS_LABELS[movedTask.status]} to ${TASK_STATUS_LABELS[movedUpdate.status]}`
          : `Task "${taskName}" was reordered in ${
              movedUpdate ? TASK_STATUS_LABELS[movedUpdate.status] : 'the column'
            }`;
      showNotification(message, 'success');
    } else {
      setOptimisticTasks(null);
      setPendingMoveUpdates([]);
      showNotification(result.error ?? 'Failed to move task', 'error');
    }
  };

  return (
    <div className="dashboard">
      <div className="toolbar">
        <ViewToggle />
        <button
          type="button"
          className="toolbar__add-btn"
          aria-label="Add task"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={20} />
        </button>
      </div>

      <SearchFilter />

      {loading && visibleTasks.length === 0 && (
        <div className="loading-spinner">
          <div className="loading-spinner__circle" />
        </div>
      )}

      {error && (
        <div className="empty-results">
          <p className="empty-results__text">Failed to load tasks: {error}</p>
        </div>
      )}

      {!loading && visibleTasks.length === 0 && hasActiveFilters(filters) ? (
        <div className="empty-results">
          <p className="empty-results__text">No tasks match the current filters</p>
          <button type="button" className="empty-results__btn" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="board">
          {TASK_STATUS_VALUES.map((status) => (
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

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} ariaLabel="Create task">
        <TaskForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
      </Modal>

      <Modal isOpen={editingTask !== null} onClose={() => setEditingTask(null)} ariaLabel="Edit task">
        {editingTask && (
          <TaskForm
            initialData={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
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
    </div>
  );
}
