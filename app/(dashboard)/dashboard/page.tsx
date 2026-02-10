import { StatsCard } from "@/components/dashboard/StatsCard";
import { Euro, Percent, Home, CalendarCheck } from "lucide-react";

export default function DashboardPage() {
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
          value="€0"
          description="No data yet"
          icon={Euro}
        />
        <StatsCard
          title="Occupancy Rate"
          value="0%"
          description="No data yet"
          icon={Percent}
        />
        <StatsCard
          title="Total Apartments"
          value={0}
          description="Add your first apartment"
          icon={Home}
        />
        <StatsCard
          title="Reservations"
          value={0}
          description="No reservations yet"
          icon={CalendarCheck}
        />
      </div>
    </div>
  );
}
