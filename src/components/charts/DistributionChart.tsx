"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DistributionData {
  category: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  data: DistributionData[];
  title: string;
  xLabel?: string;
  yLabel?: string;
  valueUnit?: string;
}

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export function DistributionChart({
  data,
  title,
  xLabel = "Category",
  yLabel = "Count",
  valueUnit = "",
}: DistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-sm text-slate-400">No data available for visualization</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ color?: string; name?: string; value?: number; payload?: DistributionData }> }) => {
    if (!active || !payload || payload.length === 0) return null;

    const firstItem = payload[0];
    if (!firstItem || typeof firstItem.payload !== "object" || firstItem.payload === null) {
      return null;
    }
    const chartDatum = firstItem.payload as DistributionData;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <p className="mb-1 text-sm font-medium text-white">{chartDatum.category}</p>
        <p className="text-xs text-slate-300">
          {yLabel}: <span className="font-semibold text-white">{chartDatum.value}{valueUnit}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-sm font-medium text-white">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="category"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: xLabel, position: "insideBottom", offset: -10, fill: "#94a3b8" }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
