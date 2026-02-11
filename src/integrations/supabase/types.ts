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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          org_number: string | null
          postcode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          org_number?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          org_number?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_id_settings: {
        Row: {
          created_at: string
          id: string
          include_year: boolean
          next_number: number
          padding: number
          prefix: string
          separator: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          include_year?: boolean
          next_number?: number
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          include_year?: boolean
          next_number?: number
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          company_id: string | null
          contract_code: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          form_data: Json | null
          id: string
          salary: number | null
          season_year: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contract_code?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          form_data?: Json | null
          id?: string
          salary?: number | null
          season_year?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contract_code?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          form_data?: Json | null
          id?: string
          salary?: number | null
          season_year?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_id_settings: {
        Row: {
          created_at: string
          id: string
          next_number: number
          padding: number
          prefix: string
          separator: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string
          employee_code: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          personal_info: Json | null
          phone: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          employee_code?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          personal_info?: Json | null
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          employee_code?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          personal_info?: Json | null
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          employee_id: string | null
          expires_at: string
          id: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          type?: Database["public"]["Enums"]["invitation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          employee_email: string
          employee_first_name: string
          employee_id: string
          employee_last_name: string
          employee_middle_name: string
          employee_personal_info: Json
          expires_at: string
          id: string
          status: Database["public"]["Enums"]["invitation_status"]
          type: Database["public"]["Enums"]["invitation_type"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr_user: { Args: never; Returns: boolean }
      submit_onboarding: {
        Args: {
          _first_name: string
          _last_name: string
          _middle_name: string
          _personal_info: Json
          _token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "hr_admin" | "hr_staff" | "user"
      employee_status: "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE"
      invitation_status: "PENDING" | "SENT" | "ACCEPTED" | "EXPIRED"
      invitation_type: "NEW_HIRE" | "CONTRACT_RENEWAL"
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
      app_role: ["admin", "hr_admin", "hr_staff", "user"],
      employee_status: ["INVITED", "ONBOARDING", "ACTIVE", "INACTIVE"],
      invitation_status: ["PENDING", "SENT", "ACCEPTED", "EXPIRED"],
      invitation_type: ["NEW_HIRE", "CONTRACT_RENEWAL"],
    },
  },
} as const
