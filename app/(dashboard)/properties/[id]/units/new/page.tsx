"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  PROPERTIES_COLLECTION_ID,
  ID,
  account,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Models } from "appwrite";

interface Property extends Models.Document {
  name: string;
}

export default function NewUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [bookingIdentifier, setBookingIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        PROPERTIES_COLLECTION_ID,
        propertyId,
      );
      setProperty(doc as unknown as Property);
    } catch (error) {
      console.error("Failed to fetch property:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await account.get();

      await databases.createDocument(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          propertyId: propertyId,
          name,
          location: property?.name || "",
          platform,
          bookingIdentifier,
        },
      );

      router.push(`/properties/${propertyId}/units`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create unit");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/properties/${propertyId}/units`}
          className="text-primary hover:underline flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Units
        </Link>

        <h1 className="text-3xl font-bold">Add New Unit</h1>
        <p className="text-gray-600 mt-2">
          Add a room or apartment to {property.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unit Details</CardTitle>
          <CardDescription>Enter information about this unit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Unit Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Room 1, Studio A, Apartment 2B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookingIdentifier">Booking.com Identifier</Label>
              <Input
                id="bookingIdentifier"
                type="text"
                placeholder="e.g., Deluxe Suite, Double Room"
                value={bookingIdentifier}
                onChange={(e) => setBookingIdentifier(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How this unit appears in Booking.com CSV exports (Room/Unit
                column)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/properties/${propertyId}/units`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Unit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
