"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  fluide: { label: "Fluide", color: "var(--color-traffic-fluide)" },
  leger: { label: "Léger", color: "var(--color-traffic-leger)" },
  modere: { label: "Modéré", color: "var(--color-traffic-modere)" },
  dense: { label: "Dense", color: "var(--color-traffic-dense)" },
} satisfies ChartConfig;

const series = ["fluide", "leger", "modere", "dense"] as const;

export interface HourlyTrafficPoint {
  hour: string;
  fluide: number;
  leger: number;
  modere: number;
  dense: number;
}

export function TrafficAreaChart({ data }: { data: HourlyTrafficPoint[] }) {
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
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={32}
        />
        <ChartTooltip cursor content={<ChartTooltipContent indicator="dot" />} />
        {series.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stackId="traffic"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.85}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
