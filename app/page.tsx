import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Users, Package, Search, ArrowRight } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      href: "/admin",
      title: "Admin Dashboard",
      description: "Create new users, generate QR codes, and manage user information",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      href: "/dispatch",
      title: "Dispatch Center",
      description: "Scan QR codes and mark items as dispatched to users",
      icon: Package,
      color: "bg-green-500",
    },
    {
      href: "/checking",
      title: "User Verification",
      description: "Scan QR codes to view and verify user information",
      icon: Search,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <QrCode className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">QR Admin System</h1>
        </div>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Complete QR code management system for events with user registration, dispatch tracking, and verification
          capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.href}>
                  <Button className="w-full group">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 sm:mt-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-4 sm:space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Create Users</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Admin creates user profiles and generates unique QR codes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Dispatch Items</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Dispatch team scans QR codes and marks items as dispatched
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Verify Users</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Core team verifies user information and dispatch status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
