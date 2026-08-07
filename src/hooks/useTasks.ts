import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { useFilters } from './useFilters';
import { GET_TASKS } from '../graphql/queries';
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK } from '../graphql/mutations';

type TaskQueryInput = Partial<
  Pick<CreateTaskInput, 'name' | 'status' | 'tags' | 'pointEstimate'> & { assigneeId: string }
>;

type TaskMutationResult = { success: true } | { success: false; error: string };

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useTasks() {
  const { filters } = useFilters();

  // Note: dueDate is filtered client-side because the API requires an exact timestamp match
  const apiInput = useMemo(() => {
    const input: TaskQueryInput = {};
    if (filters.status) input.status = filters.status;
    if (filters.tags && filters.tags.length > 0) input.tags = filters.tags;
    if (filters.pointEstimate) input.pointEstimate = filters.pointEstimate;
    if (filters.assigneeId) input.assigneeId = filters.assigneeId;
    if (filters.name) input.name = filters.name;
    return input;
  }, [filters]);

  const { data, loading, error, refetch } = useQuery<{ tasks: Task[] }>(GET_TASKS, {
    variables: { input: apiInput },
    fetchPolicy: 'cache-and-network',
  });

  const tasks = useMemo(() => {
    const all = data?.tasks ?? [];
    if (!filters.dueDate) return all;
    const filterDate = new Date(filters.dueDate).toDateString();
    return all.filter((task) => new Date(task.dueDate).toDateString() === filterDate);
  }, [data?.tasks, filters.dueDate]);

  const [createTaskMutation] = useMutation(CREATE_TASK);
  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskMutationResult> => {
      try {
        await createTaskMutation({
          variables: {
            input: {
              name: input.name,
              status: input.status,
              dueDate: input.dueDate,
              pointEstimate: input.pointEstimate,
              tags: input.tags,
              assigneeId: input.assigneeId || undefined,
            },
          },
        });
        await refetch();
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to create task') };
      }
    },
    [createTaskMutation, refetch],
  );

  const [updateTaskMutation] = useMutation(UPDATE_TASK);
  const runUpdateTaskMutation = useCallback(
    (input: UpdateTaskInput) => {
      const variables: UpdateTaskInput = { id: input.id };
      if (input.name !== undefined) variables.name = input.name;
      if (input.status !== undefined) variables.status = input.status;
      if (input.dueDate !== undefined) variables.dueDate = input.dueDate;
      if (input.pointEstimate !== undefined) variables.pointEstimate = input.pointEstimate;
      if (input.tags !== undefined) variables.tags = input.tags;
      if (input.position !== undefined) variables.position = input.position;
      if (input.assigneeId) variables.assigneeId = input.assigneeId;

      return updateTaskMutation({ variables: { input: variables } });
    },
    [updateTaskMutation],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInput): Promise<TaskMutationResult> => {
      try {
        await runUpdateTaskMutation(input);
        await refetch();
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to update task') };
      }
    },
    [runUpdateTaskMutation, refetch],
  );

  const updateTasks = useCallback(
    async (inputs: UpdateTaskInput[]): Promise<TaskMutationResult> => {
      try {
        await Promise.all(inputs.map((input) => runUpdateTaskMutation(input)));
        await refetch();
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to update tasks') };
      }
    },
    [runUpdateTaskMutation, refetch],
  );

  const [deleteTaskMutation] = useMutation(DELETE_TASK);
  const deleteTask = useCallback(
    async (taskId: string): Promise<TaskMutationResult> => {
      try {
        await deleteTaskMutation({ variables: { input: { id: taskId } } });
        await refetch();
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to delete task') };
      }
    },
    [deleteTaskMutation, refetch],
  );

  return {
    tasks,
    loading,
    error: error?.message ?? null,
    createTask,
    updateTask,
    updateTasks,
    deleteTask,
  };
}
