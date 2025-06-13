"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, X } from "lucide-react"

interface DeleteConfirmationDialogProps {
  user: any
  onConfirm: (deletedBy: string, reason: string) => void
  onCancel: () => void
  isDeleting: boolean
}

export function DeleteConfirmationDialog({ user, onConfirm, onCancel, isDeleting }: DeleteConfirmationDialogProps) {
  const [deletedBy, setDeletedBy] = useState("")
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    onConfirm(deletedBy, reason)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl pr-8">
            <AlertTriangle className="h-5 w-5" />
            Confirm Deletion
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="absolute top-2 right-2" disabled={isDeleting}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-800 font-medium mb-2 text-sm sm:text-base">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <p className="text-red-700 text-xs sm:text-sm">
              The user data will be backed up in the deletion history for tracking purposes.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm sm:text-base">User Details:</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-sm">
                <strong>Name:</strong> {user.name}
              </p>
              <p className="text-sm break-all">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm">
                <strong>Phone:</strong> {user.phone}
              </p>
              {user.college_id && (
                <p className="text-sm">
                  <strong>College ID:</strong> {user.college_id}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user.user_type.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleted_by" className="text-sm font-medium">
                Deleted By *
              </Label>
              <Input
                id="deleted_by"
                value={deletedBy}
                onChange={(e) => setDeletedBy(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Deletion *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Duplicate entry, Test data, User request..."
                rows={3}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={isDeleting} className="w-full sm:flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting || !deletedBy.trim() || !reason.trim()}
              className="w-full sm:flex-1"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
