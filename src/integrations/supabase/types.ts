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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          id: string
          record_id: string
          summary: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          id?: string
          record_id: string
          summary?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          id?: string
          record_id?: string
          summary?: string | null
          table_name?: string
        }
        Relationships: []
      }
      car_photos: {
        Row: {
          car_id: string
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          url: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_photos_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          auction_sheet_url: string | null
          brand: string
          country: Database["public"]["Enums"]["car_country"]
          created_at: string
          currency: string
          deal_id: string | null
          description: string | null
          engine_volume: number | null
          fuel: Database["public"]["Enums"]["car_fuel"] | null
          id: string
          mileage_km: number | null
          model: string
          power_hp: number | null
          price: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["car_status"]
          title: string
          transmission: Database["public"]["Enums"]["car_transmission"] | null
          updated_at: string
          year: number | null
        }
        Insert: {
          auction_sheet_url?: string | null
          brand: string
          country: Database["public"]["Enums"]["car_country"]
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          engine_volume?: number | null
          fuel?: Database["public"]["Enums"]["car_fuel"] | null
          id?: string
          mileage_km?: number | null
          model: string
          power_hp?: number | null
          price?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["car_status"]
          title: string
          transmission?: Database["public"]["Enums"]["car_transmission"] | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          auction_sheet_url?: string | null
          brand?: string
          country?: Database["public"]["Enums"]["car_country"]
          created_at?: string
          currency?: string
          deal_id?: string | null
          description?: string | null
          engine_volume?: number | null
          fuel?: Database["public"]["Enums"]["car_fuel"] | null
          id?: string
          mileage_km?: number | null
          model?: string
          power_hp?: number | null
          price?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["car_status"]
          title?: string
          transmission?: Database["public"]["Enums"]["car_transmission"] | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          created_at: string
          created_by: string | null
          director_name: string | null
          director_position: string | null
          email: string | null
          full_name: string
          id: string
          inn: string | null
          kpp: string | null
          note: string | null
          ogrn: string | null
          passport: string | null
          passport_issued_by: string | null
          passport_issued_date: string | null
          phone: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          director_name?: string | null
          director_position?: string | null
          email?: string | null
          full_name: string
          id?: string
          inn?: string | null
          kpp?: string | null
          note?: string | null
          ogrn?: string | null
          passport?: string | null
          passport_issued_by?: string | null
          passport_issued_date?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          director_name?: string | null
          director_position?: string | null
          email?: string | null
          full_name?: string
          id?: string
          inn?: string | null
          kpp?: string | null
          note?: string | null
          ogrn?: string | null
          passport?: string | null
          passport_issued_by?: string | null
          passport_issued_date?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deal_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          deal_id: string
          from_stage: Database["public"]["Enums"]["deal_stage"] | null
          id: string
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          to_stage: Database["public"]["Enums"]["deal_stage"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          from_stage?: Database["public"]["Enums"]["deal_stage"] | null
          id?: string
          to_stage?: Database["public"]["Enums"]["deal_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          budget: number | null
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          customs_cost: number | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          id: string
          lead_id: string | null
          logistics_cost: number | null
          lost_reason: string | null
          margin: number | null
          note: string | null
          other_cost: number | null
          purchase_cost: number | null
          sale_price: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_cost?: number | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          lead_id?: string | null
          logistics_cost?: number | null
          lost_reason?: string | null
          margin?: number | null
          note?: string | null
          other_cost?: number | null
          purchase_cost?: number | null
          sale_price?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_cost?: number | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          id?: string
          lead_id?: string | null
          logistics_cost?: number | null
          lost_reason?: string | null
          margin?: number | null
          note?: string | null
          other_cost?: number | null
          purchase_cost?: number | null
          sale_price?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          deal_id: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          document_id: string | null
          error: string | null
          id: string
          kind: string
          lead_id: string | null
          recipient: string
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          error?: string | null
          id?: string
          kind?: string
          lead_id?: string | null
          recipient: string
          sent_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          error?: string | null
          id?: string
          kind?: string
          lead_id?: string | null
          recipient?: string
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          from_name: string
          id: boolean
          notifications_enabled: boolean
          notify_emails: string[]
          updated_at: string
        }
        Insert: {
          from_name?: string
          id?: boolean
          notifications_enabled?: boolean
          notify_emails?: string[]
          updated_at?: string
        }
        Update: {
          from_name?: string
          id?: boolean
          notifications_enabled?: boolean
          notify_emails?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          body: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          done_at: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["lead_status"] | null
          id: string
          lead_id: string
          to_status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          lead_id: string
          to_status: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["lead_status"] | null
          id?: string
          lead_id?: string
          to_status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          calc_snapshot: Json | null
          created_at: string
          email: string | null
          full_name: string
          gclid: string | null
          id: string
          lost_reason: string | null
          message: string | null
          messenger: string | null
          note: string | null
          object_interest: string | null
          page_url: string | null
          phone: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          yclid: string | null
        }
        Insert: {
          assigned_to?: string | null
          calc_snapshot?: Json | null
          created_at?: string
          email?: string | null
          full_name: string
          gclid?: string | null
          id?: string
          lost_reason?: string | null
          message?: string | null
          messenger?: string | null
          note?: string | null
          object_interest?: string | null
          page_url?: string | null
          phone: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          yclid?: string | null
        }
        Update: {
          assigned_to?: string | null
          calc_snapshot?: Json | null
          created_at?: string
          email?: string | null
          full_name?: string
          gclid?: string | null
          id?: string
          lost_reason?: string | null
          message?: string | null
          messenger?: string | null
          note?: string | null
          object_interest?: string | null
          page_url?: string | null
          phone?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          yclid?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          category: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_photos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          dimensions: string | null
          hero_photo_path: string | null
          id: string
          min_order: number | null
          name: string
          price_cny: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          hero_photo_path?: string | null
          id?: string
          min_order?: number | null
          name: string
          price_cny?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          hero_photo_path?: string | null
          id?: string
          min_order?: number | null
          name?: string
          price_cny?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_id: string | null
          related_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: string | null
          title?: string
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
      work_photos: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          url: string
          work_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url: string
          work_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_photos_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          brand: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          model: string | null
          price: number | null
          slug: string
          sort_order: number
          source_date: string | null
          status: string
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          price?: number | null
          slug: string
          sort_order?: number
          source_date?: string | null
          status?: string
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          price?: number | null
          slug?: string
          sort_order?: number
          source_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          year?: number | null
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
      activity_type: "note" | "call" | "meeting" | "email" | "task"
      app_role: "admin" | "manager"
      car_country: "japan" | "korea" | "china"
      car_fuel: "petrol" | "diesel" | "hybrid" | "electric" | "gas"
      car_status: "in_stock" | "in_transit" | "on_order" | "sold" | "draft"
      car_transmission: "at" | "mt" | "cvt" | "amt" | "dct" | "other"
      client_type: "individual" | "company"
      deal_stage:
        | "new"
        | "qualification"
        | "calculation"
        | "payment"
        | "delivery"
        | "customs"
        | "completed"
        | "cancelled"
      deal_type: "import_car" | "import_special" | "customs_only" | "other"
      document_kind:
        | "contract"
        | "invoice"
        | "passport"
        | "title"
        | "dkp"
        | "act"
        | "other"
      lead_status:
        | "new"
        | "in_progress"
        | "callback"
        | "meeting"
        | "contract"
        | "won"
        | "lost"
        | "awaiting_payment"
        | "in_transit"
        | "delivered"
      product_status: "draft" | "published" | "archived"
      task_priority: "low" | "normal" | "high" | "urgent"
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
      activity_type: ["note", "call", "meeting", "email", "task"],
      app_role: ["admin", "manager"],
      car_country: ["japan", "korea", "china"],
      car_fuel: ["petrol", "diesel", "hybrid", "electric", "gas"],
      car_status: ["in_stock", "in_transit", "on_order", "sold", "draft"],
      car_transmission: ["at", "mt", "cvt", "amt", "dct", "other"],
      client_type: ["individual", "company"],
      deal_stage: [
        "new",
        "qualification",
        "calculation",
        "payment",
        "delivery",
        "customs",
        "completed",
        "cancelled",
      ],
      deal_type: ["import_car", "import_special", "customs_only", "other"],
      document_kind: [
        "contract",
        "invoice",
        "passport",
        "title",
        "dkp",
        "act",
        "other",
      ],
      lead_status: [
        "new",
        "in_progress",
        "callback",
        "meeting",
        "contract",
        "won",
        "lost",
        "awaiting_payment",
        "in_transit",
        "delivered",
      ],
      product_status: ["draft", "published", "archived"],
      task_priority: ["low", "normal", "high", "urgent"],
    },
  },
} as const
