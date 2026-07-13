"use client";

import { useEffect, useState, useCallback } from "react";
import {
  databases,
  DATABASE_ID,
  RESERVATIONS_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Query, type Models } from "appwrite";
import { format } from "date-fns";

interface Reservation extends Models.Document {
  userId: string;
  apartmentId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  price: number;
  platform: string;
  status: string;
}

interface Apartment extends Models.Document {
  name: string;
  location: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [selectedApartment, setSelectedApartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const filterReservations = useCallback(() => {
    let filtered = [...reservations];

    if (selectedApartment !== "all") {
      filtered = filtered.filter((r) => r.apartmentId === selectedApartment);
    }

    if (searchQuery) {
      filtered = filtered.filter((r) =>
        r.guestName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, selectedApartment, searchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [filterReservations]);

  const fetchData = async () => {
    try {
      const user = await account.get();

      const reservationsResponse = await databases.listDocuments(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );

      const apartmentsResponse = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );

      setReservations(
        reservationsResponse.documents as unknown as Reservation[],
      );
      setApartments(apartmentsResponse.documents as unknown as Apartment[]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getApartmentName = (apartmentId: string) => {
    const apartment = apartments.find((a) => a.$id === apartmentId);
    return apartment ? apartment.name : "Unknown";
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalRevenue = filteredReservations.reduce(
    (sum, r) => sum + r.price,
    0,
  );
  const upcomingReservations = filteredReservations.filter(
    (r) => new Date(r.checkIn) > new Date(),
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-sm text-slate-500">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
          Reservations
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-slate-500">
          View and manage all your apartment reservations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
            Total Reservations
          </div>
          <div className="text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-900">
            {filteredReservations.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
            Total Revenue
          </div>
          <div className="text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-900">
            €{totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
            Upcoming
          </div>
          <div className="text-[1.65rem] font-extrabold leading-none tracking-tight text-slate-900">
            {upcomingReservations}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 text-[0.9rem] font-bold text-slate-900">
          Filters
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Apartment</Label>
            <Select
              value={selectedApartment}
              onValueChange={setSelectedApartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="All apartments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apartments</SelectItem>
                {apartments.map((apt) => (
                  <SelectItem key={apt.$id} value={apt.$id}>
                    {apt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Search Guest</Label>
            <Input
              placeholder="Search by guest name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="text-[0.9rem] font-bold text-slate-900">
            All Reservations
          </div>
          <div className="mt-0.5 text-[0.75rem] text-slate-400">
            {filteredReservations.length} reservation(s) found
          </div>
        </div>
        {filteredReservations.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No reservations found. Upload a CSV to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Guest Name
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Apartment
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Check-in
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Check-out
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Nights
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Price
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Platform
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.$id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-[0.82rem] font-semibold text-slate-800">
                      {reservation.guestName}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {getApartmentName(reservation.apartmentId)}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {format(new Date(reservation.checkIn), "dd.MM.yyyy")}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {format(new Date(reservation.checkOut), "dd.MM.yyyy")}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {calculateNights(
                        reservation.checkIn,
                        reservation.checkOut,
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] font-bold text-green-600">
                      €{reservation.price}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem]">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[0.7rem] font-semibold ${
                          reservation.platform
                            ?.toLowerCase()
                            .includes("airbnb")
                            ? "bg-rose-50 text-rose-600"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {reservation.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[0.7rem] font-semibold ${
                          reservation.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
