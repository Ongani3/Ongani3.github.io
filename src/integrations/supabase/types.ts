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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_number: string
          cancellation_reason: string | null
          created_at: string | null
          customer_user_id: string
          end_time: string
          id: string
          notes: string | null
          reminder_sent: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          service_provider_id: string | null
          status: string | null
          store_user_id: string
          updated_at: string | null
        }
        Insert: {
          appointment_number: string
          cancellation_reason?: string | null
          created_at?: string | null
          customer_user_id: string
          end_time: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          service_provider_id?: string | null
          status?: string | null
          store_user_id: string
          updated_at?: string | null
        }
        Update: {
          appointment_number?: string
          cancellation_reason?: string | null
          created_at?: string | null
          customer_user_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
          service_provider_id?: string | null
          status?: string | null
          store_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_quality_rating: number | null
          call_session_id: string
          call_type: string
          callee_feedback: string | null
          callee_id: string
          caller_feedback: string | null
          caller_id: string
          created_at: string | null
          duration_seconds: number | null
          id: string
        }
        Insert: {
          call_quality_rating?: number | null
          call_session_id: string
          call_type: string
          callee_feedback?: string | null
          callee_id: string
          caller_feedback?: string | null
          caller_id: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
        }
        Update: {
          call_quality_rating?: number | null
          call_session_id?: string
          call_type?: string
          callee_feedback?: string | null
          callee_id?: string
          caller_feedback?: string | null
          caller_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          caller_type: string
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          id: string
          start_time: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          call_type: string
          callee_id: string
          caller_id: string
          caller_type: string
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          caller_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      call_settings: {
        Row: {
          accept_calls: boolean | null
          auto_decline_when_busy: boolean | null
          call_notifications: boolean | null
          created_at: string | null
          id: string
          max_call_duration_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accept_calls?: boolean | null
          auto_decline_when_busy?: boolean | null
          call_notifications?: boolean | null
          created_at?: string | null
          id?: string
          max_call_duration_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accept_calls?: boolean | null
          auto_decline_when_busy?: boolean | null
          call_notifications?: boolean | null
          created_at?: string | null
          id?: string
          max_call_duration_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_user_id: string
          id: string
          message: string
          order_ref: string | null
          status: string
          store_settings_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_user_id: string
          id?: string
          message: string
          order_ref?: string | null
          status?: string
          store_settings_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_user_id?: string
          id?: string
          message?: string
          order_ref?: string | null
          status?: string
          store_settings_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_store_settings_id_fkey"
            columns: ["store_settings_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_type: string
          city: string
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          postal_code: string
          state: string
          street_address: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_type: string
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          postal_code: string
          state: string
          street_address: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_type?: string
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          postal_code?: string
          state?: string
          street_address?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_documents: {
        Row: {
          access_level: string | null
          created_at: string | null
          customer_user_id: string
          document_name: string
          document_type: string
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          is_signed: boolean | null
          mime_type: string | null
          order_id: string | null
          signature_date: string | null
          store_user_id: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          customer_user_id: string
          document_name: string
          document_type: string
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_signed?: boolean | null
          mime_type?: string | null
          order_id?: string | null
          signature_date?: string | null
          store_user_id: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          customer_user_id?: string
          document_name?: string
          document_type?: string
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_signed?: boolean | null
          mime_type?: string | null
          order_id?: string | null
          signature_date?: string | null
          store_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          backup_codes: string[] | null
          communication_preferences: Json | null
          created_at: string | null
          customer_id: string | null
          date_of_birth: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          profile_picture_url: string | null
          store_id: string | null
          two_fa_enabled: boolean | null
          two_fa_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          communication_preferences?: Json | null
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          store_id?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          communication_preferences?: Json | null
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          store_id?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_user_id: string | null
          email: string
          favorite_products: string[] | null
          id: string
          join_date: string
          last_visit: string | null
          name: string
          phone: string | null
          points: number
          status: string
          tier: string
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id?: string | null
          email: string
          favorite_products?: string[] | null
          id?: string
          join_date?: string
          last_visit?: string | null
          name: string
          phone?: string | null
          points?: number
          status?: string
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string | null
          email?: string
          favorite_products?: string[] | null
          id?: string
          join_date?: string
          last_visit?: string | null
          name?: string
          phone?: string | null
          points?: number
          status?: string
          tier?: string
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_sales_summary: {
        Row: {
          created_at: string
          id: string
          registered_customer_sales: number
          sale_date: string
          store_user_id: string
          total_amount: number
          transaction_count: number
          unregistered_customer_sales: number
        }
        Insert: {
          created_at?: string
          id?: string
          registered_customer_sales?: number
          sale_date: string
          store_user_id: string
          total_amount?: number
          transaction_count?: number
          unregistered_customer_sales?: number
        }
        Update: {
          created_at?: string
          id?: string
          registered_customer_sales?: number
          sale_date?: string
          store_user_id?: string
          total_amount?: number
          transaction_count?: number
          unregistered_customer_sales?: number
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          clicked: number
          content: string
          conversions: number
          created_at: string
          id: string
          opened: number
          recipients: number
          sent_date: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicked?: number
          content: string
          conversions?: number
          created_at?: string
          id?: string
          opened?: number
          recipients?: number
          sent_date?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicked?: number
          content?: string
          conversions?: number
          created_at?: string
          id?: string
          opened?: number
          recipients?: number
          sent_date?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          customer_name: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          paid_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          paid_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          paid_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_accounts: {
        Row: {
          created_at: string | null
          current_points: number | null
          customer_user_id: string
          id: string
          lifetime_points: number | null
          next_tier_points: number | null
          tier: string | null
          tier_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_points?: number | null
          customer_user_id: string
          id?: string
          lifetime_points?: number | null
          next_tier_points?: number | null
          tier?: string | null
          tier_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_points?: number | null
          customer_user_id?: string
          id?: string
          lifetime_points?: number | null
          next_tier_points?: number | null
          tier?: string | null
          tier_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          recipient_id: string
          sender_id: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          recipient_id: string
          sender_id?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_image_url: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_image_url?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_image_url?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          billing_address_id: string | null
          created_at: string | null
          customer_user_id: string
          discount_amount: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          shipping_address_id: string | null
          shipping_amount: number | null
          status: string
          store_user_id: string
          stripe_payment_intent_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          billing_address_id?: string | null
          created_at?: string | null
          customer_user_id: string
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number | null
          status?: string
          store_user_id: string
          stripe_payment_intent_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          billing_address_id?: string | null
          created_at?: string | null
          customer_user_id?: string
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number | null
          status?: string
          store_user_id?: string
          stripe_payment_intent_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_user_id: string
          failure_reason: string | null
          id: string
          order_id: string | null
          payment_date: string | null
          payment_method_type: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_user_id: string
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          payment_date?: string | null
          payment_method_type: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_user_id?: string
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          payment_date?: string | null
          payment_method_type?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string
          expiry_date: string | null
          id: string
          loyalty_account_id: string
          order_id: string | null
          points: number
          promotion_id: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          expiry_date?: string | null
          id?: string
          loyalty_account_id: string
          order_id?: string | null
          points: number
          promotion_id?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          expiry_date?: string | null
          id?: string
          loyalty_account_id?: string
          order_id?: string | null
          points?: number
          promotion_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_loyalty_account_id_fkey"
            columns: ["loyalty_account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotional_emails: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          last_sent: string | null
          name: string
          open_rate: number
          schedule: string | null
          subject: string
          target_audience: string
          total_sent: number
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sent?: string | null
          name: string
          open_rate?: number
          schedule?: string | null
          subject: string
          target_audience: string
          total_sent?: number
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sent?: string | null
          name?: string
          open_rate?: number
          schedule?: string | null
          subject?: string
          target_audience?: string
          total_sent?: number
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applicable_products: string[] | null
          code: string | null
          created_at: string
          current_usage: number
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          min_purchase_amount: number | null
          name: string
          start_date: string
          type: string
          updated_at: string
          usage_limit: number | null
          user_id: string
          value: number
        }
        Insert: {
          applicable_products?: string[] | null
          code?: string | null
          created_at?: string
          current_usage?: number
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          name: string
          start_date?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          user_id: string
          value: number
        }
        Update: {
          applicable_products?: string[] | null
          code?: string | null
          created_at?: string
          current_usage?: number
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          min_purchase_amount?: number | null
          name?: string
          start_date?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          created_at: string
          created_date: string
          customer_id: string | null
          customer_name: string
          expiry_date: string
          id: string
          items_count: number
          notes: string | null
          quote_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_date?: string
          customer_id?: string | null
          customer_name: string
          expiry_date: string
          id?: string
          items_count?: number
          notes?: string | null
          quote_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_date?: string
          customer_id?: string | null
          customer_name?: string
          expiry_date?: string
          id?: string
          items_count?: number
          notes?: string | null
          quote_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          approval_date: string | null
          approval_status: string
          approved_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          original_sale_id: string
          processed_by: string
          refund_amount: number
          refund_date: string
          refund_method: string
          refund_reason: string
          store_user_id: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approval_status?: string
          approved_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_sale_id: string
          processed_by: string
          refund_amount?: number
          refund_date?: string
          refund_method?: string
          refund_reason: string
          store_user_id: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approval_status?: string
          approved_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_sale_id?: string
          processed_by?: string
          refund_amount?: number
          refund_date?: string
          refund_method?: string
          refund_reason?: string
          store_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          customer_user_id: string
          helpful_votes: number | null
          id: string
          is_published: boolean | null
          is_verified_purchase: boolean | null
          order_id: string | null
          photos: string[] | null
          rating: number
          review_text: string | null
          service_id: string | null
          store_response: string | null
          store_response_date: string | null
          store_user_id: string
          title: string | null
          total_votes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_user_id: string
          helpful_votes?: number | null
          id?: string
          is_published?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          photos?: string[] | null
          rating: number
          review_text?: string | null
          service_id?: string | null
          store_response?: string | null
          store_response_date?: string | null
          store_user_id: string
          title?: string | null
          total_votes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_user_id?: string
          helpful_votes?: number | null
          id?: string
          is_published?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          service_id?: string | null
          store_response?: string | null
          store_response_date?: string | null
          store_user_id?: string
          title?: string | null
          total_votes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          current_usage: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
          reward_type: string
          reward_value: number | null
          store_user_id: string
          terms_conditions: string | null
          updated_at: string | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          current_usage?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required: number
          reward_type: string
          reward_value?: number | null
          store_user_id: string
          terms_conditions?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          current_usage?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          store_user_id?: string
          terms_conditions?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          customer_user_id: string | null
          description: string | null
          id: string
          is_refunded: boolean | null
          is_registered_customer: boolean
          payment_method: string
          refunded_amount: number | null
          refunded_date: string | null
          sale_date: string
          store_user_id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          customer_user_id?: string | null
          description?: string | null
          id?: string
          is_refunded?: boolean | null
          is_registered_customer?: boolean
          payment_method?: string
          refunded_amount?: number | null
          refunded_date?: string | null
          sale_date?: string
          store_user_id: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          customer_user_id?: string | null
          description?: string | null
          id?: string
          is_refunded?: boolean | null
          is_registered_customer?: boolean
          payment_method?: string
          refunded_amount?: number | null
          refunded_date?: string | null
          sale_date?: string
          store_user_id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          booking_buffer_minutes: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          store_user_id: string
          updated_at: string | null
        }
        Insert: {
          booking_buffer_minutes?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          store_user_id: string
          updated_at?: string | null
        }
        Update: {
          booking_buffer_minutes?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          store_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          contact_email: string
          created_at: string
          from_email: string
          id: string
          phone: string | null
          store_address: string
          store_city: string
          store_name: string
          store_state: string
          store_tagline: string
          store_zip: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string
          created_at?: string
          from_email?: string
          id?: string
          phone?: string | null
          store_address?: string
          store_city?: string
          store_name?: string
          store_state?: string
          store_tagline?: string
          store_zip?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          from_email?: string
          id?: string
          phone?: string | null
          store_address?: string
          store_city?: string
          store_name?: string
          store_state?: string
          store_tagline?: string
          store_zip?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          message_type: string | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message_type?: string | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message_type?: string | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_agent_id: string | null
          category: string
          closed_at: string | null
          created_at: string | null
          customer_user_id: string
          description: string
          id: string
          order_id: string | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string | null
          store_user_id: string
          subject: string
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          category: string
          closed_at?: string | null
          created_at?: string | null
          customer_user_id: string
          description: string
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          store_user_id: string
          subject: string
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          customer_user_id?: string
          description?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          store_user_id?: string
          subject?: string
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string | null
          customer_user_id: string
          id: string
          nps_score: number | null
          order_id: string | null
          responses: Json
          survey_id: string
        }
        Insert: {
          completed_at?: string | null
          customer_user_id: string
          id?: string
          nps_score?: number | null
          order_id?: string | null
          responses: Json
          survey_id: string
        }
        Update: {
          completed_at?: string | null
          customer_user_id?: string
          id?: string
          nps_score?: number | null
          order_id?: string | null
          responses?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          questions: Json
          store_user_id: string
          survey_type: string
          title: string
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions: Json
          store_user_id: string
          survey_type: string
          title: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          store_user_id?: string
          survey_type?: string
          title?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string | null
          id: string
          last_seen: string | null
          status: string
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          user_type?: string
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
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
