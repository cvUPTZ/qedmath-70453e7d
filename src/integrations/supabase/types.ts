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
          fill_duration_seconds: number | null
          full_name: string
          id: string
          institution_type: string | null
          levels_taught: string[] | null
          pedagogy_answers: Json | null
          phone: string
          practical_test: Json | null
          research_work: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          subjects: string | null
          submitted_at: string | null
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
          fill_duration_seconds?: number | null
          full_name: string
          id?: string
          institution_type?: string | null
          levels_taught?: string[] | null
          pedagogy_answers?: Json | null
          phone: string
          practical_test?: Json | null
          research_work?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string | null
          submitted_at?: string | null
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
          fill_duration_seconds?: number | null
          full_name?: string
          id?: string
          institution_type?: string | null
          levels_taught?: string[] | null
          pedagogy_answers?: Json | null
          phone?: string
          practical_test?: Json | null
          research_work?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string | null
          submitted_at?: string | null
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
      curriculum_topics: {
        Row: {
          code: string
          created_at: string
          grade: string
          id: string
          kind: string
          name_ar: string
          parent_id: string | null
          sort_order: number
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          grade?: string
          id?: string
          kind?: string
          name_ar: string
          parent_id?: string | null
          sort_order?: number
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          grade?: string
          id?: string
          kind?: string
          name_ar?: string
          parent_id?: string | null
          sort_order?: number
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "curriculum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_sessions: {
        Row: {
          completed_at: string | null
          evidence: Json
          id: string
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["session_status"]
          student_label: string | null
          target_skill_id: string | null
          trail: Json
        }
        Insert: {
          completed_at?: string | null
          evidence?: Json
          id?: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          student_label?: string | null
          target_skill_id?: string | null
          trail?: Json
        }
        Update: {
          completed_at?: string | null
          evidence?: Json
          id?: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          student_label?: string | null
          target_skill_id?: string | null
          trail?: Json
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_sessions_target_skill_id_fkey"
            columns: ["target_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          created_at: string
          id: string
          level: string
          skill_id: string
          sort_order: number
          statement_ar: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          skill_id: string
          sort_order?: number
          statement_ar: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          skill_id?: string
          sort_order?: number
          statement_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      misconceptions: {
        Row: {
          code: string
          created_at: string
          description_ar: string
          hypothesis_ar: string | null
          id: string
          skill_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description_ar: string
          hypothesis_ar?: string | null
          id?: string
          skill_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description_ar?: string
          hypothesis_ar?: string | null
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "misconceptions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      question_reviews: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          question_id: string
          reviewer_id: string | null
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          question_id: string
          reviewer_id?: string | null
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          question_id?: string
          reviewer_id?: string | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reviews_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          ai_meta: Json | null
          bloom: string
          correct_index: number
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["question_kind"]
          options: Json
          parent_gold_id: string | null
          probe_key: string | null
          probe_tree: Json | null
          prompt_ar: string
          skill_id: string | null
          status: Database["public"]["Enums"]["question_status"]
          times_correct: number
          times_used: number
          updated_at: string
        }
        Insert: {
          ai_meta?: Json | null
          bloom?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["question_kind"]
          options?: Json
          parent_gold_id?: string | null
          probe_key?: string | null
          probe_tree?: Json | null
          prompt_ar: string
          skill_id?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          times_correct?: number
          times_used?: number
          updated_at?: string
        }
        Update: {
          ai_meta?: Json | null
          bloom?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["question_kind"]
          options?: Json
          parent_gold_id?: string | null
          probe_key?: string | null
          probe_tree?: Json | null
          prompt_ar?: string
          skill_id?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          times_correct?: number
          times_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_parent_gold_id_fkey"
            columns: ["parent_gold_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      session_answers: {
        Row: {
          chosen_index: number | null
          created_at: string
          id: string
          is_correct: boolean | null
          is_probe: boolean
          ms_elapsed: number | null
          probe_node_id: string | null
          question_id: string | null
          session_id: string
        }
        Insert: {
          chosen_index?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_probe?: boolean
          ms_elapsed?: number | null
          probe_node_id?: string | null
          question_id?: string | null
          session_id: string
        }
        Update: {
          chosen_index?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_probe?: boolean
          ms_elapsed?: number | null
          probe_node_id?: string | null
          question_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          bloom: string
          code: string
          created_at: string
          description_ar: string | null
          id: string
          name_ar: string
          prerequisites: string[]
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          bloom?: string
          code: string
          created_at?: string
          description_ar?: string | null
          id?: string
          name_ar: string
          prerequisites?: string[]
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          bloom?: string
          code?: string
          created_at?: string
          description_ar?: string | null
          id?: string
          name_ar?: string
          prerequisites?: string[]
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_topics"
            referencedColumns: ["id"]
          },
        ]
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
      visits: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          id: string
          ip: string | null
          latitude: number | null
          longitude: number | null
          path: string
          referrer: string | null
          referrer_source: string | null
          region: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip?: string | null
          latitude?: number | null
          longitude?: number | null
          path: string
          referrer?: string | null
          referrer_source?: string | null
          region?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip?: string | null
          latitude?: number | null
          longitude?: number | null
          path?: string
          referrer?: string | null
          referrer_source?: string | null
          region?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
      question_kind: "gold" | "ai" | "probe"
      question_status:
        | "draft"
        | "ai_generated"
        | "ai_reviewed"
        | "expert_reviewed"
        | "approved"
        | "retired"
      session_status: "running" | "completed" | "abandoned"
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
      question_kind: ["gold", "ai", "probe"],
      question_status: [
        "draft",
        "ai_generated",
        "ai_reviewed",
        "expert_reviewed",
        "approved",
        "retired",
      ],
      session_status: ["running", "completed", "abandoned"],
    },
  },
} as const
