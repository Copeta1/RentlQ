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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
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
  guestName: string;
  checkIn: string;
  checkOut: string;
  price: number;
  platform: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReservation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty);
      setSelectedUnit("");
    } else {
      setUnits([]);
      setSelectedUnit("");
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
      complete: (results) => {
        const mapped = results.data.map((row) => ({
          guestName: row["Guest Name"] || row["guest_name"] || "",
          checkIn: row["Check-in"] || row["check_in"] || row["CheckIn"] || "",
          checkOut:
            row["Check-out"] || row["check_out"] || row["CheckOut"] || "",
          price: parseFloat(
            row["Price"] || row["price"] || row["Total"] || "0",
          ),
          platform: row["Platform"] || row["platform"] || "Unknown",
        }));

        setParsedData(mapped);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!selectedProperty) {
      setError("Please select a property");
      return;
    }

    if (!selectedUnit) {
      setError("Please select a unit");
      return;
    }

    if (parsedData.length === 0) {
      setError("No data to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const user = await account.get();

      const unit = units.find((u) => u.$id === selectedUnit);

      if (!unit) {
        setError("Unit not found");
        setUploading(false);
        return;
      }

      let reservationsToUpload = parsedData;

      if (
        unit.platform &&
        unit.platform !== "both" &&
        unit.platform !== "other"
      ) {
        reservationsToUpload = parsedData.filter((r) =>
          r.platform.toLowerCase().includes(unit.platform.toLowerCase()),
        );

        if (reservationsToUpload.length === 0) {
          setError(
            `No ${unit.platform} reservations found in CSV. ` +
              `This unit is configured for ${unit.platform} only.`,
          );
          setUploading(false);
          return;
        }

        if (reservationsToUpload.length < parsedData.length) {
          const skipped = parsedData.length - reservationsToUpload.length;
          alert(
            `Note: ${skipped} reservation(s) skipped because they don't match ` +
              `the unit platform (${unit.platform}).`,
          );
        }
      }

      // Upload each reservation
      for (const reservation of reservationsToUpload) {
        await databases.createDocument(
          DATABASE_ID,
          RESERVATIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            apartmentId: selectedUnit,
            guestName: reservation.guestName,
            checkIn: new Date(reservation.checkIn).toISOString(),
            checkOut: new Date(reservation.checkOut).toISOString(),
            price: reservation.price,
            platform: reservation.platform,
            status: "confirmed",
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
        <h2 className="text-2xl font-bold">Upload Successful!</h2>
        <p className="text-muted-foreground">
          Uploaded {parsedData.length} reservations
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Reservations</h1>
        <p className="text-gray-600 mt-2">
          Import reservations from Booking.com or Airbnb CSV export
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Property</CardTitle>
          <CardDescription>
            Choose which property these reservations belong to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
            >
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
              <p className="text-sm text-muted-foreground">
                No properties found. Please add a property first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProperty && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Unit</CardTitle>
            <CardDescription>
              Choose which unit (room/apartment) these reservations are for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.$id} value={unit.$id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {units.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No units found. Please add units to this property first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedUnit && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Upload CSV File</CardTitle>
            <CardDescription>
              Upload your CSV file from Booking.com or Airbnb
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer text-sm text-gray-600 hover:text-gray-900"
                >
                  <span className="text-primary font-medium">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </label>
                <p className="text-xs text-gray-500 mt-2">CSV files only</p>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {parsedData.length} reservations found
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Showing first 5 reservations from your CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2">Guest Name</th>
                    <th className="pb-2">Check-in</th>
                    <th className="pb-2">Check-out</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((reservation, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{reservation.guestName}</td>
                      <td className="py-2">{reservation.checkIn}</td>
                      <td className="py-2">{reservation.checkOut}</td>
                      <td className="py-2">€{reservation.price}</td>
                      <td className="py-2">{reservation.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {parsedData.length > 0 && (
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
            disabled={!selectedProperty || !selectedUnit || uploading}
            className="flex-1"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${parsedData.length} Reservations`}
          </Button>
        </div>
      )}
    </div>
  );
}
