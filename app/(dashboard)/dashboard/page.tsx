"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  RESERVATIONS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Euro, Percent, Home } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Query } from "appwrite";
import type { Models } from "appwrite";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { PlatformComparison } from "@/components/analytics/PlatformComparison";
import { OccupancyTrend } from "@/components/analytics/OccupancyTrend";
import { TopPerformingUnits } from "@/components/analytics/TopPerformingUnits";

interface Reservation extends Models.Document {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  price: number;
  platform: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  reservations: number;
}

interface PlatformData {
  name: string;
  revenue: number;
  bookings: number;
}

interface MonthlyOccupancy {
  month: string;
  occupancy: number;
}

interface UnitPerformance {
  unitName: string;
  revenue: number;
  bookings: number;
  adr: number;
}

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalApartments, setTotalApartments] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [totalADR, setTotalADR] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [occupancyTrend, setOccupancyTrend] = useState<MonthlyOccupancy[]>([]);
  const [unitPerformance, setUnitPerformance] = useState<UnitPerformance[]>([]);
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
      const apartmentCount = apartmentsResponse.total;
      const units = apartmentsResponse.documents;

      const revenue = reservations.reduce((sum, r) => sum + r.price, 0);
      const occupancy = calculateOccupancyRate(reservations, apartmentCount);
      const monthly = calculateMonthlyRevenue(reservations);

      calculatePlatformComparison(reservations);
      calculateOccupancyTrend(reservations, apartmentCount);
      calculateUnitPerformance(reservations, units);
      calculateADR(reservations);

      setTotalRevenue(revenue);
      setTotalReservations(reservations.length);
      setTotalApartments(apartmentCount);
      setOccupancyRate(occupancy);
      setMonthlyData(monthly);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOccupancyRate = (
    reservations: Reservation[],
    apartmentCount: number,
  ) => {
    if (apartmentCount === 0) return 0;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let bookedNights = 0;
    reservations.forEach((r) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);

      if (
        (checkIn.getFullYear() === currentYear &&
          checkIn.getMonth() === currentMonth) ||
        (checkOut.getFullYear() === currentYear &&
          checkOut.getMonth() === currentMonth)
      ) {
        const nights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
        bookedNights += nights;
      }
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalAvailableNights = daysInMonth * apartmentCount;

    return totalAvailableNights > 0
      ? (bookedNights / totalAvailableNights) * 100
      : 0;
  };

  const calculateMonthlyRevenue = (
    reservations: Reservation[],
  ): MonthlyData[] => {
    const monthlyMap: { [key: string]: { revenue: number; count: number } } =
      {};

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
      .map(([month, data]) => ({
        month: formatMonth(month),
        revenue: data.revenue,
        reservations: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    return monthlyArray.slice(-6);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const calculatePlatformComparison = (reservations: Reservation[]) => {
    const platformMap: {
      [key: string]: { revenue: number; bookings: number };
    } = {};

    reservations.forEach((r) => {
      const platform = r.platform || "Unknown";
      if (!platformMap[platform]) {
        platformMap[platform] = { revenue: 0, bookings: 0 };
      }
      platformMap[platform].revenue += r.price;
      platformMap[platform].bookings += 1;
    });

    const data: PlatformData[] = Object.entries(platformMap).map(
      ([name, stats]) => ({
        name,
        revenue: stats.revenue,
        bookings: stats.bookings,
      }),
    );

    setPlatformData(data);
  };

  const calculateOccupancyTrend = (
    reservations: Reservation[],
    unitCount: number,
  ) => {
    if (unitCount === 0) {
      setOccupancyTrend([]);
      return;
    }

    const monthlyMap: { [key: string]: number } = {};

    reservations.forEach((r) => {
      const checkIn = parseISO(r.checkIn);
      const checkOut = parseISO(r.checkOut);
      const nights = differenceInDays(checkOut, checkIn);

      const monthKey = format(checkIn, "yyyy-MM");
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + nights;
    });

    const trend: MonthlyOccupancy[] = Object.entries(monthlyMap)
      .map(([month, bookedNights]) => {
        const [year, monthNum] = month.split("-");
        const daysInMonth = new Date(
          parseInt(year),
          parseInt(monthNum),
          0,
        ).getDate();
        const totalAvailableNights = daysInMonth * unitCount;
        const occupancy = (bookedNights / totalAvailableNights) * 100;

        return {
          month: format(new Date(month), "MMM yyyy"),
          occupancy: Math.round(occupancy * 10) / 10,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    setOccupancyTrend(trend);
  };

  const calculateUnitPerformance = (
    reservations: Reservation[],
    units: Models.Document[],
  ) => {
    const unitMap: {
      [key: string]: { revenue: number; bookings: number; nights: number };
    } = {};

    reservations.forEach((r) => {
      if (!unitMap[r.apartmentId]) {
        unitMap[r.apartmentId] = { revenue: 0, bookings: 0, nights: 0 };
      }

      const checkIn = parseISO(r.checkIn);
      const checkOut = parseISO(r.checkOut);
      const nights = differenceInDays(checkOut, checkIn);

      unitMap[r.apartmentId].revenue += r.price;
      unitMap[r.apartmentId].bookings += 1;
      unitMap[r.apartmentId].nights += nights;
    });

    const performance: UnitPerformance[] = Object.entries(unitMap)
      .map(([unitId, stats]) => {
        const unit = units.find((u) => u.$id === unitId) as
          | { name: string }
          | undefined;
        const adr = stats.nights > 0 ? stats.revenue / stats.nights : 0;

        return {
          unitName: unit ? unit.name : "Unknown",
          revenue: stats.revenue,
          bookings: stats.bookings,
          adr: Math.round(adr * 100) / 100,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setUnitPerformance(performance);
  };

  const calculateADR = (reservations: Reservation[]) => {
    let totalRevenue = 0;
    let totalNights = 0;

    reservations.forEach((r) => {
      const checkIn = parseISO(r.checkIn);
      const checkOut = parseISO(r.checkOut);
      const nights = differenceInDays(checkOut, checkIn);

      totalRevenue += r.price;
      totalNights += nights;
    });

    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    setTotalADR(Math.round(adr * 100) / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your apartment analytics dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`€${totalRevenue.toFixed(2)}`}
          description={`From ${totalReservations} reservations`}
          icon={Euro}
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${occupancyRate.toFixed(1)}%`}
          description="This month"
          icon={Percent}
        />
        <StatsCard
          title="Total Units"
          value={totalApartments}
          description={
            totalApartments === 0 ? "Add your first unit" : "Active units"
          }
          icon={Home}
        />
        <StatsCard
          title="ADR"
          value={`€${totalADR.toFixed(2)}`}
          description="Avg. daily rate"
          icon={Euro}
        />
      </div>

      <RevenueChart data={monthlyData} />

      <div className="grid md:grid-cols-2 gap-8">
        <PlatformComparison data={platformData} />
        <OccupancyTrend data={occupancyTrend} />
      </div>

      <TopPerformingUnits data={unitPerformance} />

      {totalApartments === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Start by adding your first property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add a property (house/building), then add units
              (rooms/apartments), and upload reservations.
            </p>
            <div className="flex gap-4">
              <Link
                href="/properties/new"
                className="text-primary hover:underline"
              >
                Add Property →
              </Link>
              <Link href="/upload" className="text-primary hover:underline">
                Upload Reservations →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
