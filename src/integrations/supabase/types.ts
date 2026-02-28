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
      agreement_periods: {
        Row: {
          age_group: string
          created_at: string
          end_date: string | null
          hourly_rate: number
          id: string
          monthly_rate: number
          org_id: string
          period_label: string
          position_id: string
          skill_group_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string
          created_at?: string
          end_date?: string | null
          hourly_rate?: number
          id?: string
          monthly_rate?: number
          org_id: string
          period_label?: string
          position_id: string
          skill_group_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          end_date?: string | null
          hourly_rate?: number
          id?: string
          monthly_rate?: number
          org_id?: string
          period_label?: string
          position_id?: string
          skill_group_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_periods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_periods_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_periods_skill_group_id_fkey"
            columns: ["skill_group_id"]
            isOneToOne: false
            referencedRelation: "skill_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      app_launcher_config: {
        Row: {
          apps: Json
          created_at: string
          id: string
          org_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          apps?: Json
          created_at?: string
          id?: string
          org_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          apps?: Json
          created_at?: string
          id?: string
          org_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_launcher_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string
          org_id: string
          release_date: string
          release_time_utc: string
          release_type: string
          sequence_number: number
          status: string
          version_tag: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          org_id: string
          release_date?: string
          release_time_utc?: string
          release_type?: string
          sequence_number: number
          status?: string
          version_tag: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          org_id?: string
          release_date?: string
          release_time_utc?: string
          release_type?: string
          sequence_number?: number
          status?: string
          version_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          org_id: string
          record_id: string | null
          summary: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id: string
          record_id?: string | null
          summary?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string
          record_id?: string | null
          summary?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          bic_code: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bic_code?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bic_code?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          bankgiro: string | null
          ceo_name: string | null
          city: string | null
          company_type: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          org_id: string
          org_number: string | null
          phone: string | null
          postcode: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bankgiro?: string | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_id: string
          org_number?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bankgiro?: string | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_id?: string
          org_number?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_id_settings: {
        Row: {
          created_at: string
          id: string
          include_year: boolean
          next_number: number
          org_id: string
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
          org_id: string
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
          org_id?: string
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_id_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_id_year_counters: {
        Row: {
          created_at: string
          id: string
          issued_count: number
          next_number: number
          org_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          issued_count?: number
          next_number?: number
          org_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          issued_count?: number
          next_number?: number
          org_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_id_year_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_schedules: {
        Row: {
          contract_id: string
          created_at: string
          day_type: string
          end_time: string | null
          holiday_name_en: string | null
          holiday_name_sv: string | null
          id: string
          org_id: string
          schedule_date: string
          scheduled_hours: number
          start_time: string | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          day_type?: string
          end_time?: string | null
          holiday_name_en?: string | null
          holiday_name_sv?: string | null
          id?: string
          org_id: string
          schedule_date: string
          scheduled_hours?: number
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          day_type?: string
          end_time?: string | null
          holiday_name_en?: string | null
          holiday_name_sv?: string | null
          id?: string
          org_id?: string
          schedule_date?: string
          scheduled_hours?: number
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          company_id: string | null
          contract_code: string | null
          created_at: string
          employee_id: string
          employee_signature_url: string | null
          employee_signed_at: string | null
          employer_signature_url: string | null
          employer_signed_at: string | null
          end_date: string | null
          form_data: Json | null
          id: string
          org_id: string
          salary: number | null
          season_year: string | null
          sent_for_signing_at: string | null
          signed_at: string | null
          signing_status: string
          signing_token: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contract_code?: string | null
          created_at?: string
          employee_id: string
          employee_signature_url?: string | null
          employee_signed_at?: string | null
          employer_signature_url?: string | null
          employer_signed_at?: string | null
          end_date?: string | null
          form_data?: Json | null
          id?: string
          org_id: string
          salary?: number | null
          season_year?: string | null
          sent_for_signing_at?: string | null
          signed_at?: string | null
          signing_status?: string
          signing_token?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contract_code?: string | null
          created_at?: string
          employee_id?: string
          employee_signature_url?: string | null
          employee_signed_at?: string | null
          employer_signature_url?: string | null
          employer_signed_at?: string | null
          end_date?: string | null
          form_data?: Json | null
          id?: string
          org_id?: string
          salary?: number | null
          season_year?: string | null
          sent_for_signing_at?: string | null
          signed_at?: string | null
          signing_status?: string
          signing_token?: string | null
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
          {
            foreignKeyName: "contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_id_settings: {
        Row: {
          created_at: string
          id: string
          next_number: number
          org_id: string
          padding: number
          prefix: string
          separator: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_number?: number
          org_id: string
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_number?: number
          org_id?: string
          padding?: number
          prefix?: string
          separator?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_id_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string
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
          org_id: string
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
          org_id?: string
          personal_info?: Json | null
          phone?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_template_fields: {
        Row: {
          created_at: string
          field_key: string
          field_type: string
          id: string
          is_required: boolean
          is_visible: boolean
          label_en: string
          label_ro: string
          label_sv: string
          label_th: string
          label_uk: string
          org_id: string
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_key: string
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label_en: string
          label_ro?: string
          label_sv: string
          label_th?: string
          label_uk?: string
          org_id: string
          section: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_key?: string
          field_type?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          label_en?: string
          label_ro?: string
          label_sv?: string
          label_th?: string
          label_uk?: string
          org_id?: string
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_template_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          employee_id: string | null
          expires_at: string
          id: string
          language: string
          org_id: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          language?: string
          org_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          type: Database["public"]["Enums"]["invitation_type"]
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          language?: string
          org_id?: string
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
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          org_number: string | null
          org_type: string
          phone: string | null
          postcode: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          org_number?: string | null
          org_type?: string
          phone?: string | null
          postcode?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          org_number?: string | null
          org_type?: string
          phone?: string | null
          postcode?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pending_role_assignments: {
        Row: {
          app_access: string[] | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          app_access?: string[] | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          app_access?: string[] | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label_en: string
          label_ro: string
          label_sv: string
          label_th: string
          label_uk: string
          org_id: string
          sort_order: number
          type_label_en: string
          type_label_ro: string
          type_label_sv: string
          type_label_th: string
          type_label_uk: string
          type_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_en: string
          label_ro?: string
          label_sv: string
          label_th?: string
          label_uk?: string
          org_id: string
          sort_order?: number
          type_label_en?: string
          type_label_ro?: string
          type_label_sv?: string
          type_label_th?: string
          type_label_uk?: string
          type_number?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_ro?: string
          label_sv?: string
          label_th?: string
          label_uk?: string
          org_id?: string
          sort_order?: number
          type_label_en?: string
          type_label_ro?: string
          type_label_sv?: string
          type_label_th?: string
          type_label_uk?: string
          type_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_signature_url: string | null
          email: string | null
          full_name: string | null
          id: string
          last_sign_in_at: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_signature_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_signature_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_app_access: {
        Row: {
          app_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      role_sidebar_access: {
        Row: {
          app_id: string
          created_at: string
          id: string
          menu_item_id: string
          role: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          menu_item_id: string
          role: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string
          role?: string
        }
        Relationships: []
      }
      skill_groups: {
        Row: {
          created_at: string
          id: string
          label_en: string
          label_ro: string
          label_sv: string
          label_th: string
          label_uk: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_en: string
          label_ro?: string
          label_sv: string
          label_th?: string
          label_uk?: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label_en?: string
          label_ro?: string
          label_sv?: string
          label_th?: string
          label_uk?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_access: {
        Row: {
          app_id: string
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
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
      assign_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      get_contract_for_signing: {
        Args: { _token: string }
        Returns: {
          company_address: string
          company_city: string
          company_name: string
          company_org_number: string
          company_postcode: string
          contract_code: string
          contract_id: string
          employee_email: string
          employee_first_name: string
          employee_last_name: string
          employee_phone: string
          employee_signed_at: string
          employer_signed_at: string
          end_date: string
          form_data: Json
          salary: number
          season_year: string
          signing_status: string
          start_date: string
        }[]
      }
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
          language: string
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
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      is_org_member_current: { Args: { _org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_auth_event: {
        Args: {
          _action: string
          _summary?: string
          _user_email: string
          _user_id: string
        }
        Returns: undefined
      }
      set_org_context: { Args: { _org_id: string }; Returns: undefined }
      submit_employee_signature: {
        Args: { _signature_url: string; _token: string }
        Returns: undefined
      }
      submit_employer_signature: {
        Args: { _contract_id: string; _signature_url: string }
        Returns: undefined
      }
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
      app_role:
        | "admin"
        | "hr_admin"
        | "hr_staff"
        | "user"
        | "org_admin"
        | "team_leader"
        | "hr_manager"
        | "project_manager"
        | "payroll_manager"
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
      app_role: [
        "admin",
        "hr_admin",
        "hr_staff",
        "user",
        "org_admin",
        "team_leader",
        "hr_manager",
        "project_manager",
        "payroll_manager",
      ],
      employee_status: ["INVITED", "ONBOARDING", "ACTIVE", "INACTIVE"],
      invitation_status: ["PENDING", "SENT", "ACCEPTED", "EXPIRED"],
      invitation_type: ["NEW_HIRE", "CONTRACT_RENEWAL"],
    },
  },
} as const
