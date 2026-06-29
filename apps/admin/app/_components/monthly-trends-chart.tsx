"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  reports: { label: "Rapports", color: "var(--color-brand)" },
  trafficReports: {
    label: "Signalements trafic",
    color: "var(--color-traffic-modere)",
  },
  newUsers: {
    label: "Nouveaux utilisateurs",
    color: "var(--color-traffic-leger)",
  },
} satisfies ChartConfig;

const series = ["reports", "trafficReports", "newUsers"] as const;

export interface MonthlyTrendPoint {
  month: string;
  reports: number;
  trafficReports: number;
  newUsers: number;
}

export function MonthlyTrendsChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
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
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-card)" }}
            activeDot={{ r: 5 }}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}
