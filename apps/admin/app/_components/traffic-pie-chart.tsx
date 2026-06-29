"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  value: { label: "Part" },
  fluide: { label: "Fluide", color: "var(--color-traffic-fluide)" },
  leger: { label: "Léger", color: "var(--color-traffic-leger)" },
  modere: { label: "Modéré", color: "var(--color-traffic-modere)" },
  dense: { label: "Dense", color: "var(--color-traffic-dense)" },
} satisfies ChartConfig;

const RADIAN = Math.PI / 180;

interface SliceLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  index: number;
}

export interface TrafficSharePoint {
  level: string;
  label: string;
  value: number;
}

export function TrafficPieChart({ data }: { data: TrafficSharePoint[] }) {
  function renderLabel(props: unknown) {
    const { cx, cy, midAngle, outerRadius, index } = props as SliceLabelProps;
    const slice = data[index];
    const radius = outerRadius + 26;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={`var(--color-traffic-${slice.level})`}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${slice.label} ${slice.value}%`}
      </text>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-72">
      <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="level" hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="level"
          outerRadius={92}
          paddingAngle={1}
          stroke="var(--color-card)"
          strokeWidth={2}
          labelLine={false}
          label={renderLabel}
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.level}
              fill={`var(--color-traffic-${entry.level})`}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
