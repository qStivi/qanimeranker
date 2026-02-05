import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedStyle = {
    left: Math.min(position.x, window.innerWidth - 200),
    top: Math.min(position.y, window.innerHeight - 300),
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={adjustedStyle}
    >
      {children}
    </div>
  );
}

interface ContextMenuItemProps {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  hasSubmenu?: boolean;
  children?: ReactNode;
}

export function ContextMenuItem({
  label,
  icon,
  onClick,
  disabled = false,
  hasSubmenu = false,
  children,
}: ContextMenuItemProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  function handleClick() {
    if (!disabled && onClick) {
      onClick();
    }
  }

  return (
    <div
      ref={itemRef}
      className={`${styles.item} ${disabled ? styles.disabled : ''} ${hasSubmenu ? styles.hasSubmenu : ''}`}
      onClick={handleClick}
      onMouseEnter={() => hasSubmenu && setShowSubmenu(true)}
      onMouseLeave={() => hasSubmenu && setShowSubmenu(false)}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {hasSubmenu && (
        <>
          <span className={styles.arrow}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </span>
          {showSubmenu && children && (
            <div className={styles.submenu}>
              {children}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ContextMenuDividerProps {}

export function ContextMenuDivider(_props: ContextMenuDividerProps) {
  return <div className={styles.divider} />;
}
