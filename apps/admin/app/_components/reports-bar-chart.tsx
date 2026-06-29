"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  rapports: { label: "Rapports", color: "var(--color-brand)" },
} satisfies ChartConfig;

export interface MonthlyReportsPoint {
  month: string;
  rapports: number;
}

export function ReportsBarChart({ data }: { data: MonthlyReportsPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          allowDecimals={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="rapports"
          fill="var(--color-rapports)"
          radius={[4, 4, 0, 0]}
          maxBarSize={72}
        />
      </BarChart>
    </ChartContainer>
  );
}
