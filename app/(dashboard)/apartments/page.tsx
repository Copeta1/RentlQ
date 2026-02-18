"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { Models, Query } from "appwrite";

interface Apartment extends Models.Document {
  name: string;
  location: string;
  platform: string;
  userId: string;
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApartments = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );
      setApartments(response.documents as unknown as Apartment[]);
    } catch (error) {
      console.error("Failed to fetch apartments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-gray-600">Loading apartments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Apartments</h1>
          <p className="text-gray-600 mt-2">Manage your rental properties</p>
        </div>
        <Link href="/apartments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Apartment
          </Button>
        </Link>
      </div>
      {apartments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No apartments available</CardTitle>
            <CardDescription>
              Get Started by adding your first apartment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/apartments/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Apartment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apartment) => (
            <Card key={apartment.$id}>
              <CardHeader>
                <CardTitle>{apartment.name}</CardTitle>
                <CardDescription>{apartment.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    Platform: <span>{apartment.platform || "None"}</span>
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/apartments/${apartment.$id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
