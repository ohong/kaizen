"use client";

import type { ComparisonInsight } from "@/lib/metrics";
import { useWidgets } from "@/hooks/useWidgets";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetCatalog } from "./WidgetCatalog";
import {
  CycleTimeBenchmarkWidget,
  QualityBenchmarkWidget,
  BenchmarkInsightsWidget,
} from "./registry";

interface WidgetizedBenchmarksSectionProps {
  speedData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  qualityData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  insights: ComparisonInsight[];
}

export function WidgetizedBenchmarksSection({
  speedData,
  qualityData,
  insights,
}: WidgetizedBenchmarksSectionProps) {
  const {
    widgets,
    editMode,
    removeWidget,
    resizeWidget,
    reorderWidget,
    addWidget,
    resetWidgets,
    toggleEditMode,
  } = useWidgets("benchmarks");

  const enabledWidgetTypes = new Set(
    widgets
      .filter(
        (w) =>
          w.enabled &&
          (w.type === "cycle-time-benchmark" ||
            w.type === "quality-benchmark" ||
            w.type === "benchmark-insights")
      )
      .map((w) => w.type)
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Benchmarks</h2>
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
            w.type === "cycle-time-benchmark" ||
            w.type === "quality-benchmark" ||
            w.type === "benchmark-insights"
        )}
        onRemove={removeWidget}
        onResize={resizeWidget}
        onReorder={reorderWidget}
        editMode={editMode}
      >
        {(widget) => {
          switch (widget.type) {
            case "cycle-time-benchmark":
              return <CycleTimeBenchmarkWidget speedData={speedData} />;
            case "quality-benchmark":
              return <QualityBenchmarkWidget qualityData={qualityData} />;
            case "benchmark-insights":
              return <BenchmarkInsightsWidget insights={insights} />;
            default:
              return null;
          }
        }}
      </WidgetGrid>
    </section>
  );
}
