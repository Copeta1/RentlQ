"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  RESERVATIONS_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  PROPERTIES_COLLECTION_ID,
  ID,
} from "@/lib/appwrite";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import type { Models } from "appwrite";
import { Query } from "appwrite";

interface Property extends Models.Document {
  name: string;
  location: string;
}

interface Unit extends Models.Document {
  name: string;
  propertyId: string;
  platform: string;
  bookingIdentifier?: string;
}

interface ParsedReservation {
  bookingNumber: string;
  status: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomUnit: string;
  price: number;
  bookingDate: string;
  matchedUnit?: string; // Unit ID that was matched
}

export default function UploadPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReservation[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty);
    } else {
      setUnits([]);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        DATABASE_ID,
        PROPERTIES_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );
      setProperties(response.documents as unknown as Property[]);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.equal("propertyId", propertyId),
        ],
      );
      setUnits(response.documents as unknown as Unit[]);
    } catch (error) {
      console.error("Failed to fetch units:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      beforeFirstChunk: (chunk) => {
        const lines = chunk.split("\n");
        if (lines[0].trim() === ";;;;;;;" || lines[0].trim().match(/^;+$/)) {
          return lines.slice(1).join("\n");
        }
        return chunk;
      },
      complete: (results) => {
        const mapped = results.data.map((row) => ({
          bookingNumber: row["Booking Number"] || row["booking_number"] || "",
          status: row["Status"] || row["status"] || "Confirmed",
          guestName:
            row["Guest Name"] || row["guest_name"] || row["Guest"] || "",
          checkIn: row["Check-in"] || row["check_in"] || row["CheckIn"] || "",
          checkOut:
            row["Check-out"] || row["check_out"] || row["CheckOut"] || "",
          roomUnit:
            row["Room/Unit"] || row["room_unit"] || row["Room Type"] || "",
          price: parseFloat(
            row["Price"] || row["price"] || row["Total"] || "0",
          ),
          bookingDate: row["Booking Date"] || row["booking_date"] || "",
        }));

        setParsedData(mapped);
        matchReservationsWithUnits(mapped);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const matchReservationsWithUnits = (reservations: ParsedReservation[]) => {
    let matched = 0;
    let unmatched = 0;

    const matchedReservations = reservations.map((reservation) => {
      // Try to find matching unit by bookingIdentifier
      const matchedUnit = units.find(
        (unit) =>
          unit.bookingIdentifier &&
          unit.bookingIdentifier.toLowerCase().trim() ===
            reservation.roomUnit.toLowerCase().trim(),
      );

      if (matchedUnit) {
        matched++;
        return { ...reservation, matchedUnit: matchedUnit.$id };
      } else {
        unmatched++;
        return reservation;
      }
    });

    setParsedData(matchedReservations);
    setMatchedCount(matched);
    setUnmatchedCount(unmatched);
  };

  useEffect(() => {
    if (parsedData.length > 0 && units.length > 0) {
      matchReservationsWithUnits(parsedData);
    }
  }, [units]);

  const handleUpload = async () => {
    if (!selectedProperty) {
      setError("Please select a property");
      return;
    }

    if (parsedData.length === 0) {
      setError("No data to upload");
      return;
    }

    if (matchedCount === 0) {
      setError(
        "No reservations could be matched with units. Please check your Booking.com Identifiers.",
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const user = await account.get();

      // Only upload matched reservations
      const matchedReservations = parsedData.filter((r) => r.matchedUnit);

      for (const reservation of matchedReservations) {
        await databases.createDocument(
          DATABASE_ID,
          RESERVATIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            apartmentId: reservation.matchedUnit!,
            guestName: reservation.guestName,
            checkIn: new Date(reservation.checkIn).toISOString(),
            checkOut: new Date(reservation.checkOut).toISOString(),
            price: reservation.price,
            platform: "Booking.com",
            status: reservation.status.toLowerCase(),
          },
        );
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to upload reservations");
      }
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-slate-900">
          Upload Successful!
        </h2>
        <p className="text-sm text-slate-500">
          Uploaded {matchedCount} reservations
        </p>
        {unmatchedCount > 0 && (
          <p className="text-sm text-orange-600">
            {unmatchedCount} reservations were skipped (no matching unit found)
          </p>
        )}
        <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
          Upload Reservations
        </h1>
        <p className="mt-0.5 text-[0.83rem] text-slate-500">
          Import reservations from Booking.com CSV export
        </p>
      </div>

      {/* Step 1: Select Property */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <div className="text-[0.9rem] font-bold text-slate-900">
            Step 1: Select Property
          </div>
          <div className="mt-0.5 text-[0.75rem] text-slate-400">
            Choose which property these reservations belong to
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="property">Property</Label>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger>
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.$id} value={property.$id}>
                  {property.name} - {property.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {properties.length === 0 && (
            <p className="text-sm text-slate-400">
              No properties found. Please add a property first.
            </p>
          )}
        </div>
      </div>

      {/* Step 2: Upload CSV */}
      {selectedProperty && units.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Step 2: Upload Booking.com CSV
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Upload your CSV file exported from Booking.com
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-sm text-slate-500 hover:text-slate-900"
              >
                <span className="font-semibold text-blue-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </label>
              <p className="mt-2 text-xs text-slate-400">
                CSV files only (semicolon-separated)
              </p>
            </div>

            {file && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">
                    {file.name}
                  </span>
                </div>

                {/* Match Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Matched
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {matchedCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          Unmatched
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {unmatchedCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {unmatchedCount > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Note:</strong> {unmatchedCount} reservation(s)
                      could not be matched with any unit. Make sure the
                      Booking.com Identifier in your units matches the
                      Room/Unit column in the CSV.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProperty && units.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-[0.9rem] font-bold text-slate-900">
            No Units Found
          </div>
          <p className="mt-0.5 text-[0.75rem] text-slate-400">
            Please add units to this property before uploading reservations.
          </p>
        </div>
      )}

      {/* Preview */}
      {parsedData.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-[0.9rem] font-bold text-slate-900">
              Preview
            </div>
            <div className="mt-0.5 text-[0.75rem] text-slate-400">
              Showing first 5 reservations with match status
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Guest
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Room/Unit
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Check-in
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Price
                  </th>
                  <th className="border-b border-slate-100 px-4 py-2.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((reservation, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-[0.82rem] font-semibold text-slate-800">
                      {reservation.guestName}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {reservation.roomUnit}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      {reservation.checkIn}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-slate-700">
                      €{reservation.price}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem]">
                      {reservation.matchedUnit ? (
                        <span className="font-medium text-green-600">
                          ✓ Matched
                        </span>
                      ) : (
                        <span className="font-medium text-orange-600">
                          ✗ Not matched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {parsedData.length > 0 && matchedCount > 0 && (
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedProperty || uploading}
            className="flex-1"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${matchedCount} Matched Reservations`}
          </Button>
        </div>
      )}
    </div>
  );
}
