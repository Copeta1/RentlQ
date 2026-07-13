"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UnitPerformance {
  unitName: string;
  revenue: number;
  bookings: number;
  adr: number;
}

interface TopPerformingUnitsProps {
  data: UnitPerformance[];
}

export function TopPerformingUnits({ data }: TopPerformingUnitsProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Units</CardTitle>
        <CardDescription>Best units by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Unit</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">Bookings</th>
                <th className="pb-3 font-medium">ADR</th>
              </tr>
            </thead>
            <tbody>
              {data.map((unit, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <span
                      className={`font-bold ${index === 0 ? "text-yellow-600" : ""}`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{unit.unitName}</td>
                  <td className="py-3 text-green-600 font-semibold">
                    €{unit.revenue.toFixed(2)}
                  </td>
                  <td className="py-3">{unit.bookings}</td>
                  <td className="py-3">€{unit.adr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
