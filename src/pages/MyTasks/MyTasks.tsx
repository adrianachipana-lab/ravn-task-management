import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { ViewToggle } from '../../components/ViewToggle';
import { SearchFilter } from '../../components/SearchFilter';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../../components/TaskForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useTaskActions } from '../../hooks/useTaskActions';
import {
  formatListDate,
  getPointLabel,
  getDateColor,
  getListDateClassName,
} from '../../utils/date';
import { getTagLabel, getTagClassName } from '../../utils/tags';
import { getAvatarUrl } from '../../utils/avatar';
import { TASK_STATUS_OPTIONS } from '../../constants/taskOptions';

export function MyTasks() {
  const {
    tasks,
    loading,
    error,
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

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [tagPopup, setTagPopup] = useState<string | null>(null);

  const toggleSection = (status: string) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <div className="my-tasks">
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

      {loading && tasks.length === 0 && (
        <div className="loading-spinner">
          <div className="loading-spinner__circle" />
        </div>
      )}

      {error && (
        <div className="empty-results">
          <p className="empty-results__text">Failed to load tasks: {error}</p>
        </div>
      )}

      <div className="task-table">
        <div className="task-table__header">
          <div># Task Name</div>
          <div>Tags</div>
          <div>Estimate</div>
          <div>Task Assign Name</div>
          <div>Due Date</div>
        </div>

        {TASK_STATUS_OPTIONS.map((section) => {
          const sectionTasks = tasks.filter((t) => t.status === section.value);
          const isCollapsed = collapsed[section.value];

          return (
            <div key={section.value} className="task-table__section">
              <button
                type="button"
                className="task-table__section-header"
                onClick={() => toggleSection(section.value)}
              >
                <ChevronDown
                  size={16}
                  className={`task-table__chevron${isCollapsed ? ' task-table__chevron--collapsed' : ''}`}
                />
                <span className="task-table__section-title">{section.label}</span>
                <span className="task-table__section-count">
                  ({String(sectionTasks.length).padStart(2, '0')})
                </span>
              </button>

              {!isCollapsed &&
                sectionTasks.map((task, index) => {
                  const dateColor = getDateColor(task.dueDate);
                  const dateText = formatListDate(task.dueDate);
                  const dateClass = getListDateClassName(dateColor);
                  const dateClassName = ['task-table__col-date', dateClass]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div key={task.id} className="task-table__row">
                      <button
                        type="button"
                        className="task-table__row-action"
                        onClick={() => setEditingTask(task)}
                        aria-label={`Edit ${task.name}`}
                      />
                      <div
                        className={`task-table__row-border task-table__row-border--${dateColor}`}
                      />
                      <div className="task-table__col-name">
                        <span className="task-table__row-number">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="task-table__row-task-name" title={task.name}>
                          {task.name}
                        </span>
                      </div>
                      <div className="task-table__col-tags">
                        {task.tags.length > 0 && (
                          <span
                            className={`task-table__tag task-table__tag--${getTagClassName(task.tags[0])}`}
                          >
                            {getTagLabel(task.tags[0])}
                          </span>
                        )}
                        {task.tags.length > 1 && (
                          <div className="task-table__tag-more-wrapper">
                            <button
                              type="button"
                              className="task-table__tag-more"
                              onClick={() => setTagPopup(tagPopup === task.id ? null : task.id)}
                            >
                              +{task.tags.length - 1}
                            </button>
                            {tagPopup === task.id && (
                              <div className="task-table__tag-popup">
                                {task.tags.slice(1).map((tag) => (
                                  <span
                                    key={tag}
                                    className={`task-table__tag task-table__tag--${getTagClassName(tag)}`}
                                  >
                                    {getTagLabel(tag)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="task-table__col-estimate">
                        {getPointLabel(task.pointEstimate)}
                      </div>
                      <div className="task-table__col-assignee">
                        {task.assignee && (
                          <>
                            <img
                              className="task-table__assignee-avatar"
                              src={getAvatarUrl(task.assignee.avatar)}
                              alt={task.assignee.fullName}
                            />
                            <span className="task-table__assignee-name">
                              {task.assignee.fullName}
                            </span>
                          </>
                        )}
                      </div>
                      <div className={dateClassName}>{dateText}</div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

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
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
