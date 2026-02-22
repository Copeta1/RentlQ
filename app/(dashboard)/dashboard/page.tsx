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
import { Euro, Percent, Home, CalendarCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Query, type Models } from "appwrite";

interface Reservation extends Models.Document {
  checkIn: string;
  checkOut: string;
  price: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  reservations: number;
}

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalApartments, setTotalApartments] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
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

      // Calculate total revenue
      const revenue = reservations.reduce((sum, r) => sum + r.price, 0);

      // Calculate occupancy rate
      const occupancy = calculateOccupancyRate(reservations, apartmentCount);

      // Calculate monthly revenue
      const monthly = calculateMonthlyRevenue(reservations);

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

    // Count nights booked this month
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

    // Convert to array and sort by date
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

    // Get last 6 months
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
          title="Total Apartments"
          value={totalApartments}
          description={
            totalApartments === 0
              ? "Add your first apartment"
              : "Active properties"
          }
          icon={Home}
        />
        <StatsCard
          title="Reservations"
          value={totalReservations}
          description="All time"
          icon={CalendarCheck}
        />
      </div>

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? [`€${value.toFixed(2)}`, "Revenue"]
                      : ["€0.00", "Revenue"]
                  }
                  labelStyle={{ color: "#000" }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
