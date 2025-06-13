"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { AdminForm } from "./admin-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { generateQRCode } from "@/lib/qr-utils"
import { deleteUser } from "../actions/user-actions"
import { Edit, Download, Search, Filter, Users, Trash2, MoreVertical, Eye, FileText, Archive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import JSZip from "jszip"

export function UserList() {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [viewingUser, setViewingUser] = useState<any>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Apply filters and search
    let filtered = users

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm) ||
          (user.college_id && user.college_id.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Apply user type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((user) => user.user_type === userTypeFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, userTypeFilter])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
      } else {
        setUsers(data || [])
        setFilteredUsers(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = async (user: any) => {
    try {
      const userData = JSON.parse(user.qr_code_data)
      const qrUrl = await generateQRCode(userData)

      const link = document.createElement("a")
      link.download = `qr-code-${user.name.replace(/\s+/g, "-")}.png`
      link.href = qrUrl
      link.click()
    } catch (error) {
      console.error("Error generating QR code:", error)
      alert("Failed to generate QR code")
    }
  }

  const viewQRCode = async (user: any) => {
    try {
      const userData = JSON.parse(user.qr_code_data)
      const qrUrl = await generateQRCode(userData)
      setQrCodeUrl(qrUrl)
      setViewingUser(user)
    } catch (error) {
      console.error("Error generating QR code:", error)
      alert("Failed to generate QR code")
    }
  }

  const handleDownloadZip = async () => {
    if (filteredUsers.length === 0) {
      alert("No users to download")
      return
    }

    setIsDownloadingZip(true)
    setDownloadProgress(0)

    try {
      const zip = new JSZip()
      const qrFolder = zip.folder("qr-codes")

      for (let i = 0; i < filteredUsers.length; i++) {
        const user = filteredUsers[i]

        try {
          // Update progress
          setDownloadProgress(Math.round(((i + 1) / filteredUsers.length) * 100))

          const userData = JSON.parse(user.qr_code_data)
          const qrDataUrl = await generateQRCode(userData)

          // Convert data URL to blob
          const response = await fetch(qrDataUrl)
          const blob = await response.blob()

          // Create filename with name, phone, and ID
          const safeName = user.name.replace(/[^a-zA-Z0-9]/g, "_")
          const filename = `${safeName}_${user.phone}_${user.id.slice(0, 8)}.png`

          qrFolder?.file(filename, blob)

          // Also create a text file with user details
          const userInfo = `Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone}
Role: ${user.role}
Type: ${user.user_type}
College ID: ${user.college_id || "N/A"}
Created: ${new Date(user.created_at).toLocaleString()}
QR Data: ${user.qr_code_data}`

          qrFolder?.file(`${safeName}_${user.phone}_info.txt`, userInfo)
        } catch (error) {
          console.error(`Error generating QR for user ${user.name}:`, error)
          // Continue with next user
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-codes-${filteredUsers.length}-users-${new Date().toISOString().split("T")[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)

      setDownloadProgress(100)
    } catch (error) {
      console.error("Error downloading QR codes:", error)
      alert("Failed to download QR codes")
    } finally {
      setIsDownloadingZip(false)
      setDownloadProgress(0)
    }
  }

  const handleDownloadPdf = async () => {
    if (filteredUsers.length === 0) {
      alert("No users to download")
      return
    }

    setIsDownloadingPdf(true)
    setDownloadProgress(0)

    try {
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

      for (let i = 0; i < filteredUsers.length; i++) {
        const user = filteredUsers[i]

        try {
          // Update progress
          setDownloadProgress(Math.round(((i + 1) / filteredUsers.length) * 100))

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
            console.log(`Processing ${i + 1}/${filteredUsers.length} users...`)
          }
        } catch (error) {
          console.error(`Error adding QR for user ${user.name}:`, error)
          // Continue with next user
        }
      }

      // Download the PDF
      pdf.save(`all-qr-codes-${filteredUsers.length}-users-${new Date().toISOString().split("T")[0]}.pdf`)
      setDownloadProgress(100)
    } catch (error) {
      console.error("Error downloading QR codes as PDF:", error)
      alert("Failed to download QR codes as PDF")
    } finally {
      setIsDownloadingPdf(false)
      setDownloadProgress(0)
    }
  }

  const handleDeleteUser = async (deletedBy: string, reason: string) => {
    if (!deletingUser) return

    setIsDeleting(true)
    try {
      const result = await deleteUser(deletingUser.id, deletedBy, reason)

      if (result.success) {
        setDeleteMessage(`User "${deletingUser.name}" has been successfully deleted.`)
        setDeletingUser(null)
        fetchUsers() // Refresh the user list

        // Clear success message after 5 seconds
        setTimeout(() => {
          setDeleteMessage(null)
        }, 5000)
      } else {
        alert(`Failed to delete user: ${result.error}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred while deleting the user")
    } finally {
      setIsDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setUserTypeFilter("all")
  }

  const hasActiveFilters = searchTerm || roleFilter !== "all" || userTypeFilter !== "all"

  if (editingUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            editUser={editingUser}
            onCancel={() => {
              setEditingUser(null)
              fetchUsers()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {deleteMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="font-medium text-sm sm:text-base">{deleteMessage}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-5 w-5" />
            All Users ({filteredUsers.length} of {users.length})
          </CardTitle>

          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VVIP">VVIP</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="participants">Participants</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All User Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All User Types</SelectItem>
                    <SelectItem value="college_student">College Student</SelectItem>
                    <SelectItem value="college_faculty">College Faculty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="text-sm">
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={filteredUsers.length === 0 || isDownloadingPdf || isDownloadingZip}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm w-full"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isDownloadingPdf ? `${downloadProgress}%` : `Download ${filteredUsers.length} QRs as PDF`}
                  </Button>

                  {isDownloadingPdf && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleDownloadZip}
                    disabled={filteredUsers.length === 0 || isDownloadingZip || isDownloadingPdf}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm w-full"
                    size="sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {isDownloadingZip ? `${downloadProgress}%` : `Download ${filteredUsers.length} QRs as ZIP`}
                  </Button>

                  {isDownloadingZip && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {users.length === 0 ? "No users found. Create your first user!" : "No users match your search criteria."}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{user.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{user.phone}</p>
                      {user.college_id && <p className="text-xs sm:text-sm text-gray-600">ID: {user.college_id}</p>}
                      <p className="text-xs text-gray-500">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden sm:flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => viewQRCode(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadQRCode(user)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => viewQRCode(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View QR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadQRCode(user)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download QR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingUser(user)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {user.user_type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code View Dialog */}
      {viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code for {viewingUser.name}</DialogTitle>
              <DialogDescription>Scan this QR code or download it for later use</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt={`QR Code for ${viewingUser.name}`}
                  className="w-64 h-64 border rounded-lg"
                />
              )}
              <div className="text-center space-y-1">
                <p className="font-medium">{viewingUser.name}</p>
                <p className="text-sm text-gray-600">{viewingUser.email}</p>
                <p className="text-sm text-gray-600">{viewingUser.phone}</p>
                <Badge variant="secondary" className="text-xs">
                  {viewingUser.role}
                </Badge>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setViewingUser(null)}>
                Close
              </Button>
              <Button onClick={() => downloadQRCode(viewingUser)}>
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingUser && (
        <DeleteConfirmationDialog
          user={deletingUser}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUser(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
