"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAllUsers, bulkDeleteAllUsers } from "../actions/user-actions"
import { generateQRCode } from "@/lib/qr-utils"
import { Download, Trash2, AlertTriangle } from "lucide-react"

export function AdminActions() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [password, setPassword] = useState("")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [error, setError] = useState("")
  const [userCount, setUserCount] = useState(0)

  const handleDownloadAllQRs = async () => {
    setIsDownloading(true)
    setError("")

    try {
      const users = await getAllUsers()
      if (users.length === 0) {
        setError("No users found to generate QR codes")
        return
      }

      // Import jsPDF dynamically
      const { jsPDF } = await import("jspdf")

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      let currentY = 30
      const qrSize = 40
      const margin = 10
      const itemHeight = qrSize + 25

      // Add title
      pdf.setFontSize(18)
      pdf.text("QR Codes with User Details", pageWidth / 2, 20, { align: "center" })

      for (let i = 0; i < users.length; i++) {
        const user = users[i]

        try {
          // Check if we need a new page
          if (currentY + itemHeight > pageHeight - 20) {
            pdf.addPage()
            currentY = 30
          }

          // Generate QR code
          const userData = JSON.parse(user.qr_code_data)
          const qrDataUrl = await generateQRCode(userData)

          // Add QR code to PDF
          pdf.addImage(qrDataUrl, "PNG", margin, currentY, qrSize, qrSize)

          // Add user details next to QR code
          const textX = margin + qrSize + 10
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")
          pdf.text(`${user.name}`, textX, currentY + 8)

          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          pdf.text(`Email: ${user.email}`, textX, currentY + 16)
          pdf.text(`Phone: ${user.phone}`, textX, currentY + 24)
          pdf.text(`Role: ${user.role}`, textX, currentY + 32)

          if (user.college_id) {
            pdf.text(`ID: ${user.college_id}`, textX, currentY + 40)
          }

          currentY += itemHeight

          // Add a small progress indicator
          if (i % 10 === 0) {
            console.log(`Processing ${i + 1}/${users.length} users...`)
          }
        } catch (error) {
          console.error(`Error adding QR for user ${user.name}:`, error)
          // Continue with next user
        }
      }

      // Download the PDF
      pdf.save(`all-qr-codes-${users.length}-users-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error downloading QRs:", error)
      setError("Failed to download QR codes. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleBulkDeleteClick = async () => {
    try {
      const users = await getAllUsers()
      setUserCount(users.length)
      if (users.length === 0) {
        setError("No users found to delete")
        return
      }
      setShowPasswordDialog(true)
    } catch (error) {
      setError("Failed to check user count")
    }
  }

  const handleBulkDelete = async () => {
    if (password !== "Hackathon@2025") {
      setError("Incorrect password")
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const result = await bulkDeleteAllUsers("Admin", "Bulk delete operation")

      if (result.success) {
        setShowPasswordDialog(false)
        setPassword("")
        alert(`Successfully deleted ${result.deletedCount} users`)
      } else {
        setError(result.error || "Failed to delete users")
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      setError("An unexpected error occurred during bulk delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={handleDownloadAllQRs}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Generating PDF..." : "Download All QRs as PDF"}
            </Button>

            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleBulkDeleteClick}
                  variant="destructive"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete All Users
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Bulk Delete
                  </DialogTitle>
                  <DialogDescription>
                    This will permanently delete <strong>{userCount} users</strong> and all their data. This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    <strong>Warning:</strong> This will delete ALL users in the database!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Enter Password to Confirm</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="mt-1"
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordDialog(false)
                      setPassword("")
                      setError("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting || !password}>
                    {isDeleting ? "Deleting..." : `Delete ${userCount} Users`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
