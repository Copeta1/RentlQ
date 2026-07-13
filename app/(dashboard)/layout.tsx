"use client";

import {
  account,
  databases,
  DATABASE_ID,
  APARTMENTS_COLLECTION_ID,
  PROPERTIES_COLLECTION_ID,
} from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import {
  Building2,
  Calendar,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Unit extends Models.Document {
  name: string;
  propertyId: string;
}

interface Property extends Models.Document {
  name: string;
}

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/reservations", label: "Reservations", icon: CalendarCheck },
      { href: "/upload", label: "Upload CSV", icon: Upload },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

function UnitLink({ unit, active }: { unit: Unit; active: boolean }) {
  return (
    <Link
      href={`/apartments/${unit.$id}`}
      className={`mb-0.5 flex items-center gap-2 rounded-lg py-1.5 pl-4 pr-3 text-[12.5px] transition-colors ${
        active
          ? "font-semibold text-blue-600"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
      <span className="truncate">{unit.name}</span>
    </Link>
  );
}

function getPageTitle(pathname: string) {
  for (const section of navSections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return item.label;
      }
    }
  }
  return "Dashboard";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const fetchUnits = async (userId: string) => {
    try {
      const [unitsResponse, propertiesResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, APARTMENTS_COLLECTION_ID, [
          Query.equal("userId", userId),
          Query.isNotNull("propertyId"),
        ]),
        databases.listDocuments(DATABASE_ID, PROPERTIES_COLLECTION_ID, [
          Query.equal("userId", userId),
        ]),
      ]);
      setUnits(unitsResponse.documents as unknown as Unit[]);
      setProperties(propertiesResponse.documents as unknown as Property[]);
    } catch (error) {
      console.error("Failed to fetch units:", error);
    }
  };

  const checkUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      fetchUnits(userData.$id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  const displayName = user?.name || user?.email || "Account";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* MOBILE BACKDROP */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 pt-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[7px] bg-blue-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-extrabold tracking-tight text-slate-900">
              RentlQ
            </span>
          </Link>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="rounded p-1 text-slate-400 hover:text-slate-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, index) => (
            <div key={section.label}>
              <div
                className={`mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${index === 0 ? "" : "mt-4"}`}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`}
                    />
                    {item.label}
                  </Link>
                );
              })}

              {index === 0 && (
                <div className="mt-4">
                  <div className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    My Units
                  </div>
                  {properties.length > 1
                    ? properties
                        .map((property) => ({
                          property,
                          propertyUnits: units.filter(
                            (unit) => unit.propertyId === property.$id,
                          ),
                        }))
                        .filter(({ propertyUnits }) => propertyUnits.length > 0)
                        .map(({ property, propertyUnits }) => (
                          <div key={property.$id} className="mb-1">
                            <div className="truncate px-4 pb-0.5 pt-1.5 text-[10.5px] font-semibold text-slate-400">
                              {property.name}
                            </div>
                            {propertyUnits.map((unit) => (
                              <UnitLink
                                key={unit.$id}
                                unit={unit}
                                active={pathname === `/apartments/${unit.$id}`}
                              />
                            ))}
                          </div>
                        ))
                    : units.map((unit) => (
                        <UnitLink
                          key={unit.$id}
                          unit={unit}
                          active={pathname === `/apartments/${unit.$id}`}
                        />
                      ))}
                  <Link
                    href="/properties"
                    className="mt-0.5 flex items-center gap-2 rounded-lg py-1.5 pl-4 pr-3 text-[12.5px] font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    Add unit
                  </Link>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-slate-800">
                {user?.name || "Account"}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-red-500"
            >
              <LogOut className="h-3.75 w-3.75" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded p-1 text-slate-500 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-[13px] text-slate-400">
              RentlQ / <span className="font-semibold text-slate-900">{getPageTitle(pathname)}</span>
            </div>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </Link>
        </div>

        <main className="flex-1 p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
