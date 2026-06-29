"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  reports: { label: "Rapports", color: "var(--color-brand)" },
} satisfies ChartConfig;

export interface TopLocationPoint {
  name: string;
  reports: number;
}

export function TopLocationsChart({ data }: { data: TopLocationPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="4 4" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={130}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="reports"
          fill="var(--color-reports)"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  );
}
