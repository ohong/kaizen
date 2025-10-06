"use client";

import { useState } from "react";
import { WIDGET_DEFINITIONS, type WidgetType } from "@/lib/types/widgets";

interface WidgetCatalogProps {
  onAddWidget: (type: WidgetType) => void;
  enabledWidgetTypes: Set<WidgetType>;
}

export function WidgetCatalog({ onAddWidget, enabledWidgetTypes }: WidgetCatalogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "errors" | "workflow" | "benchmarks">("all");

  const categories = ["all", "errors", "workflow", "benchmarks"] as const;

  const filteredWidgets = Object.values(WIDGET_DEFINITIONS).filter(
    (def) => selectedCategory === "all" || def.category === selectedCategory
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hud-panel hud-corner flex items-center gap-2 px-4 py-2 text-sm text-[var(--hud-text)] hover:bg-[var(--hud-accent)]/10"
      >
        <span className="text-lg">+</span>
        <span>Add Widget</span>
      </button>
    );
  }

  return (
    <div className="hud-panel hud-corner p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--hud-text-bright)]">Widget Catalog</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] hover:bg-[var(--hud-accent)]/20"
        >
          ×
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-3 py-1 text-xs capitalize ${
              selectedCategory === cat
                ? "bg-[var(--hud-accent)]/20 text-[var(--hud-accent)]"
                : "text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredWidgets.map((def) => {
          const isEnabled = enabledWidgetTypes.has(def.type);
          return (
            <div
              key={def.type}
              className="hud-panel hud-corner flex flex-col gap-2 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[var(--hud-text-bright)]">{def.title}</h4>
                  <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{def.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded border border-[var(--hud-border)] px-2 py-0.5 text-[10px] uppercase text-[var(--hud-text-dim)]">
                      {def.category}
                    </span>
                    <span className="rounded border border-[var(--hud-border)] px-2 py-0.5 text-[10px] uppercase text-[var(--hud-text-dim)]">
                      {def.defaultSize}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onAddWidget(def.type);
                  setIsOpen(false);
                }}
                disabled={isEnabled}
                className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isEnabled
                    ? "cursor-not-allowed bg-[var(--hud-bg)] text-[var(--hud-text-dim)]"
                    : "bg-[var(--hud-accent)]/20 text-[var(--hud-accent)] hover:bg-[var(--hud-accent)]/30"
                }`}
              >
                {isEnabled ? "Already Added" : "Add Widget"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
