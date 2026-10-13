import { useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter';
import { TaskColumn } from '../../components/TaskColumn';
import { TaskCard } from '../../components/TaskCard';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useFilters } from '../../hooks/useFilters';
import { useNotifications } from '../../hooks/useNotifications';
import type { Task, TaskStatus, TaskPositionUpdate } from '../../types/task';
import { TASK_STATUS_LABELS, TASK_STATUS_VALUES } from '../../constants/taskOptions';
import { hasActiveFilters } from '../../utils/filters';
import { buildPositionUpdates } from '../../utils/dragPositions';

function applyTaskPositionUpdates(tasks: Task[], updates: TaskPositionUpdate[]) {
  return tasks.map((task) => {
    const update = updates.find((item) => item.id === task.id);
    return update ? { ...task, status: update.status, position: update.position } : task;
  });
}

function getColumnId(id: string | number): TaskStatus | null {
  const str = String(id);
  if (str.startsWith('column-')) return str.slice(7) as TaskStatus;
  return null;
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
  const pendingMoveCountRef = useRef(0);
  const visibleTasks = optimisticTasks ?? tasks;

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = useMemo(
    () => (activeId ? visibleTasks.find((t) => t.id === activeId) ?? null : null),
    [activeId, visibleTasks],
  );

  // Sensors: pointer (mouse), touch, and keyboard
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Track which column the card is currently over for visual feedback
  const handleDragOver = (_event: DragOverEvent) => {
    // @dnd-kit handles the visual indicators via isOver in useDroppable
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const draggedTaskId = String(active.id);

    // Determine target column: either the column droppable or the column of the over task
    let targetStatus: TaskStatus | null = getColumnId(over.id);
    let overTaskId: string | null = null;

    if (!targetStatus) {
      // Dropped over another task card
      const overTask = visibleTasks.find((t) => t.id === String(over.id));
      if (overTask) {
        targetStatus = overTask.status;
        overTaskId = overTask.id;
      }
    }

    if (!targetStatus) return;

    // Don't fire if dropped back in exact same spot
    const draggedTask = visibleTasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    const updates = buildPositionUpdates(visibleTasks, draggedTaskId, targetStatus, overTaskId);
    const movedTaskId = draggedTaskId;
    if (updates.length === 0) return;

    // Fire the move
    pendingMoveCountRef.current++;
    setOptimisticTasks(applyTaskPositionUpdates(optimisticTasks ?? tasks, updates));

    updateTasks(updates)
      .then((result) => {
        if (result.success) {
          const movedUpdate = updates.find((u) => u.id === movedTaskId);
          const taskName = draggedTask.name;
          const message =
            draggedTask.status !== targetStatus
              ? `Task "${taskName}" was moved from ${TASK_STATUS_LABELS[draggedTask.status]} to ${TASK_STATUS_LABELS[targetStatus!]}`
              : `Task "${taskName}" was reordered in ${
                  movedUpdate ? TASK_STATUS_LABELS[movedUpdate.status] : 'the column'
                }`;
          showNotification(message, 'success');
        } else {
          showNotification(result.error ?? 'Failed to move task', 'error');
        }
      })
      .finally(() => {
        pendingMoveCountRef.current--;
        if (pendingMoveCountRef.current === 0) {
          setOptimisticTasks(null);
        }
      });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDeleteWithCleanup = async () => {
    if (!deletingTaskId) return;
    const currentTasks = optimisticTasks ?? tasks;

    // Remove from optimistic view immediately so the card disappears
    setOptimisticTasks(currentTasks.filter((t) => t.id !== deletingTaskId));

    const result = await handleDelete();
    if (result && !result.success) {
      // Delete failed: fall back to server state which still has the task
      setOptimisticTasks(null);
    } else if (pendingMoveCountRef.current === 0) {
      setOptimisticTasks(null);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="board">
            {TASK_STATUS_VALUES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={visibleTasks}
                onEdit={setEditingTask}
                onDelete={setDeletingTaskId}
                activeId={activeId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                index={0}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
        onConfirm={handleDeleteWithCleanup}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
