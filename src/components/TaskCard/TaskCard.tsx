import { memo, useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Clock, Pencil, Trash2 } from 'lucide-react';
import type { Task } from '../../types/task';
import { formatDate, getDateColor, getPointLabel } from '../../utils/date';
import { getTagLabel, getTagClassName } from '../../utils/tags';
import { getAvatarUrl } from '../../utils/avatar';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dateColor = getDateColor(task.dueDate);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <article
      className="task-card"
      style={{ '--stagger-delay': `${index * 50}ms` } as React.CSSProperties}
    >
      <div className="task-card__header">
        <h3 className="task-card__title" title={task.name}>
          {task.name}
        </h3>
        <div className="task-card__menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className={`task-card__options-btn${menuOpen ? ' task-card__options-btn--visible' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label={`Options for ${task.name}`}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="task-card__menu">
              <button
                type="button"
                className="task-card__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(task);
                }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                className="task-card__menu-item task-card__menu-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(task.id);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="task-card__points-row">
        <span className="task-card__points">{getPointLabel(task.pointEstimate)}</span>
        <span className={`task-card__date task-card__date--${dateColor}`}>
          <Clock size={13} />
          {formatDate(task.dueDate)}
        </span>
      </div>

      <div className="task-card__tags">
        {task.tags.map((tag) => (
          <span key={tag} className={`task-card__tag task-card__tag--${getTagClassName(tag)}`}>
            {getTagLabel(tag).toUpperCase()}
          </span>
        ))}
      </div>

      <div className="task-card__footer">
        {task.assignee && (
          <img
            className="task-card__avatar"
            src={getAvatarUrl(task.assignee.avatar)}
            alt={task.assignee.fullName}
            title={task.assignee.fullName}
          />
        )}
      </div>
    </article>
  );
});
