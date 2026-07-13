"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  PROPERTIES_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import type { Models } from "appwrite";
import { Query } from "appwrite";

interface Property extends Models.Document {
  name: string;
  location: string;
  description: string;
  userId: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-sm text-slate-500">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.3rem] font-extrabold tracking-tight text-slate-900">
            Properties
          </h1>
          <p className="mt-0.5 text-[0.83rem] text-slate-500">
            Manage your rental properties
          </p>
        </div>
        <Link href="/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mb-1 text-[0.95rem] font-bold text-slate-900">
            No properties yet
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Get started by adding your first property (house/building)
          </p>
          <Link href="/properties/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Property
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property.$id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mb-0.5 text-[0.95rem] font-bold text-slate-900">
                {property.name}
              </div>
              <div className="mb-4 text-[0.8rem] text-slate-500">
                {property.location}
              </div>
              <p className="mb-4 line-clamp-2 text-[0.82rem] text-slate-500">
                {property.description || "No description"}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/properties/${property.$id}/units`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full" size="sm">
                    Manage Units
                  </Button>
                </Link>
                <Link href={`/properties/${property.$id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
