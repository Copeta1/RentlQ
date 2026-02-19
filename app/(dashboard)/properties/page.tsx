"use client";

import { useEffect, useState } from "react";
import {
  databases,
  DATABASE_ID,
  PROPERTIES_COLLECTION_ID,
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
        <p>Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-600 mt-2">Manage your rental properties</p>
        </div>
        <Link href="/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No properties yet</CardTitle>
            <CardDescription>
              Get started by adding your first property (house/building)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card
              key={property.$id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="mt-4">{property.name}</CardTitle>
                <CardDescription>{property.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
