"use client";

import { account } from "@/lib/appwrite";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Gauge,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  PieChart,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const features = [
  {
    icon: Upload,
    title: "CSV Import",
    description:
      "Upload Booking.com or Airbnb exports in seconds. Automatic parsing, validation, and duplicate detection included.",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description:
      "Track total revenue, monthly trends, and compare performance across all your properties with interactive charts.",
  },
  {
    icon: Gauge,
    title: "Occupancy Tracking",
    description:
      "Real-time occupancy rate calculations. Identify peak seasons and optimize your pricing strategy.",
  },
  {
    icon: Calendar,
    title: "Reservation Management",
    description:
      "All bookings in one place. Filter by property, platform, date range, or guest name instantly.",
  },
  {
    icon: PieChart,
    title: "Visual Reports",
    description:
      "Beautiful charts for revenue trends, occupancy rates, and performance metrics — ready to share.",
  },
  {
    icon: Link2,
    title: "Multi-Platform",
    description:
      "Consolidate data from Booking.com, Airbnb, and more into one unified dashboard.",
  },
];

const steps = [
  {
    title: "Create your account",
    description:
      "Sign up free in under 30 seconds. No credit card, no commitment — just your email address.",
  },
  {
    title: "Upload your data",
    description:
      "Export a CSV from Booking.com or Airbnb and upload it. RentlQ handles the rest automatically.",
  },
  {
    title: "Analyze and grow",
    description:
      "Get instant insights into your revenue, occupancy, and reservations. Make data-driven decisions.",
  },
];

const stats = [
  { value: "2 min", label: "Average setup time" },
  { value: "100%", label: "Data stays private" },
  { value: "Free", label: "For 1 property, forever" },
  { value: "2+", label: "Platforms supported" },
];

const testimonials = [
  {
    text: "I used to spend hours each month in spreadsheets. RentlQ cut that down to minutes. The occupancy chart alone is worth it.",
    name: "Marko K.",
    role: "3 properties · Split, Croatia",
    initials: "MK",
    color: "#2563eb",
  },
  {
    text: "Finally I can see both my Airbnb and Booking.com revenue in one place. Simple, clean, exactly what I needed.",
    name: "Ana V.",
    role: "5 properties · Dubrovnik, Croatia",
    initials: "AV",
    color: "#7c3aed",
  },
  {
    text: "The CSV import is instant and the dashboard is beautiful. I recommended it to all the hosts in my building.",
    name: "Tomislav L.",
    role: "2 properties · Zagreb, Croatia",
    initials: "TL",
    color: "#059669",
  },
];

const revenueBars = [42, 55, 48, 70, 60, 75, 65, 88, 80, 92, 85, 100];
const barLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await account.get();
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900">
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-[1.05rem] font-extrabold tracking-tight text-slate-900">
            RentlQ
          </span>
        </Link>
        <ul className="hidden gap-8 sm:flex">
          <li>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              How it works
            </a>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24" />
          ) : isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.2),0_4px_12px_rgba(37,99,235,0.15)] transition-all hover:-translate-y-px hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.2),0_4px_12px_rgba(37,99,235,0.15)] transition-all hover:-translate-y-px hover:bg-blue-700"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-24 text-center sm:px-8">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-100 w-200 -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(219,234,254,0.6) 0%, transparent 70%)",
          }}
        />
        <div className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[0.78rem] font-semibold text-blue-700">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" fill="#16a34a" />
          </svg>
          Free for up to 1 property — no credit card needed
        </div>
        <h1 className="relative mb-5 text-[clamp(2.4rem,5.5vw,4rem)] font-black leading-[1.1] tracking-tight text-slate-900">
          Rental analytics
          <br />
          <span className="text-blue-600">without the spreadsheet.</span>
        </h1>
        <p className="relative mx-auto mb-10 max-w-130 text-[1.1rem] leading-relaxed text-slate-600">
          Centralize your Booking.com and Airbnb data. Track revenue, occupancy,
          and all reservations — in one clean dashboard built for property
          owners.
        </p>
        <div className="relative mb-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-[0.95rem] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.2),0_4px_12px_rgba(37,99,235,0.15)] transition-all hover:-translate-y-px hover:bg-blue-700"
          >
            Start for free
            <ArrowRight className="h-3.75 w-3.75" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-[1.5px] border-slate-200 bg-white px-7 py-3 text-[0.95rem] font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
        <p className="relative text-[0.78rem] text-slate-400">
          No credit card · Free forever for 1 property · Setup in under 2
          minutes
        </p>
      </div>

      {/* DASHBOARD MOCKUP */}
      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_6px_rgba(0,0,0,0.04),0_20px_60px_rgba(0,0,0,0.08),0_40px_100px_rgba(37,99,235,0.06)]">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-center text-[0.72rem] text-slate-500">
              rentl-q.vercel.app/dashboard
            </div>
          </div>
          <div className="grid min-h-90 grid-cols-1 sm:grid-cols-[190px_1fr]">
            <div className="hidden border-r border-slate-200 bg-slate-50 p-5 sm:block">
              <div className="mb-6 px-2 text-[0.9rem] font-extrabold tracking-tight text-blue-600">
                RentlQ
              </div>
              {[
                { icon: LayoutGrid, label: "Dashboard", active: true },
                { icon: Link2, label: "Properties", active: false },
                { icon: Calendar, label: "Reservations", active: false },
                { icon: BarChart3, label: "Revenue", active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.78rem] font-medium ${
                    item.active
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-600"
                  }`}
                >
                  <item.icon className="h-4 w-4 opacity-70" />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="text-[1rem] font-bold text-slate-900">
                  Overview
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-[0.72rem] font-medium text-slate-600">
                  Last 30 days ▾
                </div>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-blue-600">
                    €24,850
                  </div>
                  <div className="mt-1 text-[0.68rem] font-semibold text-green-600">
                    ↑ 12.4% vs last month
                  </div>
                </div>
                <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">
                    Occupancy Rate
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-green-600">
                    87%
                  </div>
                  <div className="mt-1 text-[0.68rem] font-semibold text-green-600">
                    ↑ 5% vs last month
                  </div>
                </div>
                <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">
                    Reservations
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                    142
                  </div>
                  <div className="mt-1 text-[0.68rem] font-semibold text-green-600">
                    ↑ 8 new this week
                  </div>
                </div>
              </div>
              <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-[0.75rem] font-semibold text-slate-600">
                  Monthly Revenue
                </div>
                <div className="flex h-20 items-end gap-1.25">
                  {revenueBars.map((height, i) => (
                    <div key={barLabels[i]} className="flex flex-1 items-end">
                      <div
                        className={`w-full rounded-t-[3px] ${
                          i === revenueBars.length - 1
                            ? "bg-blue-500"
                            : "bg-blue-200"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 hidden gap-1.25 sm:flex">
                  {barLabels.map((label) => (
                    <span
                      key={label}
                      className="flex-1 text-center text-[0.58rem] text-slate-400"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORMS */}
      <div className="mt-20 border-y border-slate-100 bg-slate-50 px-4 py-10 text-center sm:px-8">
        <p className="mb-6 text-[0.75rem] font-semibold uppercase tracking-widest text-slate-400">
          Works with data from
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12">
          <span className="text-[0.9rem] font-bold text-slate-400">
            🔵 Booking.com
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[0.9rem] font-bold text-slate-400">
            🔴 Airbnb
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[0.9rem] font-bold text-slate-400">
            📄 CSV Export
          </span>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-24 sm:px-8">
        <div className="mb-3 text-[0.75rem] font-bold uppercase tracking-widest text-blue-600">
          Features
        </div>
        <h2 className="mb-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-slate-900">
          Everything you need to manage rentals
        </h2>
        <p className="mb-12 max-w-115 text-[1rem] leading-relaxed text-slate-600">
          Powerful tools built for property owners who want clarity, not
          complexity.
        </p>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white p-7 transition-colors hover:bg-blue-50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-200 bg-white">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mb-1.5 text-[0.9rem] font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-[0.83rem] leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STEPS */}
      <div className="border-y border-slate-200 bg-slate-50">
        <section
          id="how-it-works"
          className="mx-auto max-w-5xl px-4 py-24 sm:px-8"
        >
          <div className="mb-3 text-[0.75rem] font-bold uppercase tracking-widest text-blue-600">
            How it works
          </div>
          <h2 className="mb-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-slate-900">
            Up and running in 3 steps
          </h2>
          <p className="mb-12 max-w-115 text-[1rem] leading-relaxed text-slate-600">
            No technical knowledge required.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[0.85rem] font-extrabold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="mb-1.5 text-[0.95rem] font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-[0.85rem] leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* STATS */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 px-4 py-16 text-center sm:grid-cols-4 sm:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-[2.2rem] font-black tracking-tight text-blue-600">
              {stat.value}
            </div>
            <div className="mt-1 text-[0.82rem] text-slate-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-8">
        <div className="mb-3 text-[0.75rem] font-bold uppercase tracking-widest text-blue-600">
          Testimonials
        </div>
        <h2 className="mb-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-slate-900">
          Property owners love RentlQ
        </h2>
        <p className="mb-10 max-w-115 text-[1rem] leading-relaxed text-slate-600">
          See what hosts are saying about managing their rentals with RentlQ.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(37,99,235,0.1)]"
            >
              <div className="mb-3 text-[0.85rem] tracking-wide text-amber-500">
                ★★★★★
              </div>
              <p className="mb-4 text-[0.875rem] italic leading-relaxed text-slate-700">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-full text-[0.75rem] font-bold text-white"
                  style={{ background: testimonial.color }}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-[0.8rem] font-bold text-slate-900">
                    {testimonial.name}
                  </div>
                  <div className="text-[0.72rem] text-slate-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-blue-600 px-4 py-20 text-center sm:px-8">
        <h2 className="mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)] font-black tracking-tight text-white">
          Ready to take control of your rentals?
        </h2>
        <p className="mx-auto mb-8 max-w-105 text-[1rem] text-blue-200">
          Join property owners who track their revenue, occupancy, and bookings
          in one place — for free.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-[0.95rem] font-bold text-blue-700 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-px hover:bg-slate-50"
          >
            Start for free
            <ArrowRight className="h-3.75 w-3.75" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-[1.5px] border-white/35 px-7 py-3 text-[0.95rem] font-semibold text-white transition-all hover:border-white/70 hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link href="/landing" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </div>
                <span className="text-[1.05rem] font-extrabold tracking-tight text-slate-900">
                  RentlQ
                </span>
              </Link>
              <p className="mt-3 max-w-60 text-[0.85rem] leading-relaxed text-slate-500">
                Analytics dashboard for apartment rental owners. Centralize your
                Booking.com and Airbnb data in one place.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-[0.8rem] font-bold text-slate-900">
                Product
              </h4>
              <div className="flex flex-col gap-2">
                <a
                  href="#features"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Features
                </a>
                <Link
                  href="/register"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Pricing
                </Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-[0.8rem] font-bold text-slate-900">
                Company
              </h4>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Contact
                </a>
                <a
                  href="#"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Privacy
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-[0.8rem] font-bold text-slate-900">
                Support
              </h4>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Documentation
                </a>
                <Link
                  href="/login"
                  className="text-[0.82rem] text-slate-500 transition-colors hover:text-blue-600"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <p className="text-[0.8rem] text-slate-400">
              © 2026 RentlQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
