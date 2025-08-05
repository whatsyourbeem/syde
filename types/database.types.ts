export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      club_members: {
        Row: {
          club_id: string;
          created_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          club_id: string;
          created_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          club_id?: string;
          created_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      clubs: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          thumbnail_url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          thumbnail_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          thumbnail_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "log_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      log_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          log_id: string;
          parent_comment_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          log_id: string;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          log_id?: string;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "log_comments_log_id_fkey";
            columns: ["log_id"];
            isOneToOne: false;
            referencedRelation: "logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "log_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "log_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "log_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      log_likes: {
        Row: {
          comment_id: string | null;
          created_at: string | null;
          id: string;
          log_id: string | null;
          user_id: string;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string | null;
          id?: string;
          log_id?: string | null;
          user_id: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string | null;
          id?: string;
          log_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "log_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "log_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "log_likes_log_id_fkey";
            columns: ["log_id"];
            isOneToOne: false;
            referencedRelation: "logs";
            referencedColumns: ["id"];
          }
        ];
      };
      logs: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      meetup_participants: {
        Row: {
          joined_at: string;
          meetup_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          meetup_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          meetup_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetup_participants_meetup_id_fkey";
            columns: ["meetup_id"];
            isOneToOne: false;
            referencedRelation: "meetups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetup_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      meetups: {
        Row: {
          category: Database["public"]["Enums"]["meetup_category_enum"];
          club_id: string | null;
          created_at: string;
          description: string | null;
          end_datetime: string | null;
          id: string;
          location_description: string | null;
          location_type: Database["public"]["Enums"]["meetup_location_type_enum"];
          max_participants: number | null;
          organizer_id: string;
          start_datetime: string | null;
          status: Database["public"]["Enums"]["meetup_status_enum"];
          thumbnail_url: string | null;
          title: string;
        };
        Insert: {
          category?: Database["public"]["Enums"]["meetup_category_enum"];
          club_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_datetime?: string | null;
          id?: string;
          location_description?: string | null;
          location_type?: Database["public"]["Enums"]["meetup_location_type_enum"];
          max_participants?: number | null;
          organizer_id: string;
          start_datetime?: string | null;
          status?: Database["public"]["Enums"]["meetup_status_enum"];
          thumbnail_url?: string | null;
          title: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["meetup_category_enum"];
          club_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_datetime?: string | null;
          id?: string;
          location_description?: string | null;
          location_type?: Database["public"]["Enums"]["meetup_location_type_enum"];
          max_participants?: number | null;
          organizer_id?: string;
          start_datetime?: string | null;
          status?: Database["public"]["Enums"]["meetup_status_enum"];
          thumbnail_url?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetups_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetups_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          comment_id: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          log_id: string;
          recipient_user_id: string;
          trigger_user_id: string;
          type: string;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          log_id: string;
          recipient_user_id: string;
          trigger_user_id: string;
          type: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          log_id?: string;
          recipient_user_id?: string;
          trigger_user_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "log_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_log_id_fkey";
            columns: ["log_id"];
            isOneToOne: false;
            referencedRelation: "logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey";
            columns: ["recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_trigger_user_id_fkey";
            columns: ["trigger_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: Json | null;
          full_name: string | null;
          id: string;
          link: string | null;
          tagline: string | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: Json | null;
          full_name?: string | null;
          id: string;
          link?: string | null;
          tagline?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: Json | null;
          full_name?: string | null;
          id?: string;
          link?: string | null;
          tagline?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      meetup_category_enum: "스터디" | "챌린지" | "네트워킹" | "기타";
      meetup_location_type_enum: "온라인" | "오프라인";
      meetup_status_enum: "오픈예정" | "신청가능" | "신청마감" | "종료";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      meetup_category_enum: ["스터디", "챌린지", "네트워킹", "기타"],
      meetup_location_type_enum: ["온라인", "오프라인"],
      meetup_status_enum: ["오픈예정", "신청가능", "신청마감", "종료"],
    },
  },
} as const;
