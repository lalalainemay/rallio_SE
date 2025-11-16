export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          skill_level: number;
          total_games: number;
          wins: number;
          losses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          skill_level?: number;
          total_games?: number;
          wins?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          skill_level?: number;
          total_games?: number;
          wins?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      courts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          location: unknown; // PostGIS GEOGRAPHY type
          latitude: number;
          longitude: number;
          total_courts: number;
          hourly_rate: number | null;
          image_url: string | null;
          amenities: string[] | null;
          opening_time: string | null;
          closing_time: string | null;
          status: "active" | "inactive" | "maintenance";
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          address: string;
          city?: string;
          location?: unknown;
          latitude?: number;
          longitude?: number;
          total_courts?: number;
          hourly_rate?: number | null;
          image_url?: string | null;
          amenities?: string[] | null;
          opening_time?: string | null;
          closing_time?: string | null;
          status?: "active" | "inactive" | "maintenance";
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          address?: string;
          city?: string;
          location?: unknown;
          latitude?: number;
          longitude?: number;
          total_courts?: number;
          hourly_rate?: number | null;
          image_url?: string | null;
          amenities?: string[] | null;
          opening_time?: string | null;
          closing_time?: string | null;
          status?: "active" | "inactive" | "maintenance";
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      queue_sessions: {
        Row: {
          id: string;
          court_id: string;
          session_name: string | null;
          max_players: number;
          game_duration: number;
          status: "active" | "paused" | "completed";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          court_id: string;
          session_name?: string | null;
          max_players?: number;
          game_duration?: number;
          status?: "active" | "paused" | "completed";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          court_id?: string;
          session_name?: string | null;
          max_players?: number;
          game_duration?: number;
          status?: "active" | "paused" | "completed";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          position: number;
          status: "waiting" | "playing" | "completed" | "cancelled";
          joined_at: string;
          started_playing_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          position: number;
          status?: "waiting" | "playing" | "completed" | "cancelled";
          joined_at?: string;
          started_playing_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          position?: number;
          status?: "waiting" | "playing" | "completed" | "cancelled";
          joined_at?: string;
          started_playing_at?: string | null;
          completed_at?: string | null;
        };
      };
      games: {
        Row: {
          id: string;
          court_id: string | null;
          session_id: string | null;
          player1_id: string | null;
          player2_id: string | null;
          player3_id: string | null;
          player4_id: string | null;
          winner_team: number | null;
          score: string | null;
          started_at: string;
          completed_at: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          court_id?: string | null;
          session_id?: string | null;
          player1_id?: string | null;
          player2_id?: string | null;
          player3_id?: string | null;
          player4_id?: string | null;
          winner_team?: number | null;
          score?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          court_id?: string | null;
          session_id?: string | null;
          player1_id?: string | null;
          player2_id?: string | null;
          player3_id?: string | null;
          player4_id?: string | null;
          winner_team?: number | null;
          score?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
      };
      court_reviews: {
        Row: {
          id: string;
          court_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          court_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          court_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      nearby_courts: {
        Args: {
          lat: number;
          lng: number;
          radius_meters?: number;
        };
        Returns: {
          id: string;
          name: string;
          address: string;
          distance_meters: number;
        }[];
      };
      get_next_queue_position: {
        Args: {
          p_session_id: string;
        };
        Returns: number;
      };
    };
  };
}
