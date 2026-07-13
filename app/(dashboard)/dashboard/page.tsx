"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  RESERVATIONS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { Euro, Percent, Home, Gauge } from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Query, type Models } from "appwrite";
import { format } from "date-fns";

interface Reservation extends Models.Document {
  guestName: string;
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  price: number;
  platform: string;
}

interface Apartment extends Models.Document {
  name: string;
}

interface MonthlyMetric {
  monthKey: string;
  month: string;
  revenue: number;
  reservations: number;
  occupancy: number;
}

interface TopUnit {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
  adr: number;
}

interface RecentReservation extends Reservation {
  unitName: string;
}

const AVATAR_COLORS = [
  "#2563eb",
  "#e11d48",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#0891b2",
];

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function getMonthlyOccupancy(
  reservations: Reservation[],
  apartmentCount: number,
  year: number,
  month: number,
) {
  if (apartmentCount === 0) return 0;

  let bookedNights = 0;
  reservations.forEach((r) => {
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    if (
      (checkIn.getFullYear() === year && checkIn.getMonth() === month) ||
      (checkOut.getFullYear() === year && checkOut.getMonth() === month)
    ) {
      bookedNights += nightsBetween(r.checkIn, r.checkOut);
    }
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalAvailableNights = daysInMonth * apartmentCount;

  return totalAvailableNights > 0
    ? (bookedNights / totalAvailableNights) * 100
    : 0;
}

function calculateMonthlyMetrics(
  reservations: Reservation[],
  apartmentCount: number,
): MonthlyMetric[] {
  const monthlyMap: { [key: string]: { revenue: number; count: number } } = {};

  reservations.forEach((r) => {
    const checkIn = new Date(r.checkIn);
    const monthKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { revenue: 0, count: 0 };
    }

    monthlyMap[monthKey].revenue += r.price;
    monthlyMap[monthKey].count += 1;
  });

  const monthlyArray = Object.entries(monthlyMap)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split("-").map(Number);
      return {
        monthKey,
        month: formatMonth(monthKey),
        revenue: data.revenue,
        reservations: data.count,
        occupancy: getMonthlyOccupancy(
          reservations,
          apartmentCount,
          year,
          month - 1,
        ),
      };
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  return monthlyArray.slice(-6);
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : null;
  return ((current - previous) / previous) * 100;
}

function calculateTopUnits(
  reservations: Reservation[],
  apartments: Apartment[],
): TopUnit[] {
  const stats = new Map<string, { revenue: number; bookings: number; nights: number }>();

  reservations.forEach((r) => {
    const current = stats.get(r.apartmentId) || {
      revenue: 0,
      bookings: 0,
      nights: 0,
    };
    current.revenue += r.price;
    current.bookings += 1;
    current.nights += nightsBetween(r.checkIn, r.checkOut);
    stats.set(r.apartmentId, current);
  });

  return Array.from(stats.entries())
    .map(([apartmentId, data]) => ({
      id: apartmentId,
      name: apartments.find((a) => a.$id === apartmentId)?.name || "Unknown unit",
      revenue: data.revenue,
      bookings: data.bookings,
      adr: data.nights > 0 ? data.revenue / data.nights : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalApartments, setTotalApartments] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetric[]>([]);
  const [topUnits, setTopUnits] = useState<TopUnit[]>([]);
  const [recentReservations, setRecentReservations] = useState<
    RecentReservation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const user = await account.get();

      const apartmentsResponse = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [Query.equal("userId", user.$id), Query.isNotNull("propertyId")],
      );

      const reservationsResponse = await databases.listDocuments(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );

      const reservations =
        reservationsResponse.documents as unknown as Reservation[];
      const apartments =
        apartmentsResponse.documents as unknown as Apartment[];
      const apartmentCount = apartmentsResponse.total;

      const revenue = reservations.reduce((sum, r) => sum + r.price, 0);
      const now = new Date();
      const occupancy = getMonthlyOccupancy(
        reservations,
        apartmentCount,
        now.getFullYear(),
        now.getMonth(),
      );
      const monthly = calculateMonthlyMetrics(reservations, apartmentCount);

      setTotalRevenue(revenue);
      setTotalReservations(reservations.length);
      setTotalApartments(apartmentCount);
      setOccupancyRate(occupancy);
      setMonthlyMetrics(monthly);
      setTopUnits(calculateTopUnits(reservations, apartments));
      setRecentReservations(
        [...reservations]
          .sort(
            (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
          )
          .slice(0, 5)
          .map((r) => ({
            ...r,
            unitName:
              apartments.find((a) => a.$id === r.apartmentId)?.name ||
              "Unknown unit",
          })),
      );
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  const thisMonth = monthlyMetrics[monthlyMetrics.length - 1];
  const lastMonth = monthlyMetrics[monthlyMetrics.length - 2];

  const revenueDelta = lastMonth
    ? percentDelta(thisMonth?.revenue ?? 0, lastMonth.revenue)
    : null;
  const occupancyDelta = lastMonth
    ? (thisMonth?.occupancy ?? 0) - lastMonth.occupancy
    : null;

  const thisMonthAdr =
    thisMonth && thisMonth.reservations > 0
      ? thisMonth.revenue / thisMonth.reservations
      : 0;
  const lastMonthAdr =
    lastMonth && lastMonth.reservations > 0
      ? lastMonth.revenue / lastMonth.reservations
      : 0;
  const adrDelta = lastMonth ? percentDelta(thisMonthAdr, lastMonthAdr) : null;
  const avgDailyRate =
    totalReservations > 0 ? totalRevenue / totalReservations : 0;

  const kpis = [
    {
      label: "Total Revenue",
      value: `€${totalRevenue.toFixed(2)}`,
      icon: Euro,
      iconBg: "bg-blue-50",
      delta: revenueDelta,
      deltaSuffix: "%",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate.toFixed(0)}%`,
      icon: Percent,
      iconBg: "bg-green-50",
      delta: occupancyDelta,
      deltaSuffix: "%",
    },
    {
      label: "Total Units",
      value: totalApartments,
      icon: Home,
      iconBg: "bg-amber-50",
      delta: null,
      neutralLabel:
        totalApartments === 0 ? "Add your first unit" : "Active units",
    },
    {
      label: "Avg. Daily Rate",
      value: `€${avgDailyRate.toFixed(2)}`,
      icon: Gauge,
      iconBg: "bg-purple-50",
      delta: adrDelta,
      deltaSuffix: "%",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-slate-500">
          Overview of your rental performance
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isUp = (kpi.delta ?? 0) >= 0;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
                  {kpi.label}
                </div>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.iconBg}`}
                >
                  <Icon className="h-4 w-4 text-slate-700" />
                </div>
              </div>
              <div className="mb-2 text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-900">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1.5 text-[0.75rem]">
                {kpi.delta !== null && kpi.delta !== undefined ? (
                  <>
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold ${
                        isUp
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {isUp ? "↑" : "↓"} {Math.abs(kpi.delta).toFixed(1)}
                      {kpi.deltaSuffix}
                    </span>
                    <span className="text-slate-400">vs last month</span>
                  </>
                ) : (
                  <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-500">
                    {kpi.neutralLabel ?? "No data yet"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="text-[0.9rem] font-bold text-slate-900">
                Revenue Overview
              </div>
              <div className="mt-0.5 text-[0.75rem] text-slate-400">
                Monthly revenue for the last {monthlyMetrics.length || 6} months
              </div>
            </div>
            {thisMonth && (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-[0.7rem] font-semibold text-blue-700">
                €{thisMonth.revenue.toFixed(0)} this month
              </span>
            )}
          </div>
          {monthlyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyMetrics}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(value: number | undefined) => [
                    `€${(value ?? 0).toFixed(2)}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {monthlyMetrics.map((entry, index) => (
                    <Cell
                      key={entry.monthKey}
                      fill={
                        index === monthlyMetrics.length - 1
                          ? "#2563eb"
                          : "#bfdbfe"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-50 items-center justify-center text-sm text-slate-400">
              No revenue data yet
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Occupancy Trend
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Monthly occupancy rate
            </div>
          </div>
          {monthlyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyMetrics}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toFixed(1)}%`,
                    "Occupancy",
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-50 items-center justify-center text-sm text-slate-400">
              No occupancy data yet
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TOP UNITS */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Top Performing Units
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Best units by revenue
            </div>
          </div>
          {topUnits.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No reservations yet.{" "}
              <Link href="/upload" className="text-blue-600 hover:underline">
                Upload a CSV
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Rank
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Unit
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Revenue
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Bookings
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    ADR
                  </th>
                </tr>
              </thead>
              <tbody>
                {topUnits.map((unit, index) => (
                  <tr
                    key={unit.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-5.5 w-5.5 items-center justify-center rounded-md text-[0.7rem] font-extrabold ${
                          index === 0
                            ? "bg-amber-50 text-amber-700"
                            : index === 1
                              ? "bg-slate-100 text-slate-600"
                              : index === 2
                                ? "bg-orange-50 text-orange-700"
                                : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] font-semibold text-slate-800">
                      {unit.name}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] font-bold text-green-600">
                      €{unit.revenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {unit.bookings}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      €{unit.adr.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RECENT RESERVATIONS */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Recent Reservations
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Latest bookings across all units
            </div>
          </div>
          {recentReservations.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No reservations yet.{" "}
              <Link href="/upload" className="text-blue-600 hover:underline">
                Upload a CSV
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div className="py-1">
              {recentReservations.map((reservation) => (
                <div
                  key={reservation.$id}
                  className="flex items-center gap-3 border-b border-slate-100 px-5 py-2.5 last:border-b-0 hover:bg-slate-50"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold text-white"
                    style={{ background: avatarColor(reservation.guestName) }}
                  >
                    {getInitials(reservation.guestName)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[0.82rem] font-semibold text-slate-900">
                      {reservation.guestName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.72rem] text-slate-400">
                      <span className="truncate">{reservation.unitName}</span>
                      <span
                        className={`shrink-0 rounded px-1 py-0.5 text-[0.65rem] font-semibold ${
                          reservation.platform?.toLowerCase().includes("airbnb")
                            ? "bg-rose-50 text-rose-600"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {reservation.platform || "Other"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 text-right">
                    <div className="text-[0.82rem] font-bold text-slate-900">
                      €{reservation.price.toFixed(2)}
                    </div>
                    <div className="text-[0.7rem] text-slate-400">
                      {format(new Date(reservation.checkIn), "MMM d")}–
                      {format(new Date(reservation.checkOut), "d")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalApartments === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 text-[0.95rem] font-bold text-slate-900">
            Get Started
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Add a property (house/building), then add units (rooms/apartments),
            and upload reservations.
          </p>
          <div className="flex gap-4">
            <Link
              href="/properties/new"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Add Property →
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Upload Reservations →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
