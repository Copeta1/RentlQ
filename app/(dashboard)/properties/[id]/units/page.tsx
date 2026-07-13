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
        <p className="text-sm text-slate-500">Loading units...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-sm text-slate-500">Property not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/properties"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
              {property.name}
            </h1>
            <p className="mt-0.5 text-[0.83rem] text-slate-500">
              {property.location} · {units.length} unit(s)
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
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mb-1 text-[0.95rem] font-bold text-slate-900">
            No units yet
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Add rooms or apartments within this property
          </p>
          <Link href={`/properties/${propertyId}/units/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add First Unit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <div
              key={unit.$id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <DoorOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mb-0.5 text-[0.95rem] font-bold text-slate-900">
                {unit.name}
              </div>
              <div className="mb-4 text-[0.8rem] text-slate-500">
                {unit.platform || "No platform"}
              </div>
              <Link href={`/apartments/${unit.$id}`}>
                <Button variant="outline" className="w-full" size="sm">
                  Edit Unit
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
