"use client";

import type { ScatterPoint } from "@/lib/metrics";
import { useWidgets } from "@/hooks/useWidgets";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetCatalog } from "./WidgetCatalog";
import {
  PRSizeVsTimeWidget,
  ReviewResponsivenessWidget,
  PRSizeDistributionWidget,
} from "./registry";

interface WidgetizedWorkflowSectionProps {
  sizeVsTimeData: ScatterPoint[];
  reviewVsMergeData: ScatterPoint[];
  prSizeDistribution: { category: string; value: number; color: string }[];
}

export function WidgetizedWorkflowSection({
  sizeVsTimeData,
  reviewVsMergeData,
  prSizeDistribution,
}: WidgetizedWorkflowSectionProps) {
  const {
    widgets,
    editMode,
    removeWidget,
    resizeWidget,
    reorderWidget,
    addWidget,
    resetWidgets,
    toggleEditMode,
  } = useWidgets("workflow");

  const enabledWidgetTypes = new Set(
    widgets
      .filter(
        (w) =>
          w.enabled &&
          (w.type === "pr-size-vs-time" ||
            w.type === "review-responsiveness" ||
            w.type === "pr-size-distribution")
      )
      .map((w) => w.type)
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Workflow signals</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEditMode}
            className={`rounded-lg px-3 py-1 text-xs ${
              editMode
                ? "bg-[var(--hud-accent)]/20 text-[var(--hud-accent)]"
                : "border border-[var(--hud-border)] text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
            }`}
          >
            {editMode ? "Done" : "Customize"}
          </button>
          {editMode && (
            <button
              onClick={resetWidgets}
              className="rounded-lg border border-[var(--hud-border)] px-3 py-1 text-xs text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mb-6">
          <WidgetCatalog onAddWidget={addWidget} enabledWidgetTypes={enabledWidgetTypes} />
        </div>
      )}

      <WidgetGrid
        widgets={widgets.filter(
          (w) =>
            w.type === "pr-size-vs-time" ||
            w.type === "review-responsiveness" ||
            w.type === "pr-size-distribution"
        )}
        onRemove={removeWidget}
        onResize={resizeWidget}
        onReorder={reorderWidget}
        editMode={editMode}
      >
        {(widget) => {
          switch (widget.type) {
            case "pr-size-vs-time":
              return <PRSizeVsTimeWidget sizeVsTimeData={sizeVsTimeData} />;
            case "review-responsiveness":
              return <ReviewResponsivenessWidget reviewVsMergeData={reviewVsMergeData} />;
            case "pr-size-distribution":
              return <PRSizeDistributionWidget prSizeDistribution={prSizeDistribution} />;
            default:
              return null;
          }
        }}
      </WidgetGrid>
    </section>
  );
}
