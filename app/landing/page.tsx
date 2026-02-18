import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  PieChart,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: Upload,
      title: "CSV Import",
      description:
        "Upload your Booking.com or Airbnb CSV exports in seconds. Automatic data parsing and validation.",
    },
    {
      icon: BarChart3,
      title: "Revenue Analytics",
      description:
        "Track total revenue, monthly trends, and compare performance across all your properties with interactive charts.",
    },
    {
      icon: TrendingUp,
      title: "Occupancy Tracking",
      description:
        "Real-time occupancy rate calculations. Identify peak seasons and optimize your pricing strategy.",
    },
    {
      icon: Calendar,
      title: "Reservation Management",
      description:
        "View all bookings in one centralized dashboard. Filter by property, platform, date range, or guest name.",
    },
    {
      icon: PieChart,
      title: "Visual Reports",
      description:
        "Beautiful charts and graphs powered by Recharts. Revenue trends, occupancy rates, and performance metrics visualized.",
    },
    {
      icon: Users,
      title: "Multi-Platform Support",
      description:
        "Consolidate data from Booking.com, Airbnb, and other platforms. One unified dashboard for all your properties.",
    },
  ];

  const benefits = [
    {
      title: "Save Hours Every Week",
      description:
        "Stop manually tracking spreadsheets. Automate your analytics.",
    },
    {
      title: "Make Better Decisions",
      description:
        "Data-driven insights help you optimize pricing and availability.",
    },
    {
      title: "All-in-One Platform",
      description:
        "No more juggling between Booking.com, Airbnb, and spreadsheets.",
    },
    {
      title: "Secure & Private",
      description: "Your data is encrypted and only visible to you.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">RentlQ</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="register">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/*Hero */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Apartment Analytics,
            <span className="text-blue-600"> Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Centralize your Booking.com and Airbnb data. Track revenue,
            occupancy, and manage reservations in one powerful dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See Features
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Free forever for 1 property
          </p>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your rentals
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for property owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((features, index) => {
              const Icon = features.icon;
              return (
                <Card
                  key={index}
                  className="border-2 hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <Icon className="h-12 w-12 text-blue-600 mb-4" />
                    <CardTitle>{features.title}</CardTitle>
                    <CardDescription>{features.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Get started in 3 simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">
                Sign up for free. No credit card required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Data</h3>
              <p className="text-gray-600">
                Import CSV files from Booking.com or Airbnb.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze & Grow</h3>
              <p className="text-gray-600">
                Get insights and make data-driven decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why property owners choose RentlQ
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-100 to-blue-50 p-8 rounded-lg">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Dashboard Preview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                    <span className="font-medium">Total Revenue</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €24,850
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded">
                    <span className="font-medium">Occupancy Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      87%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded">
                    <span className="font-medium">Reservations</span>
                    <span className="text-2xl font-bold text-purple-600">
                      142
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to simplify your rental management?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join property owners who are already saving time and growing revenue
            with RentlQ.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Free Trial
            </Button>
          </Link>
          <p className="text-sm text-blue-100 mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">RentlQ</h3>
              <p className="text-sm">
                Analytics dashboard for apartment rental owners.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 RentlQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
