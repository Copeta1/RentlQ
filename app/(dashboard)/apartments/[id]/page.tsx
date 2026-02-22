"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  RESERVATIONS_COLLECTION_ID,
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
import { Trash2 } from "lucide-react";
import { Query, type Models } from "appwrite";

interface Apartment extends Models.Document {
  name: string;
  location: string;
  platform: string;
  userId: string;
  bookingIdentifier?: string;
}

export default function ApartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = params.id as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingIdentifier, setBookingIdentifier] = useState("");

  useEffect(() => {
    fetchApartment();
  }, [apartmentId]);

  const fetchApartment = async () => {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        apartmentId,
      );
      const apt = doc as unknown as Apartment;
      setApartment(apt);
      setName(apt.name);
      setLocation(apt.location);
      setPlatform(apt.platform || "");
      setBookingIdentifier(apt.bookingIdentifier || "");
    } catch (error) {
      console.error("Failed to fetch apartment:", error);
      setError("Failed to load apartment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await databases.updateDocument(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        apartmentId,
        { name, location, platform, bookingIdentifier },
      );
      router.push("/apartments");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update apartment");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this apartment?")) return;

    try {
      const reservationsResponse = await databases.listDocuments(
        DATABASE_ID,
        RESERVATIONS_COLLECTION_ID,
        [Query.equal("apartmentId", apartmentId)],
      );

      const reservationCount = reservationsResponse.total;

      const confirmed = confirm(
        `Are you sure you want to delete this apartment?\n\nThis will also delete ${reservationCount} reservation(s) associated with it.\n\nThis action cannot be undone.`,
      );

      if (!confirmed) return;

      for (const reservation of reservationsResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          RESERVATIONS_COLLECTION_ID,
          reservation.$id,
        );
      }

      await databases.deleteDocument(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        apartmentId,
      );

      router.push("/apartments");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete apartment");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Apartment not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Apartment</h1>
          <p className="text-gray-600 mt-2">Update apartment details</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apartment Details</CardTitle>
          <CardDescription>
            Update the information about your apartment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Apartment Name *</Label>
              <Input
                id="name"
                type="text"
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
                How this unit appears in Booking.com CSV exports
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
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
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
