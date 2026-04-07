export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_generations: {
        Row: {
          id: string
          user_id: string
          video_url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_remaining_generations: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}