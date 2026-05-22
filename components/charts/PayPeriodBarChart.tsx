'use client';

import { BarChart } from '@mantine/charts';

type Point = {
  label: string;
  bills: number;
};

export function PayPeriodBarChart({ data }: { data: Point[] }) {
  return (
    <BarChart
      h={220}
      data={data}
      dataKey="label"
      series={[{ name: 'bills', color: 'teal.6', label: 'Bills due' }]}
      tickLine="y"
      withTooltip
      valueFormatter={(v) => `$${v.toFixed(0)}`}
    />
  );
}
