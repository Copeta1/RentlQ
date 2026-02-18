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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <p>Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="text-gray-600 mt-2">
          View and manage all your apartment reservations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredReservations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingReservations}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
          <CardDescription>
            {filteredReservations.length} reservation(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reservations found. Upload a CSV to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Guest Name</th>
                    <th className="pb-3 font-medium">Apartment</th>
                    <th className="pb-3 font-medium">Check-in</th>
                    <th className="pb-3 font-medium">Check-out</th>
                    <th className="pb-3 font-medium">Nights</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Platform</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr
                      key={reservation.$id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3">{reservation.guestName}</td>
                      <td className="py-3">
                        {getApartmentName(reservation.apartmentId)}
                      </td>
                      <td className="py-3">
                        {format(new Date(reservation.checkIn), "dd.MM.yyyy")}
                      </td>
                      <td className="py-3">
                        {format(new Date(reservation.checkOut), "dd.MM.yyyy")}
                      </td>
                      <td className="py-3">
                        {calculateNights(
                          reservation.checkIn,
                          reservation.checkOut,
                        )}
                      </td>
                      <td className="py-3 font-medium">€{reservation.price}</td>
                      <td className="py-3">{reservation.platform}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
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
        </CardContent>
      </Card>
    </div>
  );
}
