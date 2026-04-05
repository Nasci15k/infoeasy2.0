export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_dashboard_stats: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          stat_key: string
          stat_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          stat_key: string
          stat_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          stat_key?: string
          stat_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_stats_override: {
        Row: {
          created_at: string | null
          id: string
          override_value: number
          stat_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          override_value: number
          stat_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          override_value?: number
          stat_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      apis: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_status_check: string | null
          name: string
          status_error: string | null
          status_response_time: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_status_check?: string | null
          name: string
          status_error?: string | null
          status_response_time?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_status_check?: string | null
          name?: string
          status_error?: string | null
          status_response_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apis_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "api_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan_expires_at: string | null
          plan_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          seller_code: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan_expires_at?: string | null
          plan_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seller_code?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan_expires_at?: string | null
          plan_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seller_code?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      query_history: {
        Row: {
          api_id: string
          created_at: string
          id: string
          query_value: string
          response_data: Json | null
          user_id: string
        }
        Insert: {
          api_id: string
          created_at?: string
          id?: string
          query_value: string
          response_data?: Json | null
          user_id: string
        }
        Update: {
          api_id?: string
          created_at?: string
          id?: string
          query_value?: string
          response_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_history_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string
          id: string
          seller_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seller_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seller_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_limits: {
        Row: {
          created_at: string
          daily_count: number
          daily_limit: number
          id: string
          last_reset_daily: string
          last_reset_monthly: string
          monthly_count: number
          monthly_limit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_count?: number
          daily_limit?: number
          id?: string
          last_reset_daily?: string
          last_reset_monthly?: string
          monthly_count?: number
          monthly_limit?: number
          user_id: string
        }
        Update: {
          created_at?: string
          daily_count?: number
          daily_limit?: number
          id?: string
          last_reset_daily?: string
          last_reset_monthly?: string
          monthly_count?: number
          monthly_limit?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_role: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { user_id: string }; Returns: boolean }
      reset_daily_limits: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "teste" | "usuario" | "usuario_premium" | "revendedor" | "admin"
      user_role: "user" | "admin"
      user_status: "pending" | "approved" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["teste", "usuario", "usuario_premium", "revendedor", "admin"],
      user_role: ["user", "admin"],
      user_status: ["pending", "approved", "suspended"],
    },
  },
} as const
