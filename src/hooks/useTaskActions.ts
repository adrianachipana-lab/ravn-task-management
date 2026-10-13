import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import type { Task, CreateTaskInput, User } from '../types/task';
import { useTasks, type TaskMutationResult } from './useTasks';
import { useNotifications } from './useNotifications';
import { useCreateTask } from './useCreateTask';
import { GET_USERS } from '../graphql/queries';
import { buildTaskUpdateNotification } from '../utils/notifications';

export function useTaskActions() {
  const taskData = useTasks();
  const { tasks, createTask, updateTask, deleteTask } = taskData;
  const { data: usersData } = useQuery<{ users: User[] }>(GET_USERS);
  const { showNotification } = useNotifications();
  const { setOnCreate } = useCreateTask();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setOnCreate(() => setShowCreateForm(true));
    return () => setOnCreate(() => {});
  }, [setOnCreate]);

  const handleCreate = async (input: CreateTaskInput) => {
    const result = await createTask(input);
    if (result.success) {
      showNotification(`Task "${input.name}" was created successfully`, 'success');
      setShowCreateForm(false);
    } else {
      showNotification(result.error ?? 'Failed to create task', 'error');
    }
  };

  const handleUpdate = async (input: CreateTaskInput) => {
    if (!editingTask) return;
    const result = await updateTask({ id: editingTask.id, ...input });
    if (result.success) {
      showNotification(
        buildTaskUpdateNotification(editingTask, input, usersData?.users ?? []),
        'success',
      );
      setEditingTask(null);
    } else {
      showNotification(result.error ?? 'Failed to update task', 'error');
    }
  };

  const handleDelete = async (): Promise<TaskMutationResult | undefined> => {
    if (!deletingTaskId) return undefined;
    const deletingTask = tasks.find((task) => task.id === deletingTaskId);
    const result = await deleteTask(deletingTaskId);
    if (result.success) {
      showNotification(`"${deletingTask?.name ?? 'Task'}" was deleted`, 'success');
      setDeletingTaskId(null);
    } else {
      showNotification(result.error ?? 'Failed to delete task', 'error');
    }
    return result;
  };

  return {
    ...taskData,
    showCreateForm,
    setShowCreateForm,
    editingTask,
    setEditingTask,
    deletingTaskId,
    setDeletingTaskId,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
