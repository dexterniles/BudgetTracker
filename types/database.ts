// Generated types placeholder.
// Replace this file with output of:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
// after applying migrations. Until then, the schema is described manually in
// types/db.ts so the app stays type-safe.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          user_id: string;
          pay_anchor_date: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          pay_anchor_date: string;
          currency?: string;
        };
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          amount: number;
          amount_paid: number;
          due_date: string;
          status: 'unpaid' | 'partial' | 'paid';
          category: string | null;
          is_installment: boolean;
          installment_number: number | null;
          installment_total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          amount: number;
          amount_paid?: number;
          due_date: string;
          status?: 'unpaid' | 'partial' | 'paid';
          category?: string | null;
          is_installment?: boolean;
          installment_number?: number | null;
          installment_total?: number | null;
        };
        Update: Partial<Database['public']['Tables']['bills']['Insert']>;
        Relationships: [];
      };
      bill_payments: {
        Row: {
          id: string;
          bill_id: string;
          amount: number;
          paid_date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          amount: number;
          paid_date: string;
          note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bill_payments']['Insert']>;
        Relationships: [];
      };
      income: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          amount: number;
          received_date: string;
          description: string | null;
          is_misc: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          amount: number;
          received_date: string;
          description?: string | null;
          is_misc?: boolean;
        };
        Update: Partial<Database['public']['Tables']['income']['Insert']>;
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          lender: string | null;
          loan_type: 'student' | 'auto' | 'phone' | 'personal' | 'mortgage' | 'other';
          principal: number;
          current_balance: number;
          apr: number;
          minimum_payment: number;
          payment_frequency: string;
          start_date: string;
          projected_payoff_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          lender?: string | null;
          loan_type: 'student' | 'auto' | 'phone' | 'personal' | 'mortgage' | 'other';
          principal: number;
          current_balance: number;
          apr: number;
          minimum_payment: number;
          payment_frequency?: string;
          start_date: string;
          projected_payoff_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['loans']['Insert']>;
        Relationships: [];
      };
      loan_payments: {
        Row: {
          id: string;
          loan_id: string;
          payment_date: string;
          amount: number;
          principal_portion: number;
          interest_portion: number;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          payment_date: string;
          amount: number;
          principal_portion: number;
          interest_portion: number;
          balance_after: number;
        };
        Update: Partial<Database['public']['Tables']['loan_payments']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Bill = Database['public']['Tables']['bills']['Row'];
export type BillInsert = Database['public']['Tables']['bills']['Insert'];
export type BillPayment = Database['public']['Tables']['bill_payments']['Row'];
export type Income = Database['public']['Tables']['income']['Row'];
export type IncomeInsert = Database['public']['Tables']['income']['Insert'];
export type Loan = Database['public']['Tables']['loans']['Row'];
export type LoanInsert = Database['public']['Tables']['loans']['Insert'];
export type LoanPayment = Database['public']['Tables']['loan_payments']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
