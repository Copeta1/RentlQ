"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  PROPERTIES_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, DoorOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Models } from "appwrite";
import { Query } from "appwrite";

interface Property extends Models.Document {
  name: string;
  location: string;
}

interface Unit extends Models.Document {
  name: string;
  location: string;
  platform: string;
  userId: string;
  propertyId: string;
  bookingIdentifier?: string;
}

export default function PropertyUnitsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      const user = await account.get();

      const propertyDoc = await databases.getDocument(
        DATABASE_ID,
        PROPERTIES_COLLECTION_ID,
        propertyId,
      );
      setProperty(propertyDoc as unknown as Property);

      const unitsResponse = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.equal("propertyId", propertyId),
        ],
      );
      setUnits(unitsResponse.documents as unknown as Unit[]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Loading units...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/properties"
          className="text-primary hover:underline flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <p className="text-gray-600 mt-2">
              {property.location} • {units.length} unit(s)
            </p>
          </div>
          <Link href={`/properties/${propertyId}/units/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </Link>
        </div>
      </div>

      {units.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No units yet</CardTitle>
            <CardDescription>
              Add rooms or apartments within this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/properties/${propertyId}/units/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add First Unit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.$id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <DoorOpen className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="mt-4">{unit.name}</CardTitle>
                <CardDescription>
                  {unit.platform || "No platform"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/apartments/${unit.$id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Edit Unit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
