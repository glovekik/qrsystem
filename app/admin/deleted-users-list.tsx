"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { getDeletedUsers, permanentlyDeleteUser } from "../actions/user-actions"
import { Search, Trash2, Calendar, User, Package, AlertTriangle } from "lucide-react"

export function DeletedUsersList() {
  const [deletedUsers, setDeletedUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchDeletedUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    const filtered = deletedUsers.filter((deletedUser) => {
      return (
        deletedUser.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deletedUser.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deletedUser.user_phone.includes(searchTerm) ||
        (deletedUser.college_id && deletedUser.college_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (deletedUser.deleted_by && deletedUser.deleted_by.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
    setFilteredUsers(filtered)
  }, [searchTerm, deletedUsers])

  const fetchDeletedUsers = async () => {
    try {
      const result = await getDeletedUsers()
      if (result.success) {
        setDeletedUsers(result.deletedUsers || [])
        setFilteredUsers(result.deletedUsers || [])
      }
    } catch (error) {
      console.error("Error fetching deleted users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermanentDelete = async (deletedUserId: string) => {
    setDeletingUserId(deletedUserId)

    try {
      const result = await permanentlyDeleteUser(deletedUserId)

      if (result.success) {
        // Remove the user from local state
        setDeletedUsers((prev) => prev.filter((user) => user.id !== deletedUserId))
        setFilteredUsers((prev) => prev.filter((user) => user.id !== deletedUserId))
      } else {
        alert(`Failed to permanently delete user: ${result.error}`)
      }
    } catch (error) {
      console.error("Error permanently deleting user:", error)
      alert("An unexpected error occurred")
    } finally {
      setDeletingUserId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading deleted users...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Deleted Users History ({filteredUsers.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search deleted users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No deleted users match your search." : "No users have been deleted yet."}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredUsers.map((deletedUser) => {
              const isExpanded = expandedUser === deletedUser.id.toString()
              let dispatchRecords = []

              try {
                dispatchRecords = JSON.parse(deletedUser.dispatch_records || "[]")
              } catch (e) {
                dispatchRecords = []
              }

              return (
                <div key={deletedUser.id} className="border rounded-lg p-4 space-y-3 bg-red-50 border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {deletedUser.user_name} <span className="text-red-600 text-sm">(Deleted)</span>
                      </h3>
                      <p className="text-sm text-gray-600">{deletedUser.user_email}</p>
                      <p className="text-sm text-gray-600">{deletedUser.user_phone}</p>
                      {deletedUser.college_id && <p className="text-sm text-gray-600">ID: {deletedUser.college_id}</p>}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="secondary">{deletedUser.user_role}</Badge>
                      <Badge variant="outline">{deletedUser.user_type.replace("_", " ")}</Badge>

                      {/* Permanent Delete Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="bg-red-700 hover:bg-red-800">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Permanent Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-5 w-5" />
                              Permanent Delete
                            </DialogTitle>
                            <DialogDescription>
                              This will permanently remove <strong>{deletedUser.user_name}</strong> from the deleted
                              users history. This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>

                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-red-700">
                              <strong>Warning:</strong> This will completely remove all traces of this user!
                            </AlertDescription>
                          </Alert>

                          <DialogFooter className="flex gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button
                              variant="destructive"
                              onClick={() => handlePermanentDelete(deletedUser.id)}
                              disabled={deletingUserId === deletedUser.id}
                            >
                              {deletingUserId === deletedUser.id ? "Deleting..." : "Permanent Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Deletion Details</span>
                    </div>
                    <div className="text-sm text-red-600 space-y-1">
                      <p>
                        <strong>Deleted:</strong> {new Date(deletedUser.deleted_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Deleted by:</strong> {deletedUser.deleted_by}
                      </p>
                      <p>
                        <strong>Reason:</strong> {deletedUser.deletion_reason}
                      </p>
                      <p>
                        <strong>Had dispatch records:</strong> {deletedUser.had_dispatch_records ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {deletedUser.had_dispatch_records && dispatchRecords.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">Dispatch Records ({dispatchRecords.length})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedUser(isExpanded ? null : deletedUser.id.toString())}
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2">
                          {dispatchRecords.map((dispatch: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 text-sm">
                              <p>
                                <strong>Dispatched:</strong> {new Date(dispatch.dispatched_at).toLocaleString()}
                              </p>
                              <p>
                                <strong>By:</strong> {dispatch.dispatched_by}
                              </p>
                              {dispatch.notes && (
                                <p>
                                  <strong>Notes:</strong> {dispatch.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
