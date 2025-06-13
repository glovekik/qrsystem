import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          role: "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college"
          user_type: "college_student" | "college_faculty" | "other"
          college_id: string | null
          qr_code_data: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          role: "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college"
          user_type: "college_student" | "college_faculty" | "other"
          college_id?: string | null
          qr_code_data: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          role?: "VIP" | "VVIP" | "Core" | "volunteer" | "participants" | "college"
          user_type?: "college_student" | "college_faculty" | "other"
          college_id?: string | null
          qr_code_data?: string
          created_at?: string
          updated_at?: string
        }
      }
      dispatch_log: {
        Row: {
          id: string
          user_id: string
          dispatched_at: string
          dispatched_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          dispatched_at?: string
          dispatched_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          dispatched_at?: string
          dispatched_by?: string | null
          notes?: string | null
        }
      }
    }
  }
}
