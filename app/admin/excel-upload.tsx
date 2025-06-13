"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { bulkCreateUsersFlexible } from "../actions/user-actions"
import { Upload, Download, FileSpreadsheet, FileUp } from "lucide-react"
import * as XLSX from "xlsx"

interface FlexibleUser {
  name: string
  email: string
  phone: string
  role: string
  user_type: string
  college_id?: string
  [key: string]: any // Allow any additional fields
}

interface UploadResult {
  success: boolean
  created: number
  failed: number
  errors: string[]
  users?: any[]
}

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [parsedData, setParsedData] = useState<FlexibleUser[]>([])
  const [generatingQR, setGeneratingQR] = useState(false)

  // Enhanced smart field mapping - detects common variations
  const detectField = (header: string): string => {
    const h = header.toLowerCase().trim()

    // Name detection
    if (h.includes("name") || h.includes("student") || h.includes("person") || h === "name") return "name"

    // Email detection
    if (h.includes("email") || h.includes("mail") || h === "email") return "email"

    // Phone detection
    if (h.includes("phone") || h.includes("mobile") || h.includes("contact") || h.includes("number") || h === "phone")
      return "phone"

    // Role detection - more specific patterns
    if (h === "role" || h === "roles" || h.includes("position") || h.includes("designation") || h.includes("category"))
      return "role"

    // User type detection
    if ((h.includes("type") || h.includes("user")) && !h.includes("role")) return "user_type"

    // College ID detection
    if (h.includes("id") || h.includes("registration") || h.includes("reg") || h.includes("roll") || h === "id")
      return "college_id"

    return header
  }

  // Enhanced smart value normalization with better role detection
  const normalizeValue = (value: any, field: string): string => {
    if (!value) return ""

    const str = String(value).trim()

    if (field === "role") {
      const lower = str.toLowerCase()

      console.log(`Normalizing role: "${str}" -> "${lower}"`) // Debug log

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

      // Check for participant variations
      if (lower.includes("participant") || lower.includes("attendee") || lower.includes("guest")) return "participants"

      // College related
      if (lower.includes("college") || lower.includes("student") || lower.includes("faculty")) return "college"

      // If no pattern matches, return the original value (don't default to participants here)
      console.log(`No pattern matched for role: "${str}", returning original value`) // Debug log
      return str
    }

    if (field === "user_type") {
      const lower = str.toLowerCase()
      if (lower.includes("student")) return "college_student"
      if (lower.includes("faculty") || lower.includes("teacher") || lower.includes("professor"))
        return "college_faculty"
      return "other"
    }

    return str
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setParsedData([])
      parseExcelFile(selectedFile)
    }
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          alert("Excel file must have at least a header row and one data row")
          return
        }

        // Get headers and detect fields
        const headers = (jsonData[0] as any[]).map((h) => String(h || "").trim())
        const fieldMapping: Record<number, string> = {}

        console.log("Original headers:", headers) // Debug log

        headers.forEach((header, index) => {
          fieldMapping[index] = detectField(header)
        })

        console.log("Field mapping:", fieldMapping) // Debug log

        // Process data rows
        const users: FlexibleUser[] = []
        const errors: string[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[]
          if (!row || row.every((cell) => !cell)) continue // Skip empty rows

          const user: any = {}

          // Map fields based on detection
          headers.forEach((header, index) => {
            const field = fieldMapping[index]
            const rawValue = row[index]
            const value = normalizeValue(rawValue, field)

            console.log(`Row ${i}, Header: "${header}", Field: "${field}", Raw: "${rawValue}", Normalized: "${value}"`) // Debug log

            if (field === "name") {
              user.name = value
            } else if (field === "email") {
              user.email = value
            } else if (field === "phone") {
              user.phone = value
            } else if (field === "role") {
              user.role = value
            } else if (field === "user_type") {
              user.user_type = value
            } else if (field === "college_id") {
              user.college_id = value
            } else {
              // Store original header as field name for unmapped columns
              user[header] = value
            }
          })

          // Auto-assign missing fields
          if (!user.name && user.email) {
            user.name = user.email.split("@")[0]
          }

          // Only assign default role if no role was found at all
          if (!user.role || user.role === "") {
            user.role = "participants"
            console.log(`No role found for user ${user.name}, defaulting to participants`) // Debug log
          } else {
            console.log(`Role found for user ${user.name}: "${user.role}"`) // Debug log
          }

          if (!user.user_type) {
            user.user_type = user.college_id ? "college_student" : "other"
          }

          // Validate essential fields
          if (!user.name || !user.email) {
            errors.push(`Row ${i + 1}: Missing name or email`)
            continue
          }

          if (!user.phone) {
            user.phone = "0000000000" // Default phone
          }

          console.log(`Final user object for ${user.name}:`, user) // Debug log

          users.push(user)
        }

        if (errors.length > 0 && errors.length < 5) {
          alert(`Found ${errors.length} errors:\n${errors.join("\n")}`)
        }

        console.log("All parsed users:", users) // Debug log
        setParsedData(users)
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        alert("Failed to parse Excel file. Please check the format.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Fixed handleUpload - no progress callback
  const handleUpload = async () => {
    if (!parsedData.length) return

    setUploading(true)
    setResult(null)

    try {
      console.log("Sending users to server:", parsedData) // Debug log
      // Call server action without progress callback
      const result = await bulkCreateUsersFlexible(parsedData)
      setResult(result)
    } catch (error) {
      console.error("Upload error:", error)
      setResult({
        success: false,
        created: 0,
        failed: parsedData.length,
        errors: ["Upload failed due to an unexpected error"],
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadQRCodes = async (users: any[]) => {
    if (!users.length) return

    setGeneratingQR(true)
    try {
      // Import JSZip and generateQRCode dynamically
      const JSZip = (await import("jszip")).default
      const { generateQRCode } = await import("@/lib/qr-utils")

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
    } catch (error) {
      console.error("QR generation error:", error)
      alert("Failed to generate QR codes")
    } finally {
      setGeneratingQR(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Smart Excel Upload - Any Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">🎉 Upload ANY Excel Format!</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>
                ✅ <strong>No specific format required</strong> - I'll detect your columns automatically
              </p>
              <p>
                ✅ <strong>Smart detection</strong> - Finds Name, Email, Phone, Role, ID columns
              </p>
              <p>
                ✅ <strong>Role detection</strong> - Supports VIP, VVIP, Core, Volunteer, Participants, College
              </p>
              <p>
                ✅ <strong>Auto-fills missing data</strong> - Assigns defaults for missing fields
              </p>
            </div>
          </div>

          {/* Debug info */}
          {parsedData.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2">🔍 Detection Debug Info</h4>
              <div className="text-xs text-blue-700">
                <p>Open browser console (F12) to see detailed field mapping and role detection logs</p>
                <p>This will help identify why roles might not be detected correctly</p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Your Excel File (.xlsx, .xls)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">Click to select Excel file or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Supports .xlsx and .xls files</p>
              </label>
              {file && (
                <div className="mt-3 text-sm">
                  <span className="font-medium">Selected file:</span> {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">✅ Smart Detection Results</h3>
                <Badge>{parsedData.length} users detected</Badge>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Phone</th>
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((user, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{user.name}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.phone}</td>
                        <td className="p-2">
                          <Badge variant={user.role === "participants" ? "secondary" : "default"} className="text-xs">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-2">{user.user_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="p-2 text-center text-gray-500 bg-gray-50">
                    ... and {parsedData.length - 5} more users
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating users and generating QR codes...</span>
                    <span>Processing...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "50%" }}></div>
                  </div>
                </div>
              )}

              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Processing..." : `Create ${parsedData.length} Users & Generate QRs`}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                  <div className="text-sm text-green-700">Successfully Created</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && result.users && result.users.length > 0 && (
                <Button
                  onClick={() => handleDownloadQRCodes(result.users)}
                  disabled={generatingQR}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generatingQR ? "Generating QR Codes..." : `Download ${result.users.length} Generated QR Codes`}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
