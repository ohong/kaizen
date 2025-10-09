"use client";

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarDataPoint {
  dimension: string;
  value: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  title: string;
  name?: string;
  color?: string;
}

export function RadarChartViz({
  data,
  name = "Score",
  color = "#8b5cf6",
}: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg)] p-8">
        <p className="text-sm text-[var(--hud-text-dim)]">No data available for visualization</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ color?: string; name?: string; value?: number; payload?: RadarDataPoint }> }) => {
    if (!active || !payload || payload.length === 0) return null;

    const firstItem = payload[0];
    if (!firstItem || typeof firstItem.payload !== "object" || firstItem.payload === null) {
      return null;
    }
    const point = firstItem.payload as RadarDataPoint;

    return (
      <div className="rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 shadow-lg">
        <p className="mb-1 font-mono text-xs font-semibold text-[var(--hud-text-bright)]">{point.dimension}</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
          Score: <span className="font-semibold text-[var(--hud-accent)]">{point.value}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <PolarGrid stroke="var(--hud-border)" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "var(--hud-text)", fontSize: 11, fontFamily: "Roboto Mono, monospace" }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              tickLine={false}
              axisLine={false}
            />
            <Radar
              name={name}
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
