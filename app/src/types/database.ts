// Bu dosya `npm run tipler` ile Supabase şemasından üretilir; elle değiştirmeyin.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      care_links: {
        Row: {
          caregiver_id: string;
          created_at: string;
          id: string;
          patient_id: string;
          relation_label: string;
        };
        Insert: {
          caregiver_id: string;
          created_at?: string;
          id?: string;
          patient_id: string;
          relation_label: string;
        };
        Update: {
          caregiver_id?: string;
          created_at?: string;
          id?: string;
          patient_id?: string;
          relation_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'care_links_caregiver_id_fkey';
            columns: ['caregiver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'care_links_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      device_status: {
        Row: {
          last_synced_at: string;
          owner_id: string;
          reminders_until: string | null;
          updated_at: string;
        };
        Insert: {
          last_synced_at?: string;
          owner_id: string;
          reminders_until?: string | null;
          updated_at?: string;
        };
        Update: {
          last_synced_at?: string;
          owner_id?: string;
          reminders_until?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'device_status_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      dose_logs: {
        Row: {
          created_at: string;
          id: string;
          medication_id: string;
          owner_id: string;
          scheduled_date: string;
          scheduled_time: string;
          server_updated_at: string;
          status: string;
          taken_at: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          medication_id: string;
          owner_id: string;
          scheduled_date: string;
          scheduled_time: string;
          server_updated_at?: string;
          status?: string;
          taken_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          medication_id?: string;
          owner_id?: string;
          scheduled_date?: string;
          scheduled_time?: string;
          server_updated_at?: string;
          status?: string;
          taken_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dose_logs_medication_id_fkey';
            columns: ['medication_id'];
            isOneToOne: false;
            referencedRelation: 'medications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dose_logs_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      health_consent_events: {
        Row: {
          action: string;
          created_at: string;
          id: number;
          text_version: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: never;
          text_version: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: never;
          text_version?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'health_consent_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_attempts: {
        Row: {
          attempted_at: string;
          id: number;
          user_id: string;
        };
        Insert: {
          attempted_at?: string;
          id?: never;
          user_id: string;
        };
        Update: {
          attempted_at?: string;
          id?: never;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invite_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_codes: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string;
          id: string;
          owner_id: string;
          revoked_at: string | null;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          owner_id: string;
          revoked_at?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          owner_id?: string;
          revoked_at?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invite_codes_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invite_codes_used_by_fkey';
            columns: ['used_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      medications: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          delivered_at: string | null;
          dose: string;
          duration: Json;
          form: string;
          id: string;
          location: string;
          low_stock_threshold: number | null;
          marked_low: boolean;
          meal_timing: string;
          name: string;
          owner_id: string;
          past_plans: Json;
          photo_path: string | null;
          schedule: Json;
          server_updated_at: string;
          start_date: string;
          stock: number;
          times: string[];
          unit: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at: string;
          created_by?: string | null;
          deleted_at?: string | null;
          delivered_at?: string | null;
          dose: string;
          duration: Json;
          form: string;
          id: string;
          location?: string;
          low_stock_threshold?: number | null;
          marked_low?: boolean;
          meal_timing: string;
          name: string;
          owner_id: string;
          past_plans?: Json;
          photo_path?: string | null;
          schedule: Json;
          server_updated_at?: string;
          start_date: string;
          stock: number;
          times: string[];
          unit: string;
          updated_at: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          delivered_at?: string | null;
          dose?: string;
          duration?: Json;
          form?: string;
          id?: string;
          location?: string;
          low_stock_threshold?: number | null;
          marked_low?: boolean;
          meal_timing?: string;
          name?: string;
          owner_id?: string;
          past_plans?: Json;
          photo_path?: string | null;
          schedule?: Json;
          server_updated_at?: string;
          start_date?: string;
          stock?: number;
          times?: string[];
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'medications_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medications_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          ad: string;
          id: string;
          olusturma_zamani: string;
          rol: string;
        };
        Insert: {
          ad: string;
          id: string;
          olusturma_zamani?: string;
          rol: string;
        };
        Update: {
          ad?: string;
          id?: string;
          olusturma_zamani?: string;
          rol?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_photo_folder: { Args: { folder: string }; Returns: boolean };
      can_write_photo_folder: { Args: { folder: string }; Returns: boolean };
      create_invite_code: {
        Args: never;
        Returns: {
          code: string;
          expires_at: string;
        }[];
      };
      grant_health_consent: {
        Args: { p_text_version: string };
        Returns: undefined;
      };
      has_health_consent: { Args: { person: string }; Returns: boolean };
      is_caregiver_of: { Args: { patient: string }; Returns: boolean };
      is_linked_with: { Args: { other: string }; Returns: boolean };
      mark_delivered: { Args: { p_items: Json }; Returns: number };
      record_dose: {
        Args: {
          p_amount: number;
          p_id: string;
          p_medication_id: string;
          p_scheduled_date: string;
          p_scheduled_time: string;
          p_taken_at: string;
        };
        Returns: boolean;
      };
      redeem_invite_code: {
        Args: { p_code: string; p_relation_label: string };
        Returns: {
          patient_id: string;
          patient_name: string;
          status: string;
        }[];
      };
      withdraw_health_consent: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
