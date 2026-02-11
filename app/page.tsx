"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { account } from "@/lib/appwrite";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        router.push("/dashboard");
      } catch (error) {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <h1 className="text-4xl font-bold">RentlQ</h1>

      <Card className="w-100">
        <CardHeader>
          <CardTitle>Apartments Analytics</CardTitle>
          <CardDescription>
            Centralized dashboard for apartment management and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login">
            <Button className="w-full">Get started</Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground py-3">
            <Link href="/register" className="text-primary hover:underline">
              Don&apos;t have an account?
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
