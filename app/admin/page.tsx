import { AdminForm } from "./admin-form"
import { UserList } from "./user-list"
import { DeletedUsersList } from "./deleted-users-list"
import { ExcelUpload } from "./excel-upload"
import { AdminActions } from "./admin-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, QrCode } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Admin Actions - Top Level Buttons */}
      <AdminActions />

      <Tabs defaultValue="excel" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="excel" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">📊 Excel Upload</span>
            <span className="sm:hidden">Excel</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">➕ Create User</span>
            <span className="sm:hidden">Create</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">👥 Manage Users</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">🗑️ Deleted Users</span>
            <span className="sm:hidden">Deleted</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="space-y-4">
          <ExcelUpload />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Create New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <UserList />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          <DeletedUsersList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
