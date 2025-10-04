"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface ComparisonData {
  name: string;
  yourTeam: number;
  industryMedian: number;
  topPerformer?: number;
}

interface ComparisonBarChartProps {
  data: ComparisonData[];
  title: string;
  yLabel?: string;
  valueUnit?: string;
  lowerIsBetter?: boolean;
}

export function ComparisonBarChart({
  data,
  title,
  yLabel = "Value",
  valueUnit = "",
  lowerIsBetter = false,
}: ComparisonBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-sm text-slate-400">No data available for comparison</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium text-white">{label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-300">
              <span style={{ color: entry.color }}>●</span> {entry.name}:{" "}
              <span className="font-semibold text-white">
                {entry.value.toFixed(1)}{valueUnit}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-sm font-medium text-white">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
            iconType="circle"
          />
          <Bar
            dataKey="yourTeam"
            fill="#8b5cf6"
            name="Your Team"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="industryMedian"
            fill="#3b82f6"
            name="Industry Median"
            radius={[4, 4, 0, 0]}
          />
          {data.some(d => d.topPerformer !== undefined) && (
            <Bar
              dataKey="topPerformer"
              fill="#10b981"
              name="Top Performer"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
        {lowerIsBetter ? (
          <p>↓ Lower is better</p>
        ) : (
          <p>↑ Higher is better</p>
        )}
      </div>
    </div>
  );
}
