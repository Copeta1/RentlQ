"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  RESERVATIONS_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
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

const UNIT_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
    const index = units.findIndex((u) => u.$id === apartmentId);
    return UNIT_COLORS[index % UNIT_COLORS.length];
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
      <div className="flex items-center justify-center min-h-100">
        <p className="text-sm text-slate-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
          Calendar
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-slate-500">
          View all reservations in calendar format
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-center">
            <div className="text-[0.95rem] font-bold text-slate-900">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button
              onClick={handleToday}
              className="mt-0.5 text-[0.75rem] font-medium text-blue-600 hover:underline"
            >
              Today
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-[0.7rem] font-bold uppercase tracking-wide text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({
            length: (startOfMonth(currentMonth).getDay() + 6) % 7,
          }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-30" />
          ))}

          {calendarDays.map((day, index) => {
            const isToday = isSameDay(day.date, new Date());

            return (
              <div
                key={index}
                className={`min-h-30 rounded-lg border p-2 ${
                  isToday
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-100"
                } ${!day.isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className="mb-1 text-[0.78rem] font-semibold text-slate-700">
                  {format(day.date, "d")}
                </div>

                <div className="space-y-1">
                  {day.reservations.map((reservation) => (
                    <div
                      key={reservation.$id}
                      className={`rounded border px-1.5 py-1 text-[0.68rem] ${getUnitColor(
                        reservation.apartmentId,
                      )}`}
                      title={`${reservation.guestName} - ${getUnitName(
                        reservation.apartmentId,
                      )}`}
                    >
                      <div className="truncate font-semibold">
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
      </div>

      {units.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Legend
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Units color coding
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {units.map((unit) => (
              <div key={unit.$id} className="flex items-center gap-2">
                <div
                  className={`h-3.5 w-3.5 rounded border ${getUnitColor(unit.$id)}`}
                />
                <span className="text-[0.8rem] text-slate-600">
                  {unit.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
