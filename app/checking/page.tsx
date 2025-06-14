 
"use client"

import { useState } from "react"
import  QRScanner  from "@/components/qr-scanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { getUserByQRData } from "../actions/user-actions"
import { Search, CheckCircle, AlertCircle, Package } from "lucide-react"

export default function CheckingPage() {
  const [scannedUser, setScannedUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (qrData: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getUserByQRData(qrData)

      if (result.success) {
        setScannedUser(result.user)
      } else {
        setError(result.error || "User not found")
      }
    } catch (error) {
      setError("Failed to process QR code")
    } finally {
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setScannedUser(null)
    setError(null)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Search className="h-6 w-6 sm:h-8 sm:w-8" />
        <h1 className="text-2xl sm:text-3xl font-bold">User Verification</h1>
      </div>

      {!scannedUser ? (
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Scan QR Code to View User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <QRScanner onScan={handleScan} onError={setError} />

              {loading && (
                <div className="text-center py-4">
                  <p className="text-sm sm:text-base">Processing QR code...</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <p className="text-sm sm:text-base">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                  <p className="text-base sm:text-lg font-semibold">{scannedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-base sm:text-lg break-all">{scannedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-base sm:text-lg">{scannedUser.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Role</Label>
                  <Badge variant="secondary" className="text-sm">
                    {scannedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User Type</Label>
                  <Badge variant="outline" className="text-sm">
                    {scannedUser.user_type.replace("_", " ")}
                  </Badge>
                </div>
                {scannedUser.college_id && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">College ID</Label>
                    <p className="text-base sm:text-lg font-mono">{scannedUser.college_id}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                <p className="text-sm text-gray-600">{new Date(scannedUser.created_at).toLocaleString()}</p>
              </div>

              {/* Dispatch Status */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500">Dispatch Status</Label>
                {scannedUser.dispatch_log && scannedUser.dispatch_log.length > 0 ? (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium text-sm sm:text-base">Dispatched</span>
                    </div>
                    <div className="text-sm text-green-600 space-y-1">
                      <p>
                        <strong>Date:</strong> {new Date(scannedUser.dispatch_log[0].dispatched_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>By:</strong> {scannedUser.dispatch_log[0].dispatched_by}
                      </p>
                      {scannedUser.dispatch_log[0].notes && (
                        <p>
                          <strong>Notes:</strong> {scannedUser.dispatch_log[0].notes}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm sm:text-base">Not Dispatched</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">This user has not been dispatched yet.</p>
                  </div>
                )}
              </div>

              <Button onClick={resetScanner} className="w-full">
                Scan Another QR Code
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}