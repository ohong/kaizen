"use client";

import { type ReactNode } from "react";
import type { WidgetConfig, WidgetSize } from "@/lib/types/widgets";
import { WidgetWrapper } from "./WidgetWrapper";

interface WidgetGridProps {
  widgets: WidgetConfig[];
  children: (widget: WidgetConfig) => ReactNode;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetSize) => void;
  onReorder?: (widgetId: string, direction: "up" | "down") => void;
  editMode?: boolean;
}

export function WidgetGrid({
  widgets,
  children,
  onRemove,
  onResize,
  onReorder,
  editMode = false,
}: WidgetGridProps) {
  const sortedWidgets = [...widgets]
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  const handleMoveUp = (id: string) => {
    if (onReorder) onReorder(id, "up");
  };

  const handleMoveDown = (id: string) => {
    if (onReorder) onReorder(id, "down");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {sortedWidgets.map((widget, index) => (
        <WidgetWrapper
          key={widget.id}
          widget={widget}
          onRemove={onRemove}
          onResize={onResize}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          canMoveUp={index > 0}
          canMoveDown={index < sortedWidgets.length - 1}
          editMode={editMode}
        >
          {children(widget)}
        </WidgetWrapper>
      ))}
    </div>
  );
}
