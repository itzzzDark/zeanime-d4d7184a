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
      anime: {
        Row: {
          banner_image: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          genres: string[] | null
          id: string
          is_most_watched: boolean | null
          is_trending: boolean | null
          rating: number | null
          release_year: number | null
          schedule_day: string | null
          schedule_time: string | null
          slug: string
          status: Database["public"]["Enums"]["anime_status"]
          studio: string | null
          title: string
          title_english: string | null
          title_japanese: string | null
          total_episodes: number | null
          type: Database["public"]["Enums"]["anime_type"]
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          banner_image?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          id?: string
          is_most_watched?: boolean | null
          is_trending?: boolean | null
          rating?: number | null
          release_year?: number | null
          schedule_day?: string | null
          schedule_time?: string | null
          slug: string
          status?: Database["public"]["Enums"]["anime_status"]
          studio?: string | null
          title: string
          title_english?: string | null
          title_japanese?: string | null
          total_episodes?: number | null
          type?: Database["public"]["Enums"]["anime_type"]
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          banner_image?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          id?: string
          is_most_watched?: boolean | null
          is_trending?: boolean | null
          rating?: number | null
          release_year?: number | null
          schedule_day?: string | null
          schedule_time?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["anime_status"]
          studio?: string | null
          title?: string
          title_english?: string | null
          title_japanese?: string | null
          total_episodes?: number | null
          type?: Database["public"]["Enums"]["anime_type"]
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      anime_schedule: {
        Row: {
          anime_id: string
          created_at: string | null
          day_of_week: string
          id: string
          time_slot: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          day_of_week: string
          id?: string
          time_slot: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          day_of_week?: string
          id?: string
          time_slot?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_schedule_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      anime_shares: {
        Row: {
          anime_id: string
          created_at: string | null
          id: string
          platform: string
          user_id: string | null
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          id?: string
          platform: string
          user_id?: string | null
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          id?: string
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_shares_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      anime_views: {
        Row: {
          anime_id: string
          created_at: string | null
          id: string
          user_id: string | null
          view_date: string | null
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          view_date?: string | null
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          view_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_views_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          anime_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          anime_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          anime_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          anime_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anime_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anime_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          anime_id: string
          created_at: string | null
          description: string | null
          duration: number | null
          episode_number: number
          id: string
          season_number: number
          thumbnail: string | null
          title: string | null
          updated_at: string | null
          video_url: string
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          episode_number: number
          id?: string
          season_number?: number
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          video_url: string
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          episode_number?: number
          id?: string
          season_number?: number
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          anime_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image: string | null
          created_at: string | null
          custom_theme: Json | null
          favorite_genres: string[] | null
          id: string
          social_links: Json | null
          updated_at: string | null
          username: string | null
          watch_preferences: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image?: string | null
          created_at?: string | null
          custom_theme?: Json | null
          favorite_genres?: string[] | null
          id: string
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          watch_preferences?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image?: string | null
          created_at?: string | null
          custom_theme?: Json | null
          favorite_genres?: string[] | null
          id?: string
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          watch_preferences?: Json | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      watch_history: {
        Row: {
          anime_id: string
          completed: boolean | null
          episode_id: string | null
          id: string
          last_watched: string | null
          progress: number | null
          user_id: string
        }
        Insert: {
          anime_id: string
          completed?: boolean | null
          episode_id?: string | null
          id?: string
          last_watched?: string | null
          progress?: number | null
          user_id: string
        }
        Update: {
          anime_id?: string
          completed?: boolean | null
          episode_id?: string | null
          id?: string
          last_watched?: string | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          anime_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      anime_status: "ongoing" | "completed" | "upcoming"
      anime_type: "series" | "movie" | "ova" | "special"
      app_role: "admin" | "moderator" | "user"
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
      anime_status: ["ongoing", "completed", "upcoming"],
      anime_type: ["series", "movie", "ova", "special"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
