"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyOccupancy {
  month: string;
  occupancy: number;
}

interface OccupancyTrendProps {
  data: MonthlyOccupancy[];
}

export function OccupancyTrend({ data }: OccupancyTrendProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Trend</CardTitle>
        <CardDescription>Monthly occupancy rate</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => {
                const num = Number(value) || 0;
                return `${num}%`;
              }}
            />
            <Line
              type="monotone"
              dataKey="occupancy"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
