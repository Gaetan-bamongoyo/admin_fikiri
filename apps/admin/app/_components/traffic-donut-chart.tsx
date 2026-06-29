"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@fikiri/ui/components/chart";

const chartConfig = {
  value: { label: "Signalements" },
  fluide: { label: "Fluide", color: "var(--color-traffic-fluide)" },
  leger: { label: "Léger", color: "var(--color-traffic-leger)" },
  modere: { label: "Modéré", color: "var(--color-traffic-modere)" },
  dense: { label: "Dense", color: "var(--color-traffic-dense)" },
} satisfies ChartConfig;

const numberFormat = new Intl.NumberFormat("fr-FR");

export interface TrafficDonutPoint {
  level: string;
  label: string;
  count: number;
}

export function TrafficDonutChart({ data }: { data: TrafficDonutPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
      <ChartContainer
        config={chartConfig}
        className="aspect-square h-56 shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="level" hideLabel />}
          />
          <Pie
            data={data}
            dataKey="count"
            nameKey="level"
            innerRadius={68}
            outerRadius={96}
            paddingAngle={2}
            cornerRadius={6}
            stroke="var(--color-card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.level}
                fill={`var(--color-traffic-${entry.level})`}
              />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const { cx, cy } = viewBox;
                return (
                  <text x={cx} y={cy} textAnchor="middle">
                    <tspan
                      x={cx}
                      y={cy}
                      className="fill-foreground text-2xl font-semibold"
                    >
                      {numberFormat.format(total)}
                    </tspan>
                    <tspan
                      x={cx}
                      y={(cy ?? 0) + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      Signalements
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid w-full max-w-xs gap-4 sm:w-64">
        {data.map((entry) => {
          const pct = total ? Math.round((entry.count / total) * 100) : 0;
          return (
            <li key={entry.level} className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: `var(--color-traffic-${entry.level})`,
                  }}
                />
                <span className="text-muted-foreground">{entry.label}</span>
                <span className="ml-auto font-semibold text-foreground">
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `var(--color-traffic-${entry.level})`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {numberFormat.format(entry.count)} signalement
                {entry.count > 1 ? "s" : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
