"use client";

import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

interface ScatterPoint {
  x: number;
  y: number;
  author?: string;
  prNumber?: number;
  title?: string;
}

interface ScatterChartProps {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  title: string;
  xUnit?: string;
  yUnit?: string;
}

export function ScatterChartViz({
  data,
  xLabel,
  yLabel,
  title,
  xUnit = "",
  yUnit = "",
}: ScatterChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-sm text-slate-400">No data available for visualization</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ color?: string; name?: string; value?: number; payload?: ScatterDataPoint }> }) => {
    if (!active || !payload || payload.length === 0) return null;

    const firstItem = payload[0];
    if (!firstItem || typeof firstItem.payload !== "object" || firstItem.payload === null) {
      return null;
    }
    const point = firstItem.payload as ScatterPoint;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <p className="mb-2 text-xs font-medium text-slate-400">{point.author || "Unknown"}</p>
        <div className="space-y-1 text-xs">
          <p className="text-slate-300">
            {xLabel}: <span className="font-semibold text-white">{point.x}{xUnit}</span>
          </p>
          <p className="text-slate-300">
            {yLabel}: <span className="font-semibold text-white">{point.y}{yUnit}</span>
          </p>
          {point.prNumber && (
            <p className="text-slate-400">PR #{point.prNumber}</p>
          )}
          {point.title && (
            <p className="mt-2 max-w-xs truncate text-slate-400" title={point.title}>
              {point.title}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-sm font-medium text-white">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatter margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            unit={xUnit}
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: xLabel, position: "insideBottom", offset: -10, fill: "#94a3b8" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            unit={yUnit}
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <ZAxis range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name={title}
            data={data}
            fill="#8b5cf6"
            fillOpacity={0.6}
            strokeWidth={1}
            stroke="#a78bfa"
          />
        </RechartsScatter>
      </ResponsiveContainer>
    </div>
  );
}
