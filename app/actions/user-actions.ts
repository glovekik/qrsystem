"use server"

import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/qr-utils"
import { generateQRCode } from "@/lib/qr-utils"
import { revalidatePath } from "next/cache"
import JSZip from "jszip"

export async function createUser(formData: FormData) {
  try {
    const userData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college",
      user_type: formData.get("user_type") as "college_student" | "college_faculty" | "other",
      college_id: (formData.get("college_id") as string) || null,
    }

    // Generate QR code data
    const tempUserData: UserData = {
      id: "", // Will be set after insertion
      ...userData,
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        ...userData,
        qr_code_data: JSON.stringify(tempUserData),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return { success: false, error: "Failed to create user" }
    }

    // Update QR code data with actual ID
    const finalUserData: UserData = {
      ...tempUserData,
      id: data.id,
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        qr_code_data: JSON.stringify(finalUserData),
      })
      .eq("id", data.id)

    if (updateError) {
      console.error("QR update error:", updateError)
    }

    revalidatePath("/admin")
    return { success: true, user: data }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function bulkCreateUsersFlexible(
  users: Array<{
    name: string
    email: string
    phone: string
    role: string
    user_type?: string
    college_id?: string
    [key: string]: any
  }>,
) {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: [] as string[],
    users: [] as any[],
  }

  try {
    const totalUsers = users.length

    for (let i = 0; i < totalUsers; i++) {
      const userData = users[i]

      try {
        console.log(`Processing user ${i + 1}: ${userData.name}, role: "${userData.role}"`) // Debug log

        // Normalize and validate data
        const normalizedUser = {
          name: userData.name || "Unknown",
          email: userData.email || `user${i}@example.com`,
          phone: userData.phone || "0000000000",
          role: normalizeRole(userData.role),
          user_type: normalizeUserType(userData.user_type || "other"),
          college_id: userData.college_id || null,
        }

        console.log(`Normalized user ${i + 1}: role "${userData.role}" -> "${normalizedUser.role}"`) // Debug log

        // Create temporary user data for QR code
        const tempUserData: UserData = {
          id: "",
          ...normalizedUser,
        }

        // Insert the user
        const { data, error } = await supabase
          .from("users")
          .insert({
            ...normalizedUser,
            qr_code_data: JSON.stringify(tempUserData),
          })
          .select()

        if (error) {
          console.error(`Error creating user ${i + 1}:`, error)
          results.failed++
          results.errors.push(`User ${i + 1} (${userData.name}): ${error.message}`)
          continue
        }

        if (data && data.length > 0) {
          const user = data[0]

          // Update QR code with actual ID
          const finalUserData: UserData = {
            ...tempUserData,
            id: user.id,
          }

          await supabase
            .from("users")
            .update({
              qr_code_data: JSON.stringify(finalUserData),
            })
            .eq("id", user.id)

          results.created++
          results.users.push(user)
        }
      } catch (error) {
        console.error(`Error processing user ${i + 1}:`, error)
        results.failed++
        results.errors.push(`User ${i + 1} (${userData.name}): Unexpected error`)
      }

      // Small delay to prevent overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    if (results.failed > 0) {
      results.success = false
    }

    revalidatePath("/admin")
    return results
  } catch (error) {
    console.error("Bulk upload error:", error)
    return {
      success: false,
      created: 0,
      failed: users.length,
      errors: ["An unexpected error occurred during bulk upload"],
      users: [],
    }
  }
}

function normalizeRole(role: string): "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college" {
  console.log(`Server normalizeRole input: "${role}"`) // Debug log

  if (!role) {
    console.log("No role provided, defaulting to participants")
    return "participants"
  }

  const lower = role.toLowerCase().trim()
  console.log(`Server normalizeRole processing: "${lower}"`) // Debug log

  // Exact matches first
  if (lower === "vvip") return "VVIP"
  if (lower === "vip") return "VIP"
  if (lower === "core") return "Core"
  if (lower === "volunteer") return "volunteer"
  if (lower === "participants" || lower === "participant") return "participants"
  if (lower === "college") return "college"

  // Pattern matches
  if (lower.includes("vvip") || (lower.includes("very") && lower.includes("vip"))) return "VVIP"
  if (lower.includes("vip") && !lower.includes("vvip")) return "VIP"
  if (lower.includes("core")) return "Core"
  if (lower.includes("volunteer")) return "volunteer"
  if (lower.includes("participant")) return "participants"
  if (lower.includes("college") || lower.includes("student") || lower.includes("faculty")) return "college"

  console.log(`No pattern matched for "${role}", defaulting to participants`)
  return "participants"
}

function normalizeUserType(userType: string): "college_student" | "college_faculty" | "other" {
  if (!userType) return "other"

  const lower = userType.toLowerCase()
  if (lower.includes("student")) return "college_student"
  if (lower.includes("faculty") || lower.includes("teacher") || lower.includes("professor")) return "college_faculty"
  return "other"
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Server error:", error)
    return []
  }
}

export async function downloadFilteredQRCodes(users: any[]) {
  const zip = new JSZip()
  const qrFolder = zip.folder("qr-codes")

  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    try {
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
    }
  }

  // Generate and download zip
  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement("a")
  a.href = url
  a.download = `qr-codes-${users.length}-users-${new Date().toISOString().split("T")[0]}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// NEW: Bulk Delete All Users
export async function bulkDeleteAllUsers(deletedBy: string, reason: string) {
  try {
    console.log("Starting bulk delete operation...")

    // First, get all users with their dispatch records
    const { data: allUsers, error: fetchError } = await supabase.from("users").select(`
        *,
        dispatch_log (
          id,
          dispatched_at,
          dispatched_by,
          notes
        )
      `)

    if (fetchError) {
      console.error("Error fetching users for bulk delete:", fetchError)
      return { success: false, error: "Failed to fetch users for deletion" }
    }

    if (!allUsers || allUsers.length === 0) {
      return { success: false, error: "No users found to delete" }
    }

    console.log(`Found ${allUsers.length} users to delete`)

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // Process each user
    for (const user of allUsers) {
      try {
        // Backup user data to deleted_users table
        const { error: backupError } = await supabase.from("deleted_users").insert({
          original_user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_phone: user.phone || "",
          user_role: user.role,
          user_type: user.user_type,
          college_id: user.college_id || "",
          user_data: JSON.stringify(user),
          dispatch_records: JSON.stringify(user.dispatch_log || []),
          deleted_by: deletedBy,
          deletion_reason: reason,
          had_dispatch_records: user.dispatch_log && user.dispatch_log.length > 0,
        })

        if (backupError) {
          console.error(`Error backing up user ${user.name}:`, backupError)
          errors.push(`Failed to backup ${user.name}: ${backupError.message}`)
          failCount++
          continue
        }

        // Delete the user (cascade will handle dispatch_log)
        const { error: deleteError } = await supabase.from("users").delete().eq("id", user.id)

        if (deleteError) {
          console.error(`Error deleting user ${user.name}:`, deleteError)
          errors.push(`Failed to delete ${user.name}: ${deleteError.message}`)
          failCount++
        } else {
          successCount++
        }
      } catch (error) {
        console.error(`Unexpected error processing user ${user.name}:`, error)
        errors.push(`Unexpected error for ${user.name}`)
        failCount++
      }
    }

    console.log(`Bulk delete completed: ${successCount} success, ${failCount} failed`)

    revalidatePath("/admin")
    revalidatePath("/dispatch")

    return {
      success: failCount === 0,
      deletedCount: successCount,
      failedCount: failCount,
      errors: errors,
    }
  } catch (error) {
    console.error("Bulk delete error:", error)
    return {
      success: false,
      error: "An unexpected error occurred during bulk delete",
      deletedCount: 0,
      failedCount: 0,
    }
  }
}

// NEW: Permanently Delete User from deleted_users table
export async function permanentlyDeleteUser(deletedUserId: string) {
  try {
    const { error } = await supabase.from("deleted_users").delete().eq("id", deletedUserId)

    if (error) {
      console.error("Error permanently deleting user:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function bulkCreateUsers(
  users: Array<{
    name: string
    email: string
    phone: string
    role: "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college"
    user_type: "college_student" | "college_faculty" | "other"
    college_id?: string
  }>,
) {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: [] as string[],
    users: [] as any[],
  }

  try {
    // Process users one by one to avoid database errors
    const totalUsers = users.length

    for (let i = 0; i < totalUsers; i++) {
      const userData = users[i]

      try {
        // Create temporary user data for QR code
        const tempUserData: UserData = {
          id: "", // Will be set after insertion
          ...userData,
          college_id: userData.college_id || null,
        }

        // Insert the user
        const { data, error } = await supabase
          .from("users")
          .insert({
            ...userData,
            college_id: userData.college_id || null,
            qr_code_data: JSON.stringify(tempUserData),
          })
          .select()

        if (error) {
          console.error(`Error creating user ${i + 1}:`, error)
          results.failed++
          results.errors.push(`User ${i + 1} (${userData.name}): ${error.message}`)
          continue
        }

        if (data && data.length > 0) {
          const user = data[0]

          // Update QR code with actual ID
          const finalUserData: UserData = {
            ...tempUserData,
            id: user.id,
          }

          await supabase
            .from("users")
            .update({
              qr_code_data: JSON.stringify(finalUserData),
            })
            .eq("id", user.id)

          results.created++
          results.users.push(user)
        }
      } catch (error) {
        console.error(`Error processing user ${i + 1}:`, error)
        results.failed++
        results.errors.push(`User ${i + 1} (${userData.name}): Unexpected error`)
      }

      // Small delay to prevent overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (results.failed > 0) {
      results.success = false
    }

    revalidatePath("/admin")
    return results
  } catch (error) {
    console.error("Bulk upload error:", error)
    return {
      success: false,
      created: 0,
      failed: users.length,
      errors: ["An unexpected error occurred during bulk upload"],
      users: [],
    }
  }
}

export async function downloadBulkQRCodes(users: any[]) {
  const zip = new JSZip()
  const qrFolder = zip.folder("qr-codes")

  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    try {
      const userData = JSON.parse(user.qr_code_data)
      const qrDataUrl = await generateQRCode(userData)

      // Convert data URL to blob
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()

      // Add to zip with sanitized filename
      const filename = `${user.name.replace(/[^a-zA-Z0-9]/g, "_")}_${user.id.slice(0, 8)}.png`
      qrFolder?.file(filename, blob)
    } catch (error) {
      console.error(`Error generating QR for user ${user.name}:`, error)
    }
  }

  // Generate and download zip
  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement("a")
  a.href = url
  a.download = `qr-codes-${users.length}-users-${new Date().toISOString().split("T")[0]}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const userData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college",
      user_type: formData.get("user_type") as "college_student" | "college_faculty" | "other",
      college_id: (formData.get("college_id") as string) || null,
      updated_at: new Date().toISOString(),
    }

    const finalUserData: UserData = {
      id,
      ...userData,
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        qr_code_data: JSON.stringify(finalUserData),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return { success: false, error: "Failed to update user" }
    }

    revalidatePath("/admin")
    return { success: true, user: data }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function deleteUser(userId: string, deletedBy?: string, reason?: string) {
  try {
    console.log("Starting delete process for user:", userId)

    // First, get user details and dispatch records for backup
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select(`
        *,
        dispatch_log (
          id,
          dispatched_at,
          dispatched_by,
          notes
        )
      `)
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching user for deletion:", fetchError)
      return { success: false, error: "User not found" }
    }

    console.log("User data fetched:", userData)

    // Store deleted user data using simple text fields
    const { data: backupResult, error: backupError } = await supabase
      .from("deleted_users")
      .insert({
        original_user_id: userData.id,
        user_name: userData.name,
        user_email: userData.email,
        user_phone: userData.phone || "",
        user_role: userData.role,
        user_type: userData.user_type,
        college_id: userData.college_id || "",
        user_data: JSON.stringify(userData),
        dispatch_records: JSON.stringify(userData.dispatch_log || []),
        deleted_by: deletedBy || "Unknown",
        deletion_reason: reason || "No reason provided",
        had_dispatch_records: userData.dispatch_log && userData.dispatch_log.length > 0,
      })
      .select()
      .single()

    if (backupError) {
      console.error("Error backing up user data:", backupError)
      return { success: false, error: `Failed to backup user data: ${backupError.message}` }
    }

    console.log("Backup successful:", backupResult)

    // Now delete the user (this will cascade delete dispatch_log entries)
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      // If user deletion fails, we should also remove the backup
      await supabase.from("deleted_users").delete().eq("id", backupResult.id)
      return { success: false, error: `Failed to delete user: ${deleteError.message}` }
    }

    console.log("User deleted successfully")

    revalidatePath("/admin")
    revalidatePath("/dispatch")
    return { success: true, deletedUser: userData }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function getDeletedUsers() {
  try {
    const { data, error } = await supabase.from("deleted_users").select("*").order("deleted_at", { ascending: false })

    if (error) {
      console.error("Error fetching deleted users:", error)
      return { success: false, error: "Failed to fetch deleted users" }
    }

    return { success: true, deletedUsers: data }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function dispatchUser(userId: string, dispatchedBy: string, notes?: string) {
  try {
    const { data, error } = await supabase
      .from("dispatch_log")
      .insert({
        user_id: userId,
        dispatched_by: dispatchedBy,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Dispatch error:", error)
      return { success: false, error: "Failed to dispatch user" }
    }

    revalidatePath("/dispatch")
    return { success: true, dispatch: data }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function getUserByQRData(qrData: string) {
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
      .eq("qr_code_data", qrData)
      .single()

    if (error) {
      console.error("Query error:", error)
      return { success: false, error: "User not found" }
    }

    return { success: true, user: data }
  } catch (error) {
    console.error("Server error:", error)
    return { success: false, error: "Internal server error" }
  }
}
