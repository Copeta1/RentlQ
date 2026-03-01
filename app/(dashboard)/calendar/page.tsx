"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  RESERVATIONS_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Query } from "appwrite";
import type { Models } from "appwrite";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";

interface Reservation extends Models.Document {
  apartmentId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  price: number;
  status: string;
}

interface Unit extends Models.Document {
  name: string;
}

interface CalendarDay {
  date: Date;
  reservations: Reservation[];
  isCurrentMonth: boolean;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      const user = await account.get();

      const reservationsResponse = await databases.listDocuments(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );

      const unitsResponse = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [Query.equal("userId", user.$id), Query.isNotNull("propertyId")],
      );

      setReservations(
        reservationsResponse.documents as unknown as Reservation[],
      );
      setUnits(unitsResponse.documents as unknown as Unit[]);

      generateCalendar(
        reservationsResponse.documents as unknown as Reservation[],
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = (reservations: Reservation[]) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const calendar: CalendarDay[] = daysInMonth.map((date) => {
      const dayReservations = reservations.filter((reservation) => {
        const checkIn = parseISO(reservation.checkIn);
        const checkOut = parseISO(reservation.checkOut);

        return date >= checkIn && date < checkOut;
      });

      return {
        date,
        reservations: dayReservations,
        isCurrentMonth: isSameMonth(date, currentMonth),
      };
    });

    setCalendarDays(calendar);
  };

  const getUnitName = (apartmentId: string) => {
    const unit = units.find((u) => u.$id === apartmentId);
    return unit ? unit.name : "Unknown";
  };

  const getUnitColor = (apartmentId: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-green-100 text-green-800 border-green-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-orange-100 text-orange-800 border-orange-300",
      "bg-pink-100 text-pink-800 border-pink-300",
      "bg-indigo-100 text-indigo-800 border-indigo-300",
    ];

    const index = units.findIndex((u) => u.$id === apartmentId);
    return colors[index % colors.length];
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-600 mt-2">
            View all reservations in calendar format
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="mt-1"
              >
                Today
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-gray-600 p-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({
              length: (startOfMonth(currentMonth).getDay() + 6) % 7,
            }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px]" />
            ))}

            {calendarDays.map((day, index) => {
              const isToday = isSameDay(day.date, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border rounded-lg p-2 ${
                    isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  } ${!day.isCurrentMonth ? "opacity-50" : ""}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day.date, "d")}
                  </div>

                  <div className="space-y-1">
                    {day.reservations.map((reservation) => (
                      <div
                        key={reservation.$id}
                        className={`text-xs p-1 rounded border ${getUnitColor(
                          reservation.apartmentId,
                        )}`}
                        title={`${reservation.guestName} - ${getUnitName(
                          reservation.apartmentId,
                        )}`}
                      >
                        <div className="font-medium truncate">
                          {getUnitName(reservation.apartmentId)}
                        </div>
                        <div className="truncate">{reservation.guestName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
          <CardDescription>Units color coding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {units.map((unit) => (
              <div key={unit.$id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border ${getUnitColor(unit.$id)}`}
                />
                <span className="text-sm">{unit.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
