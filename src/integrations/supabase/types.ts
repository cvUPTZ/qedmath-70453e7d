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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_notes: {
        Row: {
          admin_id: string
          application_id: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          admin_id: string
          application_id: string
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          admin_id?: string
          application_id?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_breakdown: Json | null
          ai_evaluated_at: string | null
          ai_score: number | null
          case_study: Json | null
          cat_session_id: string | null
          contributed_curricula: string | null
          contribution_types: string[] | null
          created_at: string
          cv_path: string | null
          designed_official_exams: string | null
          email: string
          extra_files: Json | null
          full_name: string
          id: string
          institution_type: string | null
          levels_taught: string[] | null
          pedagogy_answers: Json | null
          phone: string
          practical_test: Json | null
          research_work: string | null
          status: Database["public"]["Enums"]["application_status"]
          subjects: string | null
          trained_teachers: string | null
          updated_at: string
          vision_answers: Json | null
          weekly_hours: number | null
          wilaya: string
          work_certificate_path: string | null
          workplace: string | null
          years_experience: number
        }
        Insert: {
          ai_breakdown?: Json | null
          ai_evaluated_at?: string | null
          ai_score?: number | null
          case_study?: Json | null
          cat_session_id?: string | null
          contributed_curricula?: string | null
          contribution_types?: string[] | null
          created_at?: string
          cv_path?: string | null
          designed_official_exams?: string | null
          email: string
          extra_files?: Json | null
          full_name: string
          id?: string
          institution_type?: string | null
          levels_taught?: string[] | null
          pedagogy_answers?: Json | null
          phone: string
          practical_test?: Json | null
          research_work?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string | null
          trained_teachers?: string | null
          updated_at?: string
          vision_answers?: Json | null
          weekly_hours?: number | null
          wilaya: string
          work_certificate_path?: string | null
          workplace?: string | null
          years_experience: number
        }
        Update: {
          ai_breakdown?: Json | null
          ai_evaluated_at?: string | null
          ai_score?: number | null
          case_study?: Json | null
          cat_session_id?: string | null
          contributed_curricula?: string | null
          contribution_types?: string[] | null
          created_at?: string
          cv_path?: string | null
          designed_official_exams?: string | null
          email?: string
          extra_files?: Json | null
          full_name?: string
          id?: string
          institution_type?: string | null
          levels_taught?: string[] | null
          pedagogy_answers?: Json | null
          phone?: string
          practical_test?: Json | null
          research_work?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string | null
          trained_teachers?: string | null
          updated_at?: string
          vision_answers?: Json | null
          weekly_hours?: number | null
          wilaya?: string
          work_certificate_path?: string | null
          workplace?: string | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "applications_cat_session_id_fkey"
            columns: ["cat_session_id"]
            isOneToOne: false
            referencedRelation: "cat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_sessions: {
        Row: {
          ability_by_dim: Json
          candidate_email: string
          candidate_name: string
          created_at: string
          final_score: number | null
          history: Json
          id: string
          max_questions: number
          questions_asked: number
          scores_by_dim: Json
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          ability_by_dim?: Json
          candidate_email: string
          candidate_name: string
          created_at?: string
          final_score?: number | null
          history?: Json
          id?: string
          max_questions?: number
          questions_asked?: number
          scores_by_dim?: Json
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          ability_by_dim?: Json
          candidate_email?: string
          candidate_name?: string
          created_at?: string
          final_score?: number | null
          history?: Json
          id?: string
          max_questions?: number
          questions_asked?: number
          scores_by_dim?: Json
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      application_status:
        | "new"
        | "reviewing"
        | "interview"
        | "trial"
        | "accepted"
        | "rejected"
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
      app_role: ["admin", "user"],
      application_status: [
        "new",
        "reviewing",
        "interview",
        "trial",
        "accepted",
        "rejected",
      ],
    },
  },
} as const
