"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  value: { label: "Incidents", color: "var(--color-brand)" },
} satisfies ChartConfig;

export interface IncidentTypePoint {
  type: string;
  value: number;
}

export function IncidentTypesChart({ data }: { data: IncidentTypePoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <RadarChart data={data} margin={{ top: 8, bottom: 8 }}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="type" />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="var(--color-brand)"
          fill="var(--color-brand)"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ChartContainer>
  );
}
