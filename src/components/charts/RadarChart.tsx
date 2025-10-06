"use client";

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
  title,
  name = "Score",
  color = "#8b5cf6",
}: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-sm text-slate-400">No data available for visualization</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <p className="mb-1 text-sm font-medium text-white">{data.dimension}</p>
        <p className="text-xs text-slate-300">
          Score: <span className="font-semibold text-white">{data.value} / {data.fullMark}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-center text-sm font-medium text-white">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Radar
            name={name}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
            data={data}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#94a3b8" }} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
