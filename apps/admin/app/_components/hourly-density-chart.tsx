"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  niveau: { label: "Signalements", color: "var(--color-traffic-leger)" },
} satisfies ChartConfig;

export interface HourlyDensityPoint {
  hour: string;
  niveau: number;
}

export function HourlyDensityChart({ data }: { data: HourlyDensityPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip cursor content={<ChartTooltipContent indicator="dot" />} />
        <Area
          dataKey="niveau"
          type="monotone"
          stroke="var(--color-niveau)"
          fill="var(--color-niveau)"
          fillOpacity={0.4}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
