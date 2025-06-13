"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createUser, updateUser } from "../actions/user-actions"
import { generateQRCode } from "@/lib/qr-utils"
import { Download } from "lucide-react"

interface AdminFormProps {
  editUser?: any
  onCancel?: () => void
}

export function AdminForm({ editUser, onCancel }: AdminFormProps) {
  const [userType, setUserType] = useState(editUser?.user_type || "other")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = editUser ? await updateUser(editUser.id, formData) : await createUser(formData)

      if (result?.success && result.user) {
        // Generate QR code for display
        try {
          const userData = JSON.parse(result.user.qr_code_data)
          const qrUrl = await generateQRCode(userData)
          setQrCodeUrl(qrUrl)
        } catch (error) {
          console.error("Error generating QR code:", error)
        }
      } else {
        setError(result?.error || "An error occurred")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a")
      link.download = `qr-code-${editUser?.name || "new-user"}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  if (qrCodeUrl && !editUser) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-center">QR Code Generated Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <img src={qrCodeUrl || "/placeholder.svg"} alt="Generated QR Code" className="mx-auto max-w-full h-auto" />
          <div className="space-y-2">
            <Button onClick={downloadQRCode} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQrCodeUrl(null)
                window.location.reload()
              }}
              className="w-full"
            >
              Create Another User
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name *
          </Label>
          <Input id="name" name="name" required defaultValue={editUser?.name} placeholder="Enter full name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={editUser?.email}
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number *
          </Label>
          <Input id="phone" name="phone" required defaultValue={editUser?.phone} placeholder="Enter phone number" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium">
            Role *
          </Label>
          <Select name="role" defaultValue={editUser?.role} required>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="VVIP">VVIP</SelectItem>
              <SelectItem value="Core">Core</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="participants">Participants</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_type" className="text-sm font-medium">
            User Type *
          </Label>
          <Select
            name="user_type"
            value={userType}
            onValueChange={setUserType}
            defaultValue={editUser?.user_type}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="college_student">College Student</SelectItem>
              <SelectItem value="college_faculty">College Faculty</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(userType === "college_student" || userType === "college_faculty") && (
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="college_id" className="text-sm font-medium">
              College ID *
            </Label>
            <Input
              id="college_id"
              name="college_id"
              required
              defaultValue={editUser?.college_id}
              placeholder="Enter college ID"
            />
          </div>
        )}
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Processing..." : editUser ? "Update User" : "Create User & Generate QR"}
        </Button>
      </div>
    </form>
  )
}
