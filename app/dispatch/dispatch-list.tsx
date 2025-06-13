"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Search, Package, Calendar, User, AlertTriangle } from "lucide-react"

interface DispatchedUser {
  id: string
  name: string
  email: string
  phone: string
  role: string
  user_type: string
  college_id: string | null
  dispatch_log: {
    dispatched_at: string
    dispatched_by: string
    notes: string | null
  }[]
}

export function DispatchList() {
  const [dispatchedUsers, setDispatchedUsers] = useState<DispatchedUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<DispatchedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchDispatchedUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    const filtered = dispatchedUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        (user.college_id && user.college_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.dispatch_log[0]?.dispatched_by.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, dispatchedUsers])

  const fetchDispatchedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          dispatch_log (
            dispatched_at,
            dispatched_by,
            notes
          )
        `)
        .not("dispatch_log", "is", null)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching dispatched users:", error)
      } else {
        // Filter only users that have dispatch logs
        const usersWithDispatch = (data || []).filter((user) => user.dispatch_log && user.dispatch_log.length > 0)
        setDispatchedUsers(usersWithDispatch)
        setFilteredUsers(usersWithDispatch)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading dispatch history...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Dispatch History ({filteredUsers.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone, college ID, or dispatcher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Info about deleted users */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">
              <strong>Note:</strong> If a user is deleted from the system, their dispatch record will also be removed
              from this list.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No dispatched users match your search." : "No users have been dispatched yet."}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                    {user.college_id && <p className="text-sm text-gray-600">ID: {user.college_id}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="secondary">{user.role}</Badge>
                    <Badge variant="outline">{user.user_type.replace("_", " ")}</Badge>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Dispatched</span>
                  </div>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>
                      <strong>Date:</strong> {new Date(user.dispatch_log[0].dispatched_at).toLocaleString()}
                    </p>
                    <p>
                      <strong>By:</strong> {user.dispatch_log[0].dispatched_by}
                    </p>
                    {user.dispatch_log[0].notes && (
                      <p>
                        <strong>Notes:</strong> {user.dispatch_log[0].notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
