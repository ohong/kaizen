"use client";

import { type ReactNode, useState } from "react";
import type { WidgetConfig, WidgetSize } from "@/lib/types/widgets";

interface WidgetWrapperProps {
  widget: WidgetConfig;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetSize) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  editMode?: boolean;
}

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: "col-span-1",
  medium: "col-span-1",
  large: "col-span-2",
  full: "col-span-full",
};

export function WidgetWrapper({
  widget,
  children,
  onRemove,
  onResize,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  editMode = false,
}: WidgetWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${SIZE_CLASSES[widget.size]} transition-all duration-200`}>
      <div className="hud-panel hud-corner relative h-full p-3">
        {editMode && (
          <div className="absolute -top-2 -right-2 z-10 flex gap-1">
            {onMoveUp && canMoveUp && (
              <button
                onClick={() => onMoveUp(widget.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] bg-[var(--hud-bg)] text-[var(--hud-text-dim)] hover:bg-[var(--hud-accent)]/20 hover:text-[var(--hud-accent)]"
                title="Move up"
              >
                ↑
              </button>
            )}
            {onMoveDown && canMoveDown && (
              <button
                onClick={() => onMoveDown(widget.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] bg-[var(--hud-bg)] text-[var(--hud-text-dim)] hover:bg-[var(--hud-accent)]/20 hover:text-[var(--hud-accent)]"
                title="Move down"
              >
                ↓
              </button>
            )}
            {onResize && (
              <select
                value={widget.size}
                onChange={(e) => onResize(widget.id, e.target.value as WidgetSize)}
                className="h-6 rounded border border-[var(--hud-border)] bg-[var(--hud-bg)] px-2 text-xs text-[var(--hud-text-dim)] hover:bg-[var(--hud-accent)]/20"
                title="Change size"
              >
                <option value="small">S</option>
                <option value="medium">M</option>
                <option value="large">L</option>
                <option value="full">Full</option>
              </select>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(widget.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-danger)]/40 bg-[var(--hud-bg)] text-[var(--hud-danger)] hover:bg-[var(--hud-danger)]/20"
                title="Remove widget"
              >
                ×
              </button>
            )}
          </div>
        )}

        <details open={isExpanded} onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)} className="group h-full">
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-[var(--hud-text)] transition-colors group-open:bg-[var(--hud-bg-elevated)]">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                {widget.title}
              </span>
            </div>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90"
              aria-hidden
            >
              ▸
            </span>
          </summary>
          <div className="mt-4">{children}</div>
        </details>
      </div>
    </div>
  );
}
