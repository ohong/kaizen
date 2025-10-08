"use client";

import { useState, useEffect, useCallback } from "react";
import type { WidgetConfig, WidgetSize } from "@/lib/types/widgets";
import { DEFAULT_WIDGET_CONFIGS } from "@/lib/types/widgets";

const STORAGE_KEY = "kaizen-widget-configs";

export function useWidgets(namespace: string = "default") {
  const storageKey = `${STORAGE_KEY}-${namespace}`;
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIGS);
  const [editMode, setEditMode] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as WidgetConfig[];
        const normalised = parsed.map((widget) =>
          widget.type === "recent-errors" || widget.type === "top-error-messages"
            ? { ...widget, size: widget.size === "full" ? "full" : "medium" }
            : widget
        );
        setWidgets(normalised);
      }
    } catch (error) {
      console.error("Failed to load widget config from localStorage:", error);
    }
  }, [storageKey]);

  // Save to localStorage whenever widgets change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch (error) {
      console.error("Failed to save widget config to localStorage:", error);
    }
  }, [widgets, storageKey]);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: false } : w)));
  }, []);

  const resizeWidget = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  const reorderWidget = useCallback((widgetId: string, direction: "up" | "down") => {
    setWidgets((prev) => {
      const enabledWidgets = prev.filter((w) => w.enabled);
      const currentIndex = enabledWidgets.findIndex((w) => w.id === widgetId);

      if (currentIndex === -1) return prev;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= enabledWidgets.length) return prev;

      const newOrder = [...enabledWidgets];
      [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

      // Reassign order values
      const reorderedWidgets = newOrder.map((w, idx) => ({ ...w, order: idx + 1 }));

      // Merge back with disabled widgets
      return prev.map((w) => {
        const found = reorderedWidgets.find((rw) => rw.id === w.id);
        return found || w;
      });
    });
  }, []);

  const addWidget = useCallback((type: WidgetConfig["type"]) => {
    setWidgets((prev) => {
      const existingWidget = prev.find((w) => w.type === type && !w.enabled);
      if (existingWidget) {
        return prev.map((w) => (w.id === existingWidget.id ? { ...w, enabled: true } : w));
      }

      const maxOrder = Math.max(...prev.map((w) => w.order), 0);
      const newWidget: WidgetConfig = {
        id: `w${Date.now()}`,
        type,
        title: type,
        size: "medium",
        order: maxOrder + 1,
        enabled: true,
      };

      return [...prev, newWidget];
    });
  }, []);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGET_CONFIGS);
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  return {
    widgets,
    editMode,
    removeWidget,
    resizeWidget,
    reorderWidget,
    addWidget,
    resetWidgets,
    toggleEditMode,
  };
}
