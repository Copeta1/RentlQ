"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  databases,
  DATABASE_ID,
  PROPERTIES_COLLECTION_ID,
  APARTMENTS_COLLECTION_ID,
  RESERVATIONS_COLLECTION_ID,
  account,
} from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Query, type Models } from "appwrite";

interface Property extends Models.Document {
  name: string;
  location: string;
  description: string;
  userId: string;
}

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const prop = doc as unknown as Property;
      setProperty(prop);
      setName(prop.name);
      setLocation(prop.location);
      setDescription(prop.description || "");
    } catch (error) {
      console.error("Failed to fetch property:", error);
      setError("Failed to load property");
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
        PROPERTIES_COLLECTION_ID,
        propertyId,
        { name, location, description },
      );
      router.push("/properties");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update property");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const user = await account.get();

      const unitsResponse = await databases.listDocuments(
        DATABASE_ID,
        APARTMENTS_COLLECTION_ID,
        [Query.equal("propertyId", propertyId)],
      );

      const unitCount = unitsResponse.total;

      const confirmed = confirm(
        `Are you sure you want to delete this property?\n\n` +
          `This will also delete:\n` +
          `- ${unitCount} unit(s)\n` +
          `- All reservations for these units\n\n` +
          `This action cannot be undone.`,
      );

      if (!confirmed) return;

      for (const unit of unitsResponse.documents) {
        const reservationsResponse = await databases.listDocuments(
          DATABASE_ID,
          RESERVATIONS_COLLECTION_ID,
          [Query.equal("apartmentId", unit.$id)],
        );

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
          unit.$id,
        );
      }

      await databases.deleteDocument(
        DATABASE_ID,
        PROPERTIES_COLLECTION_ID,
        propertyId,
      );

      router.push("/properties");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete property");
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

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <p className="text-gray-600 mt-2">Update property details</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>
            Update the information about your property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                type="text"
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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/properties")}
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
