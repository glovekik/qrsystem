// import { AdminForm } from "./admin-form"
// import { UserList } from "./user-list"
// import { DeletedUsersList } from "./deleted-users-list"
// import { ExcelUpload } from "./excel-upload"
// import { AdminActions } from "./admin-actions"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Users, QrCode } from "lucide-react"

// export default function AdminPage() {
//   const Admin_User= 'ai4andhrapolice-admin';
//   const Admin_password = 'Admin@123';
//   return (
//     <>
//     <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
//       <div className="flex items-center gap-3 mb-4 sm:mb-6">
//         <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
//         <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
//       </div>

//       {/* Admin Actions - Top Level Buttons */}
//       <AdminActions />

//       <Tabs defaultValue="excel" className="w-full">
//         <TabsList className="grid w-full grid-cols-4 h-auto">
//           <TabsTrigger value="excel" className="text-xs sm:text-sm py-2">
//             <span className="hidden sm:inline">📊 Excel Upload</span>
//             <span className="sm:hidden">Excel</span>
//           </TabsTrigger>
//           <TabsTrigger value="create" className="text-xs sm:text-sm py-2">
//             <span className="hidden sm:inline">➕ Create User</span>
//             <span className="sm:hidden">Create</span>
//           </TabsTrigger>
//           <TabsTrigger value="manage" className="text-xs sm:text-sm py-2">
//             <span className="hidden sm:inline">👥 Manage Users</span>
//             <span className="sm:hidden">Manage</span>
//           </TabsTrigger>
//           <TabsTrigger value="deleted" className="text-xs sm:text-sm py-2">
//             <span className="hidden sm:inline">🗑️ Deleted Users</span>
//             <span className="sm:hidden">Deleted</span>
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="excel" className="space-y-4">
//           <ExcelUpload />
//         </TabsContent>

//         <TabsContent value="create" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
//                 <Users className="h-5 w-5" />
//                 Create New User
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <AdminForm />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="manage" className="space-y-4">
//           <UserList />
//         </TabsContent>

//         <TabsContent value="deleted" className="space-y-4">
//           <DeletedUsersList />
//         </TabsContent>
//       </Tabs>
//     </div></>
//   )
// }

'use client';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminForm } from "./admin-form";
import { UserList } from "./user-list";
import { DeletedUsersList } from "./deleted-users-list";
import { ExcelUpload } from "./excel-upload";
import { AdminActions } from "./admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, QrCode, Eye, EyeOff } from "lucide-react";

export default function AdminPage() {
  const Admin_password = 'Admin@123';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (password === Admin_password) {
      setIsAuthenticated(true);
    } else {
      router.push('/');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        </div>

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
    );
  } else {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-8 shadow-lg rounded-lg bg-white">
          <CardHeader className="text-center mb-6">
            <CardTitle className="text-2xl font-semibold text-gray-800">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
              >
                Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}