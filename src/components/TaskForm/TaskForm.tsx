import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { LayoutGrid, User, Tag, Calendar } from 'lucide-react';
import type { Task, CreateTaskInput, TaskTag, User as UserType } from '../../types/task';
import { DatePicker } from '../DatePicker';
import { TaskStatus } from '../../types/task';
import { GET_USERS } from '../../graphql/queries';
import { getAvatarUrl } from '../../utils/avatar';
import { formatDateInputValue, formatFormDateLabel } from '../../utils/date';
import { getTagLabel } from '../../utils/tags';
import { TASK_POINT_OPTIONS, TASK_TAG_OPTIONS } from '../../constants/taskOptions';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: CreateTaskInput) => void;
  onCancel: () => void;
}

type DropdownType = 'estimate' | 'assignee' | 'label' | 'dueDate' | null;

export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const { data: usersData } = useQuery<{ users: UserType[] }>(GET_USERS);
  const users = usersData?.users ?? [];

  const [name, setName] = useState(initialData?.name ?? '');
  const [pointEstimate, setPointEstimate] = useState(initialData?.pointEstimate ?? '');
  const [assigneeId, setAssigneeId] = useState(initialData?.assignee?.id ?? '');
  const [tags, setTags] = useState<TaskTag[]>(initialData?.tags ?? []);
  const [dueDate, setDueDate] = useState(() => {
    if (!initialData?.dueDate) return '';
    return formatDateInputValue(initialData.dueDate);
  });
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const selectedAssignee = users.find((u) => u.id === assigneeId);
  const selectedPointLabel = TASK_POINT_OPTIONS.find((p) => p.value === pointEstimate)?.label;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const titleInput = titleRef.current;
    if (!titleInput) return;
    titleInput.style.height = 'auto';
    titleInput.style.height = `${Math.min(titleInput.scrollHeight, 180)}px`;
  }, [name]);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const handleTagToggle = (tag: TaskTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setName(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      status: initialData?.status ?? TaskStatus.BACKLOG,
      dueDate: dueDate ? `${dueDate}T12:00:00` : new Date().toISOString(),
      pointEstimate: pointEstimate || 'ZERO',
      tags,
      assigneeId,
    });
  };

  return (
    <form className="task-form" ref={formRef} onSubmit={handleSubmit}>
      <textarea
        ref={titleRef}
        className="task-form__title-input"
        value={name}
        onChange={handleNameChange}
        placeholder="Task Title"
        aria-label="Task title"
        rows={1}
      />

      <div className="task-form__chips">
        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${pointEstimate ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('estimate')}
          >
            <LayoutGrid size={14} />
            {selectedPointLabel || 'Estimate'}
          </button>
          {openDropdown === 'estimate' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Estimate</div>
              {TASK_POINT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`task-form__dropdown-item${pointEstimate === opt.value ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => {
                    setPointEstimate(opt.value);
                    setOpenDropdown(null);
                  }}
                >
                  <LayoutGrid size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${assigneeId ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('assignee')}
          >
            {selectedAssignee ? (
              <>
                <img
                  className="task-form__chip-avatar"
                  src={getAvatarUrl(selectedAssignee.avatar)}
                  alt={selectedAssignee.fullName}
                />
                {selectedAssignee.fullName}
              </>
            ) : (
              <>
                <User size={14} /> Assignee
              </>
            )}
          </button>
          {openDropdown === 'assignee' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Assign to...</div>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`task-form__dropdown-item${assigneeId === user.id ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => {
                    setAssigneeId(user.id);
                    setOpenDropdown(null);
                  }}
                >
                  <img
                    className="task-form__dropdown-avatar"
                    src={getAvatarUrl(user.avatar)}
                    alt={user.fullName}
                  />
                  {user.fullName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${tags.length > 0 ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('label')}
          >
            <Tag size={14} />
            {tags.length > 0 ? tags.map(getTagLabel).join(', ') : 'Label'}
          </button>
          {openDropdown === 'label' && (
            <div className="task-form__dropdown">
              <div className="task-form__dropdown-header">Tag Title</div>
              {TASK_TAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`task-form__dropdown-item${tags.includes(opt.value) ? ' task-form__dropdown-item--active' : ''}`}
                  onClick={() => handleTagToggle(opt.value)}
                >
                  <Tag size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="task-form__chip-wrapper">
          <button
            type="button"
            className={`task-form__chip${dueDate ? ' task-form__chip--selected' : ''}`}
            onClick={() => toggleDropdown('dueDate')}
          >
            <Calendar size={14} />
            {dueDate ? formatFormDateLabel(dueDate) : 'Due date'}
          </button>
          {openDropdown === 'dueDate' && (
            <div className="task-form__dropdown task-form__dropdown--date">
              <div className="task-form__date-picker-mobile">
                <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} />
                <button
                  type="button"
                  className="task-form__date-done-btn"
                  onClick={() => setOpenDropdown(null)}
                >
                  Done
                </button>
              </div>
              <input
                type="date"
                className="task-form__date-input"
                aria-label="Due date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setOpenDropdown(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="task-form__actions">
        <button type="button" className="task-form__cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="task-form__submit-btn">
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
