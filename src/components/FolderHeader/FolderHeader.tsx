import { useState, useRef, useEffect } from 'react';
import type { RankingFolder } from '../../api/types';
import styles from './FolderHeader.module.css';

interface FolderHeaderProps {
  folder: RankingFolder;
  itemCount: number;
  onToggle: () => void;
  onRemove: () => void;
  onRename: (newLabel: string) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  viewMode?: 'list' | 'grid';
}

export function FolderHeader({
  folder,
  itemCount,
  onToggle,
  onRemove,
  onRename,
  isDragging = false,
  isDropTarget = false,
  viewMode = 'list',
}: FolderHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleDoubleClick() {
    setEditValue(folder.label);
    setIsEditing(true);
  }

  function handleBlur() {
    if (editValue.trim() && editValue !== folder.label) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(folder.label);
      setIsEditing(false);
    }
  }

  const isGrid = viewMode === 'grid';

  return (
    <div
      className={`${styles.folder} ${isDragging ? styles.dragging : ''} ${isGrid ? styles.gridFolder : ''} ${isDropTarget ? styles.dropTarget : ''}`}
    >
      <button
        className={styles.toggleBtn}
        onClick={onToggle}
        title={folder.isExpanded ? 'Collapse folder' : 'Expand folder'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`${styles.chevron} ${folder.isExpanded ? styles.expanded : ''}`}
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      <div className={styles.folderIcon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      </div>

      <div className={styles.content}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
        ) : (
          <span
            className={styles.label}
            onDoubleClick={handleDoubleClick}
            title="Double-click to rename"
          >
            {folder.label}
          </span>
        )}
        <span className={styles.count}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <button
        className={styles.removeBtn}
        onClick={onRemove}
        title="Remove folder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
