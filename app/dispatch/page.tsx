"use client"

import { useState } from "react"
import  QRScanner  from "@/components/qr-scanner"
import { DispatchList } from "./dispatch-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserByQRData, dispatchUser } from "../actions/user-actions"
import { Package, CheckCircle, AlertCircle, QrCode, List } from "lucide-react"

export default function DispatchPage() {
  const [scannedUser, setScannedUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchedBy, setDispatchedBy] = useState("")
  const [notes, setNotes] = useState("")

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

  const handleDispatch = async () => {
    if (!scannedUser || !dispatchedBy.trim()) return

    setDispatching(true)
    try {
      const result = await dispatchUser(scannedUser.id, dispatchedBy, notes)

      if (result.success) {
        setScannedUser(null)
        setDispatchedBy("")
        setNotes("")
        setError(null)
        alert("User dispatched successfully!")
        // Refresh the page to update the dispatch list
        window.location.reload()
      } else {
        setError(result.error || "Failed to dispatch user")
      }
    } catch (error) {
      setError("Failed to dispatch user")
    } finally {
      setDispatching(false)
    }
  }

  const resetScanner = () => {
    setScannedUser(null)
    setError(null)
    setDispatchedBy("")
    setNotes("")
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Package className="h-6 w-6 sm:h-8 sm:w-8" />
        <h1 className="text-2xl sm:text-3xl font-bold">Dispatch Center</h1>
      </div>

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="scan" className="flex items-center gap-2 text-xs sm:text-sm py-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan & Dispatch</span>
            <span className="sm:hidden">Scan</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm py-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Dispatch History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4 sm:space-y-6">
          {!scannedUser ? (
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Scan QR Code to Dispatch</CardTitle>
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
                    User Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Name</Label>
                      <p className="font-semibold text-sm sm:text-base">{scannedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm sm:text-base break-all">{scannedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm sm:text-base">{scannedUser.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Role</Label>
                      <Badge variant="secondary" className="text-xs">
                        {scannedUser.role}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Type</Label>
                      <Badge variant="outline" className="text-xs">
                        {scannedUser.user_type.replace("_", " ")}
                      </Badge>
                    </div>
                    {scannedUser.college_id && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">College ID</Label>
                        <p className="text-sm sm:text-base">{scannedUser.college_id}</p>
                      </div>
                    )}
                  </div>

                  {scannedUser.dispatch_log && scannedUser.dispatch_log.length > 0 && (
                    <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium text-sm sm:text-base">
                        ⚠️ This user has already been dispatched on{" "}
                        {new Date(scannedUser.dispatch_log[0].dispatched_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Dispatch Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dispatched_by" className="text-sm font-medium">
                      Dispatched By *
                    </Label>
                    <Input
                      id="dispatched_by"
                      value={dispatchedBy}
                      onChange={(e) => setDispatchedBy(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <p className="text-sm sm:text-base">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button variant="outline" onClick={resetScanner} className="w-full sm:flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDispatch}
                      disabled={!dispatchedBy.trim() || dispatching}
                      className="w-full sm:flex-1"
                    >
                      {dispatching ? "Dispatching..." : "Confirm Dispatch"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 sm:space-y-6">
          <DispatchList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
