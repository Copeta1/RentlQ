"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);

    try {
      await account.updateName(name);

      setProfileSuccess("Profile updated successfully!");

      const userData = await account.get();
      setUser(userData);
    } catch (err) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError("Failed to update profile");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      await account.updatePassword(newPassword, currentPassword);

      await account.deleteSession("current");

      alert(
        "Password changed successfully! Please log in with your new password.",
      );
      window.location.href = "/login";
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Rate limit")) {
          setPasswordError(
            "Too many attempts. Please try again in a few minutes.",
          );
        } else {
          setPasswordError(err.message);
        }
      } else {
        setPasswordError("Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out and deactivate your account? Contact support to permanently delete your account.",
    );

    if (!confirmed) return;

    try {
      await account.deleteSession("current");
      window.location.href = "/";
    } catch (err) {
      if (err instanceof Error) {
        alert(`Failed to sign out: ${err.message}`);
      } else {
        alert("Failed to sign out");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
        {user && <p>Account ID: {user.$id}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Email change is currently disabled
              </p>
            </div>
            {profileError && (
              <p className="text-sm text-red-500">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-sm text-green-500">{profileSuccess}</p>
            )}

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            {passwordSuccess && (
              <p className="text-sm text-green-500">{passwordSuccess}</p>
            )}

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Account Management</CardTitle>
          <CardDescription>Sign out and deactivate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Deactivate Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will sign you out. To permanently delete your account, please
              contact support.
            </p>
            <Button variant="destructive" onClick={handleDeactivateAccount}>
              Sign Out & Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
