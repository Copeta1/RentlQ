"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  RESERVATIONS_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
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

interface Apartment extends Models.Document {
  name: string;
  location: string;
  platform: string;
  userId: string;
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
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReservation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
      );
      setApartments(response.documents as unknown as Apartment[]);
    } catch (error) {
      console.error("Failed to fetch apartments:", error);
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
    if (!selectedApartment) {
      setError("Please select an apartment");
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

      for (const reservation of parsedData) {
        await databases.createDocument(
          DATABASE_ID,
          RESERVATIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            apartmentId: selectedApartment,
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
          <CardTitle>Step 1: Select Apartment</CardTitle>
          <CardDescription>
            Choose which apartment these reservations belong to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="apartment">Apartment</Label>
            <Select
              value={selectedApartment}
              onValueChange={setSelectedApartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an apartment" />
              </SelectTrigger>
              <SelectContent>
                {apartments.map((apt) => (
                  <SelectItem key={apt.$id} value={apt.$id}>
                    {apt.name} - {apt.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {apartments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No apartments found. Please add an apartment first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/*Upload CSV*/}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Upload CSV File</CardTitle>
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
          disabled={!selectedApartment || parsedData.length === 0 || uploading}
          className="flex-1"
        >
          {uploading
            ? "Uploading..."
            : `Upload ${parsedData.length} Reservations`}
        </Button>
      </div>
    </div>
  );
}
