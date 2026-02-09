"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { account } from "@/lib/appwrite";

export default function Home() {
  const [status, setStatus] = useState("Checking connection...");

  useEffect(() => {
    account
      .get()
      .then(() => {
        setStatus("✅ Connected to Appwrite (No user logged in)");
      })
      .catch((error) => {
        if (error.code === 401) {
          setStatus("✅ Connected to Appwrite (No user logged in)");
        } else {
          setStatus(`❌ Connection error: ${error.message}`);
        }
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <h1 className="text-4xl font-bold">RentlQ</h1>

      <Card className="w-100">
        <CardHeader>
          <CardTitle>Apartmani Analytics</CardTitle>
          <CardDescription>
            Centralizirani dashboard za upravljanje i analitiku apartmana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{status}</p>
          <Button className="w-full">Započni</Button>
        </CardContent>
      </Card>
    </main>
  );
}
