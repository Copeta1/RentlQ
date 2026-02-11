"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  ID,
} from "@/lib/appwrite";
import { account } from "@/lib/appwrite";
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

export default function NewApartmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get current user
      const user = await account.get();

      // Create apartment
      await databases.createDocument(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          name,
          location,
          platform,
        },
      );

      router.push("/apartments");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create apartment");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Add New Apartment</h1>
        <p className="text-gray-600 mt-2">
          Add a new property to your portfolio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apartment Details</CardTitle>
          <CardDescription>
            Enter the information about your apartment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Apartment Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Seaside Villa, City Center Apartment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Split, Dubrovnik, Zagreb"
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
                onClick={() => router.push("/apartments")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Apartment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
