import QRCode from "qrcode"

export interface UserData {
  id: string
  name: string
  email: string
  phone: string
  role: "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college"
  user_type: "college_student" | "college_faculty" | "other"
  college_id?: string
}

export async function generateQRCode(userData: UserData): Promise<string> {
  try {
    const qrData = JSON.stringify(userData)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export function parseQRData(qrData: string): UserData | null {
  try {
    const parsed = JSON.parse(qrData)
    if (parsed.id && parsed.name && parsed.email) {
      return parsed as UserData
    }
    return null
  } catch (error) {
    console.error("Error parsing QR data:", error)
    return null
  }
}
