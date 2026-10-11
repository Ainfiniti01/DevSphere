"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ContentAction = {
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
};

type ContentActionMenuProps = {
  children: React.ReactNode;
  actions: ContentAction[];
  ariaLabel?: string;
};

type MenuPosition = { top: number; left: number };

const MENU_WIDTH = 220;
const MENU_HEIGHT = 260;

const ContentActionMenu = ({ children, actions, ariaLabel = 'More actions' }: ContentActionMenuProps) => {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const closeMenu = () => setPosition(null);

  const openMenu = (x: number, y: number) => {
    const left = Math.min(Math.max(8, x), window.innerWidth - MENU_WIDTH - 8);
    const top = Math.min(Math.max(8, y), window.innerHeight - MENU_HEIGHT - 8);
    setPosition({ top, left });
  };

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    if (!position) return;
    const handleOutsidePointer = () => closeMenu();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position]);

  useEffect(() => () => clearLongPress(), []);

  if (actions.length === 0) return <>{children}</>;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      openMenu(event.clientX, event.clientY);
      longPressTimer.current = null;
    }, 550);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || !pointerStart.current) return;
    const distance = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
    if (distance > 10) clearLongPress();
  };

  const handlePointerEnd = () => {
    clearLongPress();
    pointerStart.current = null;
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openMenu(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      openMenu(bounds.left + bounds.width / 2, bounds.bottom + 6);
    }
  };

  return (
    <div
      className="relative min-w-0"
      tabIndex={0}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
    >
      {children}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={!!position}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (position) closeMenu();
          else {
            const bounds = event.currentTarget.getBoundingClientRect();
            openMenu(bounds.right - MENU_WIDTH, bounds.bottom + 6);
          }
        }}
        className="absolute right-2 top-2 z-10 rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreHorizontal size={17} />
      </button>
      {position && createPortal(
        <div
          role="menu"
          aria-label={ariaLabel}
          onPointerDown={(event) => event.stopPropagation()}
          className="fixed z-[100] w-[220px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
          style={{ top: position.top, left: position.left }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                action.onSelect();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${action.destructive ? 'text-destructive' : ''}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default ContentActionMenu;
