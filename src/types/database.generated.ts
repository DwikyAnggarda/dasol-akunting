export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account_mappings: {
        Row: {
          account_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          mapping_code: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          account_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mapping_code: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          account_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mapping_code?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "account_mappings_company_id_account_id_fkey";
            columns: ["company_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "account_mappings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      accounting_periods: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          ends_on: string;
          fiscal_year_id: string;
          id: string;
          period_number: number;
          reopened_at: string | null;
          reopened_by: string | null;
          starts_on: string;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_on: string;
          fiscal_year_id: string;
          id?: string;
          period_number: number;
          reopened_at?: string | null;
          reopened_by?: string | null;
          starts_on: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_on?: string;
          fiscal_year_id?: string;
          id?: string;
          period_number?: number;
          reopened_at?: string | null;
          reopened_by?: string | null;
          starts_on?: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "accounting_periods_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounting_periods_fiscal_year_id_fkey";
            columns: ["fiscal_year_id"];
            isOneToOne: false;
            referencedRelation: "fiscal_years";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts_payable: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          document_date: string;
          document_number: string;
          due_date: string;
          id: string;
          original_amount: number;
          outstanding_amount: number;
          purchase_invoice_id: string;
          status: string;
          supplier_id: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          document_date: string;
          document_number: string;
          due_date: string;
          id?: string;
          original_amount: number;
          outstanding_amount: number;
          purchase_invoice_id: string;
          status?: string;
          supplier_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          document_date?: string;
          document_number?: string;
          due_date?: string;
          id?: string;
          original_amount?: number;
          outstanding_amount?: number;
          purchase_invoice_id?: string;
          status?: string;
          supplier_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_payable_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_payable_company_id_purchase_invoice_id_fkey";
            columns: ["company_id", "purchase_invoice_id"];
            isOneToOne: true;
            referencedRelation: "purchase_invoices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "accounts_payable_company_id_supplier_id_fkey";
            columns: ["company_id", "supplier_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      accounts_receivable: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          document_date: string;
          document_number: string;
          due_date: string;
          id: string;
          original_amount: number;
          outstanding_amount: number;
          sales_invoice_id: string;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          document_date: string;
          document_number: string;
          due_date: string;
          id?: string;
          original_amount: number;
          outstanding_amount: number;
          sales_invoice_id: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          document_date?: string;
          document_number?: string;
          due_date?: string;
          id?: string;
          original_amount?: number;
          outstanding_amount?: number;
          sales_invoice_id?: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "accounts_receivable_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_receivable_company_id_sales_invoice_id_fkey";
            columns: ["company_id", "sales_invoice_id"];
            isOneToOne: true;
            referencedRelation: "sales_invoices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      approval_actions: {
        Row: {
          action: string;
          actor_user_id: string;
          comment: string | null;
          company_id: string;
          created_at: string;
          id: string;
          request_id: string;
          step: number;
        };
        Insert: {
          action: string;
          actor_user_id: string;
          comment?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          request_id: string;
          step: number;
        };
        Update: {
          action?: string;
          actor_user_id?: string;
          comment?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          request_id?: string;
          step?: number;
        };
        Relationships: [
          {
            foreignKeyName: "approval_actions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_actions_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "approval_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      approval_requests: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          current_step: number;
          document_id: string;
          document_number: string;
          document_type: string;
          id: string;
          status: string;
          submitted_at: string;
          submitted_by: string;
          workflow_id: string | null;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number;
          document_id: string;
          document_number: string;
          document_type: string;
          id?: string;
          status?: string;
          submitted_at?: string;
          submitted_by: string;
          workflow_id?: string | null;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number;
          document_id?: string;
          document_number?: string;
          document_type?: string;
          id?: string;
          status?: string;
          submitted_at?: string;
          submitted_by?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "approval_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_requests_company_id_workflow_id_fkey";
            columns: ["company_id", "workflow_id"];
            isOneToOne: false;
            referencedRelation: "approval_workflows";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      approval_workflow_steps: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          maximum_amount: number | null;
          minimum_amount: number | null;
          required_permission: string;
          step_order: number;
          workflow_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          maximum_amount?: number | null;
          minimum_amount?: number | null;
          required_permission: string;
          step_order: number;
          workflow_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          maximum_amount?: number | null;
          minimum_amount?: number | null;
          required_permission?: string;
          step_order?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_workflow_steps_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_workflow_steps_company_id_workflow_id_fkey";
            columns: ["company_id", "workflow_id"];
            isOneToOne: false;
            referencedRelation: "approval_workflows";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      approval_workflows: {
        Row: {
          allow_self_approval: boolean;
          company_id: string;
          created_at: string;
          created_by: string | null;
          document_type: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          allow_self_approval?: boolean;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          document_type: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          allow_self_approval?: boolean;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          document_type?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "approval_workflows_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          entity_id: string;
          entity_type: string;
          id: string;
          mime_type: string;
          original_filename: string;
          size_bytes: number;
          storage_path: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          mime_type: string;
          original_filename: string;
          size_bytes: number;
          storage_path: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          mime_type?: string;
          original_filename?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_role: string | null;
          actor_user_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          changed_fields: string[];
          company_id: string;
          correlation_id: string | null;
          created_at: string;
          document_number: string | null;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: unknown;
          reason: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_role?: string | null;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          changed_fields?: string[];
          company_id: string;
          correlation_id?: string | null;
          created_at?: string;
          document_number?: string | null;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: unknown;
          reason?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_role?: string | null;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          changed_fields?: string[];
          company_id?: string;
          correlation_id?: string | null;
          created_at?: string;
          document_number?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: unknown;
          reason?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          account_type: string;
          bank_name: string | null;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          gl_account_id: string;
          id: string;
          is_active: boolean;
          masked_account_number: string | null;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          account_type?: string;
          bank_name?: string | null;
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          gl_account_id: string;
          id?: string;
          is_active?: boolean;
          masked_account_number?: string | null;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          account_type?: string;
          bank_name?: string | null;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          gl_account_id?: string;
          id?: string;
          is_active?: boolean;
          masked_account_number?: string | null;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_accounts_company_id_gl_account_id_fkey";
            columns: ["company_id", "gl_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "bank_accounts_currency_code_fkey";
            columns: ["currency_code"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
        ];
      };
      bank_reconciliations: {
        Row: {
          bank_account_id: string;
          closing_balance: number;
          company_id: string;
          created_at: string;
          created_by: string;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          opening_balance: number;
          statement_date: string;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          bank_account_id: string;
          closing_balance: number;
          company_id: string;
          created_at?: string;
          created_by: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          opening_balance: number;
          statement_date: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          bank_account_id?: string;
          closing_balance?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          opening_balance?: number;
          statement_date?: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_company_id_bank_account_id_fkey";
            columns: ["company_id", "bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "bank_reconciliations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_statement_lines: {
        Row: {
          adjustment_journal_id: string | null;
          amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          line_number: number;
          matched_id: string | null;
          matched_type: string | null;
          reconciliation_id: string;
          reference: string | null;
          status: string;
          transaction_date: string;
        };
        Insert: {
          adjustment_journal_id?: string | null;
          amount: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          line_number: number;
          matched_id?: string | null;
          matched_type?: string | null;
          reconciliation_id: string;
          reference?: string | null;
          status?: string;
          transaction_date: string;
        };
        Update: {
          adjustment_journal_id?: string | null;
          amount?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          line_number?: number;
          matched_id?: string | null;
          matched_type?: string | null;
          reconciliation_id?: string;
          reference?: string | null;
          status?: string;
          transaction_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bank_statement_lines_adjustment_journal_id_fkey";
            columns: ["adjustment_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_statement_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_statement_lines_company_id_reconciliation_id_fkey";
            columns: ["company_id", "reconciliation_id"];
            isOneToOne: false;
            referencedRelation: "bank_reconciliations";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      branches: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_transactions: {
        Row: {
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          description: string;
          destination_bank_account_id: string | null;
          document_number: string;
          id: string;
          journal_entry_id: string | null;
          offset_account_id: string | null;
          posted_at: string | null;
          posted_by: string | null;
          reference: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          reversal_journal_id: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          transaction_date: string;
          transaction_type: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          description: string;
          destination_bank_account_id?: string | null;
          document_number: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          transaction_date: string;
          transaction_type: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_account_id?: string;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string;
          destination_bank_account_id?: string | null;
          document_number?: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          transaction_date?: string;
          transaction_type?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cash_transactions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_transactions_company_id_bank_account_id_fkey";
            columns: ["company_id", "bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "cash_transactions_company_id_destination_bank_account_id_fkey";
            columns: ["company_id", "destination_bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "cash_transactions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_transactions_company_id_offset_account_id_fkey";
            columns: ["company_id", "offset_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "cash_transactions_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_transactions_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      chart_of_accounts: {
        Row: {
          account_type: string;
          allow_manual_entry: boolean;
          cash_flow_category: string | null;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          is_control_account: boolean;
          name: string;
          normal_balance: string;
          parent_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          account_type: string;
          allow_manual_entry?: boolean;
          cash_flow_category?: string | null;
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          is_control_account?: boolean;
          name: string;
          normal_balance: string;
          parent_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          account_type?: string;
          allow_manual_entry?: boolean;
          cash_flow_category?: string | null;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          is_control_account?: boolean;
          name?: string;
          normal_balance?: string;
          parent_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chart_of_accounts_company_id_parent_id_fkey";
            columns: ["company_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      companies: {
        Row: {
          base_currency_code: string;
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          legal_name: string | null;
          locale: string;
          name: string;
          status: string;
          tax_id: string | null;
          timezone: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          base_currency_code?: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          name: string;
          status?: string;
          tax_id?: string | null;
          timezone?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          base_currency_code?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          name?: string;
          status?: string;
          tax_id?: string | null;
          timezone?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      company_feature_flags: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          enabled: boolean;
          feature_code: string;
          id: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          feature_code: string;
          id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          feature_code?: string;
          id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "company_feature_flags_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      company_memberships: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          role_id: string;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role_id: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id: string;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role_id?: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_memberships_company_id_role_id_fkey";
            columns: ["company_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      company_settings: {
        Row: {
          allow_negative_stock: boolean;
          allow_self_approval: boolean;
          company_id: string;
          created_at: string;
          created_by: string | null;
          fiscal_year_start_month: number;
          id: string;
          inventory_method: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          allow_negative_stock?: boolean;
          allow_self_approval?: boolean;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          fiscal_year_start_month?: number;
          id?: string;
          inventory_method?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          allow_negative_stock?: boolean;
          allow_self_approval?: boolean;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          fiscal_year_start_month?: number;
          id?: string;
          inventory_method?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_addresses: {
        Row: {
          address_line: string;
          address_type: string;
          city: string | null;
          company_id: string;
          contact_id: string;
          country_code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_primary: boolean;
          postal_code: string | null;
          province: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          address_line: string;
          address_type: string;
          city?: string | null;
          company_id: string;
          contact_id: string;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_primary?: boolean;
          postal_code?: string | null;
          province?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          address_line?: string;
          address_type?: string;
          city?: string | null;
          company_id?: string;
          contact_id?: string;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_primary?: boolean;
          postal_code?: string | null;
          province?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contact_addresses_company_id_contact_id_fkey";
            columns: ["company_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "contact_addresses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_credits: {
        Row: {
          applied_amount: number;
          available_amount: number;
          company_id: string;
          contact_id: string;
          created_at: string;
          created_by: string | null;
          credit_type: string;
          id: string;
          original_amount: number;
          return_id: string;
          status: string;
        };
        Insert: {
          applied_amount?: number;
          available_amount: number;
          company_id: string;
          contact_id: string;
          created_at?: string;
          created_by?: string | null;
          credit_type: string;
          id?: string;
          original_amount: number;
          return_id: string;
          status?: string;
        };
        Update: {
          applied_amount?: number;
          available_amount?: number;
          company_id?: string;
          contact_id?: string;
          created_at?: string;
          created_by?: string | null;
          credit_type?: string;
          id?: string;
          original_amount?: number;
          return_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_credits_company_id_contact_id_fkey";
            columns: ["company_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "contact_credits_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_credits_company_id_return_id_fkey";
            columns: ["company_id", "return_id"];
            isOneToOne: true;
            referencedRelation: "return_documents";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      contacts: {
        Row: {
          code: string;
          company_id: string;
          contact_type: string;
          created_at: string;
          created_by: string | null;
          credit_limit: number;
          default_tax_code_id: string | null;
          deleted_at: string | null;
          display_name: string;
          email: string | null;
          id: string;
          is_active: boolean;
          is_taxable_entrepreneur: boolean;
          legal_name: string | null;
          national_id: string | null;
          notes: string | null;
          payable_account_id: string | null;
          payment_term_id: string | null;
          phone: string | null;
          receivable_account_id: string | null;
          tax_branch_id: string | null;
          tax_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          contact_type: string;
          created_at?: string;
          created_by?: string | null;
          credit_limit?: number;
          default_tax_code_id?: string | null;
          deleted_at?: string | null;
          display_name: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_taxable_entrepreneur?: boolean;
          legal_name?: string | null;
          national_id?: string | null;
          notes?: string | null;
          payable_account_id?: string | null;
          payment_term_id?: string | null;
          phone?: string | null;
          receivable_account_id?: string | null;
          tax_branch_id?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          contact_type?: string;
          created_at?: string;
          created_by?: string | null;
          credit_limit?: number;
          default_tax_code_id?: string | null;
          deleted_at?: string | null;
          display_name?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_taxable_entrepreneur?: boolean;
          legal_name?: string | null;
          national_id?: string | null;
          notes?: string | null;
          payable_account_id?: string | null;
          payment_term_id?: string | null;
          phone?: string | null;
          receivable_account_id?: string | null;
          tax_branch_id?: string | null;
          tax_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_company_id_payable_account_id_fkey";
            columns: ["company_id", "payable_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "contacts_company_id_payment_term_id_fkey";
            columns: ["company_id", "payment_term_id"];
            isOneToOne: false;
            referencedRelation: "payment_terms";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "contacts_company_id_receivable_account_id_fkey";
            columns: ["company_id", "receivable_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "contacts_default_tax_code_fk";
            columns: ["company_id", "default_tax_code_id"];
            isOneToOne: false;
            referencedRelation: "tax_codes";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      currencies: {
        Row: {
          code: string;
          decimal_places: number;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          decimal_places?: number;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          decimal_places?: number;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      customer_receipt_allocations: {
        Row: {
          allocated_amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          receipt_id: string;
          receivable_id: string;
        };
        Insert: {
          allocated_amount: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          receipt_id: string;
          receivable_id: string;
        };
        Update: {
          allocated_amount?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          receipt_id?: string;
          receivable_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_receipt_allocations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_receipt_allocations_company_id_receipt_id_fkey";
            columns: ["company_id", "receipt_id"];
            isOneToOne: false;
            referencedRelation: "customer_receipts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "customer_receipt_allocations_receivable_id_fkey";
            columns: ["receivable_id"];
            isOneToOne: false;
            referencedRelation: "accounts_receivable";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_receipts: {
        Row: {
          amount: number;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          customer_id: string;
          document_number: string;
          id: string;
          notes: string | null;
          posted_at: string | null;
          posted_by: string | null;
          receipt_date: string;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          amount: number;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          customer_id: string;
          document_number: string;
          id?: string;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          receipt_date: string;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          amount?: number;
          bank_account_id?: string;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          document_number?: string;
          id?: string;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          receipt_date?: string;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_receipts_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_receipts_company_id_bank_account_id_fkey";
            columns: ["company_id", "bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "customer_receipts_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "customer_receipts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      document_line_taxes: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          document_id: string;
          document_line_id: string;
          document_type: string;
          id: string;
          rate: number;
          tax_amount: number;
          tax_base: number;
          tax_code_id: string;
          tax_rate_version_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          document_id: string;
          document_line_id: string;
          document_type: string;
          id?: string;
          rate: number;
          tax_amount: number;
          tax_base: number;
          tax_code_id: string;
          tax_rate_version_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          document_id?: string;
          document_line_id?: string;
          document_type?: string;
          id?: string;
          rate?: number;
          tax_amount?: number;
          tax_base?: number;
          tax_code_id?: string;
          tax_rate_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_line_taxes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_line_taxes_company_id_tax_code_id_fkey";
            columns: ["company_id", "tax_code_id"];
            isOneToOne: false;
            referencedRelation: "tax_codes";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "document_line_taxes_company_id_tax_rate_version_id_fkey";
            columns: ["company_id", "tax_rate_version_id"];
            isOneToOne: false;
            referencedRelation: "tax_rate_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      document_sequences: {
        Row: {
          branch_id: string | null;
          branch_scope: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          current_period: string | null;
          document_type: string;
          id: string;
          next_value: number;
          pattern: string;
          reset_frequency: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          branch_id?: string | null;
          branch_scope?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          current_period?: string | null;
          document_type: string;
          id?: string;
          next_value?: number;
          pattern: string;
          reset_frequency?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          branch_id?: string | null;
          branch_scope?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          current_period?: string | null;
          document_type?: string;
          id?: string;
          next_value?: number;
          pattern?: string;
          reset_frequency?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_sequences_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_sequences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      exchange_rates: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          id: string;
          rate: number;
          rate_date: string;
          source_reference: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          currency_code: string;
          id?: string;
          rate: number;
          rate_date: string;
          source_reference?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          id?: string;
          rate?: number;
          rate_date?: string;
          source_reference?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exchange_rates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exchange_rates_currency_code_fkey";
            columns: ["currency_code"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
        ];
      };
      fiscal_years: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          ends_on: string;
          id: string;
          name: string;
          starts_on: string;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_on: string;
          id?: string;
          name: string;
          starts_on: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_on?: string;
          id?: string;
          name?: string;
          starts_on?: string;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fiscal_years_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fixed_asset_categories: {
        Row: {
          accumulated_depreciation_account_id: string;
          asset_account_id: string;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          default_useful_life_months: number;
          depreciation_expense_account_id: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          accumulated_depreciation_account_id: string;
          asset_account_id: string;
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          default_useful_life_months: number;
          depreciation_expense_account_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          accumulated_depreciation_account_id?: string;
          asset_account_id?: string;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          default_useful_life_months?: number;
          depreciation_expense_account_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_asset_categories_company_id_accumulated_depreciation_fkey";
            columns: ["company_id", "accumulated_depreciation_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "fixed_asset_categories_company_id_asset_account_id_fkey";
            columns: ["company_id", "asset_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "fixed_asset_categories_company_id_depreciation_expense_acc_fkey";
            columns: ["company_id", "depreciation_expense_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "fixed_asset_categories_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fixed_asset_depreciation_entries: {
        Row: {
          amount: number;
          asset_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          journal_entry_id: string | null;
          period_date: string;
          posted_at: string | null;
          posted_by: string | null;
          status: string;
        };
        Insert: {
          amount: number;
          asset_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          journal_entry_id?: string | null;
          period_date: string;
          posted_at?: string | null;
          posted_by?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          asset_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          journal_entry_id?: string | null;
          period_date?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_asset_depreciation_entries_company_id_asset_id_fkey";
            columns: ["company_id", "asset_id"];
            isOneToOne: false;
            referencedRelation: "fixed_assets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "fixed_asset_depreciation_entries_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fixed_asset_depreciation_entries_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      fixed_assets: {
        Row: {
          accumulated_depreciation: number;
          acquisition_cost: number;
          acquisition_date: string;
          activated_at: string | null;
          activated_by: string | null;
          asset_code: string;
          category_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          depreciation_method: string;
          disposal_date: string | null;
          disposal_journal_id: string | null;
          disposal_proceeds: number | null;
          disposal_reason: string | null;
          disposed_at: string | null;
          disposed_by: string | null;
          id: string;
          in_service_date: string;
          name: string;
          residual_value: number;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          useful_life_months: number;
          version: number;
        };
        Insert: {
          accumulated_depreciation?: number;
          acquisition_cost: number;
          acquisition_date: string;
          activated_at?: string | null;
          activated_by?: string | null;
          asset_code: string;
          category_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          depreciation_method?: string;
          disposal_date?: string | null;
          disposal_journal_id?: string | null;
          disposal_proceeds?: number | null;
          disposal_reason?: string | null;
          disposed_at?: string | null;
          disposed_by?: string | null;
          id?: string;
          in_service_date: string;
          name: string;
          residual_value?: number;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          useful_life_months: number;
          version?: number;
        };
        Update: {
          accumulated_depreciation?: number;
          acquisition_cost?: number;
          acquisition_date?: string;
          activated_at?: string | null;
          activated_by?: string | null;
          asset_code?: string;
          category_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          depreciation_method?: string;
          disposal_date?: string | null;
          disposal_journal_id?: string | null;
          disposal_proceeds?: number | null;
          disposal_reason?: string | null;
          disposed_at?: string | null;
          disposed_by?: string | null;
          id?: string;
          in_service_date?: string;
          name?: string;
          residual_value?: number;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          useful_life_months?: number;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_assets_company_id_category_id_fkey";
            columns: ["company_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "fixed_asset_categories";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "fixed_assets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fixed_assets_disposal_journal_id_fkey";
            columns: ["disposal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_adjustment_lines: {
        Row: {
          adjustment_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          total_cost: number;
          unit_cost: number;
        };
        Insert: {
          adjustment_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          line_number: number;
          product_id: string;
          quantity: number;
          total_cost?: number;
          unit_cost?: number;
        };
        Update: {
          adjustment_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          line_number?: number;
          product_id?: string;
          quantity?: number;
          total_cost?: number;
          unit_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_lines_company_id_adjustment_id_fkey";
            columns: ["company_id", "adjustment_id"];
            isOneToOne: false;
            referencedRelation: "inventory_adjustments";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_adjustment_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustment_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      inventory_adjustments: {
        Row: {
          adjustment_date: string;
          adjustment_type: string;
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          document_number: string;
          id: string;
          journal_entry_id: string | null;
          offset_account_id: string;
          posted_at: string | null;
          posted_by: string | null;
          reason: string;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          reversal_journal_id: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          total_cost: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
          warehouse_id: string;
        };
        Insert: {
          adjustment_date: string;
          adjustment_type: string;
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          document_number: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reason: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_cost?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id: string;
        };
        Update: {
          adjustment_date?: string;
          adjustment_type?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          document_number?: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reason?: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_cost?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustments_company_id_offset_account_id_fkey";
            columns: ["company_id", "offset_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_adjustments_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_adjustments_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_adjustments_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          movement_date: string;
          movement_type: string;
          product_id: string;
          quantity: number;
          running_average_cost: number;
          running_quantity: number;
          source_id: string;
          source_line_id: string;
          source_type: string;
          total_cost: number;
          unit_cost: number;
          warehouse_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          movement_date: string;
          movement_type: string;
          product_id: string;
          quantity: number;
          running_average_cost: number;
          running_quantity: number;
          source_id: string;
          source_line_id: string;
          source_type: string;
          total_cost: number;
          unit_cost: number;
          warehouse_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          movement_date?: string;
          movement_type?: string;
          product_id?: string;
          quantity?: number;
          running_average_cost?: number;
          running_quantity?: number;
          source_id?: string;
          source_line_id?: string;
          source_type?: string;
          total_cost?: number;
          unit_cost?: number;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_movements_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      inventory_operation_lines: {
        Row: {
          company_id: string;
          counted_quantity: number | null;
          created_at: string;
          created_by: string | null;
          expected_quantity: number | null;
          id: string;
          line_number: number;
          operation_id: string;
          product_id: string;
          quantity: number | null;
          total_cost: number;
          unit_cost: number;
        };
        Insert: {
          company_id: string;
          counted_quantity?: number | null;
          created_at?: string;
          created_by?: string | null;
          expected_quantity?: number | null;
          id?: string;
          line_number: number;
          operation_id: string;
          product_id: string;
          quantity?: number | null;
          total_cost?: number;
          unit_cost?: number;
        };
        Update: {
          company_id?: string;
          counted_quantity?: number | null;
          created_at?: string;
          created_by?: string | null;
          expected_quantity?: number | null;
          id?: string;
          line_number?: number;
          operation_id?: string;
          product_id?: string;
          quantity?: number | null;
          total_cost?: number;
          unit_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_operation_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_operation_lines_company_id_operation_id_fkey";
            columns: ["company_id", "operation_id"];
            isOneToOne: false;
            referencedRelation: "inventory_operations";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_operation_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      inventory_operations: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          destination_warehouse_id: string | null;
          document_number: string;
          id: string;
          journal_entry_id: string | null;
          offset_account_id: string | null;
          operation_date: string;
          operation_type: string;
          posted_at: string | null;
          posted_by: string | null;
          reason: string;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          reversal_journal_id: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          source_warehouse_id: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          destination_warehouse_id?: string | null;
          document_number: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id?: string | null;
          operation_date: string;
          operation_type: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reason: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_warehouse_id: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          destination_warehouse_id?: string | null;
          document_number?: string;
          id?: string;
          journal_entry_id?: string | null;
          offset_account_id?: string | null;
          operation_date?: string;
          operation_type?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reason?: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_warehouse_id?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_operations_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_operations_company_id_destination_warehouse_id_fkey";
            columns: ["company_id", "destination_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_operations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_operations_company_id_offset_account_id_fkey";
            columns: ["company_id", "offset_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_operations_company_id_source_warehouse_id_fkey";
            columns: ["company_id", "source_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "inventory_operations_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_operations_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          description: string;
          document_date: string;
          exchange_rate: number;
          id: string;
          idempotency_key: string;
          journal_date: string;
          journal_number: string;
          posted_at: string | null;
          posted_by: string | null;
          posting_date: string;
          reversal_of_id: string | null;
          reversed_by_id: string | null;
          source_id: string | null;
          source_type: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          total_credit: number;
          total_debit: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          description: string;
          document_date: string;
          exchange_rate?: number;
          id?: string;
          idempotency_key: string;
          journal_date: string;
          journal_number: string;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date: string;
          reversal_of_id?: string | null;
          reversed_by_id?: string | null;
          source_id?: string | null;
          source_type: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_credit?: number;
          total_debit?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          description?: string;
          document_date?: string;
          exchange_rate?: number;
          id?: string;
          idempotency_key?: string;
          journal_date?: string;
          journal_number?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date?: string;
          reversal_of_id?: string | null;
          reversed_by_id?: string | null;
          source_id?: string | null;
          source_type?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total_credit?: number;
          total_debit?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_currency_code_fkey";
            columns: ["currency_code"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "journal_entries_reversal_of_id_fkey";
            columns: ["reversal_of_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_lines: {
        Row: {
          account_id: string;
          base_credit: number;
          base_debit: number;
          branch_id: string | null;
          company_id: string;
          contact_id: string | null;
          created_at: string;
          created_by: string | null;
          credit: number;
          debit: number;
          department_id: string | null;
          description: string;
          id: string;
          journal_entry_id: string;
          line_number: number;
          project_id: string | null;
          tax_code_id: string | null;
        };
        Insert: {
          account_id: string;
          base_credit?: number;
          base_debit?: number;
          branch_id?: string | null;
          company_id: string;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          credit?: number;
          debit?: number;
          department_id?: string | null;
          description: string;
          id?: string;
          journal_entry_id: string;
          line_number: number;
          project_id?: string | null;
          tax_code_id?: string | null;
        };
        Update: {
          account_id?: string;
          base_credit?: number;
          base_debit?: number;
          branch_id?: string | null;
          company_id?: string;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          credit?: number;
          debit?: number;
          department_id?: string | null;
          description?: string;
          id?: string;
          journal_entry_id?: string;
          line_number?: number;
          project_id?: string | null;
          tax_code_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_lines_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_lines_company_id_account_id_fkey";
            columns: ["company_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "journal_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_lines_company_id_journal_entry_id_fkey";
            columns: ["company_id", "journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "journal_lines_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_lines_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_reversals: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          id: string;
          original_journal_id: string;
          reason: string;
          reversal_journal_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          original_journal_id: string;
          reason: string;
          reversal_journal_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          original_journal_id?: string;
          reason?: string;
          reversal_journal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_reversals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_reversals_original_journal_id_fkey";
            columns: ["original_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_reversals_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          message: string;
          notification_type: string;
          read_at: string | null;
          recipient_user_id: string;
          title: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message: string;
          notification_type: string;
          read_at?: string | null;
          recipient_user_id: string;
          title: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message?: string;
          notification_type?: string;
          read_at?: string | null;
          recipient_user_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_document_lines: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          document_id: string;
          fulfilled_quantity: number;
          id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          source_line_id: string | null;
          total: number;
          unit_amount: number;
          warehouse_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          document_id: string;
          fulfilled_quantity?: number;
          id?: string;
          line_number: number;
          product_id: string;
          quantity: number;
          source_line_id?: string | null;
          total: number;
          unit_amount: number;
          warehouse_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          document_id?: string;
          fulfilled_quantity?: number;
          id?: string;
          line_number?: number;
          product_id?: string;
          quantity?: number;
          source_line_id?: string | null;
          total?: number;
          unit_amount?: number;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_document_lines_company_id_document_id_fkey";
            columns: ["company_id", "document_id"];
            isOneToOne: false;
            referencedRelation: "operational_documents";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "operational_document_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_document_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "operational_document_lines_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "operational_document_lines_source_line_id_fkey";
            columns: ["source_line_id"];
            isOneToOne: false;
            referencedRelation: "operational_document_lines";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_documents: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          closed_reason: string | null;
          company_id: string;
          contact_id: string;
          created_at: string;
          created_by: string;
          document_date: string;
          document_number: string;
          document_type: string;
          id: string;
          journal_entry_id: string | null;
          notes: string | null;
          posted_at: string | null;
          posted_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          reversal_journal_id: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          source_document_id: string | null;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          total: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          closed_reason?: string | null;
          company_id: string;
          contact_id: string;
          created_at?: string;
          created_by: string;
          document_date: string;
          document_number: string;
          document_type: string;
          id?: string;
          journal_entry_id?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_document_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          closed_reason?: string | null;
          company_id?: string;
          contact_id?: string;
          created_at?: string;
          created_by?: string;
          document_date?: string;
          document_number?: string;
          document_type?: string;
          id?: string;
          journal_entry_id?: string | null;
          notes?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_document_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "operational_documents_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_documents_company_id_contact_id_fkey";
            columns: ["company_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "operational_documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_documents_company_id_source_document_id_fkey";
            columns: ["company_id", "source_document_id"];
            isOneToOne: false;
            referencedRelation: "operational_documents";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "operational_documents_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_documents_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_terms: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          due_days: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          due_days?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          due_days?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "payment_terms_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description: string;
          id?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string;
          id?: string;
        };
        Relationships: [];
      };
      product_warehouses: {
        Row: {
          average_cost: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          inventory_value: number;
          last_movement_date: string | null;
          product_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
          warehouse_id: string;
        };
        Insert: {
          average_cost?: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_value?: number;
          last_movement_date?: string | null;
          product_id: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id: string;
        };
        Update: {
          average_cost?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_value?: number;
          last_movement_date?: string | null;
          product_id?: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_warehouses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_warehouses_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "product_warehouses_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      products: {
        Row: {
          barcode: string | null;
          base_unit_id: string;
          cogs_account_id: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          default_purchase_tax_code_id: string | null;
          default_sales_tax_code_id: string | null;
          deleted_at: string | null;
          id: string;
          inventory_account_id: string | null;
          is_active: boolean;
          minimum_stock: number;
          name: string;
          product_type: string;
          purchase_account_id: string;
          purchase_price: number;
          sales_account_id: string;
          sales_price: number;
          sku: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          barcode?: string | null;
          base_unit_id: string;
          cogs_account_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          default_purchase_tax_code_id?: string | null;
          default_sales_tax_code_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          inventory_account_id?: string | null;
          is_active?: boolean;
          minimum_stock?: number;
          name: string;
          product_type: string;
          purchase_account_id: string;
          purchase_price?: number;
          sales_account_id: string;
          sales_price?: number;
          sku: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          barcode?: string | null;
          base_unit_id?: string;
          cogs_account_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          default_purchase_tax_code_id?: string | null;
          default_sales_tax_code_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          inventory_account_id?: string | null;
          is_active?: boolean;
          minimum_stock?: number;
          name?: string;
          product_type?: string;
          purchase_account_id?: string;
          purchase_price?: number;
          sales_account_id?: string;
          sales_price?: number;
          sku?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_company_id_base_unit_id_fkey";
            columns: ["company_id", "base_unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_cogs_account_id_fkey";
            columns: ["company_id", "cogs_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_default_purchase_tax_code_id_fkey";
            columns: ["company_id", "default_purchase_tax_code_id"];
            isOneToOne: false;
            referencedRelation: "tax_codes";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_default_sales_tax_code_id_fkey";
            columns: ["company_id", "default_sales_tax_code_id"];
            isOneToOne: false;
            referencedRelation: "tax_codes";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_company_id_inventory_account_id_fkey";
            columns: ["company_id", "inventory_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_purchase_account_id_fkey";
            columns: ["company_id", "purchase_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "products_company_id_sales_account_id_fkey";
            columns: ["company_id", "sales_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          id: string;
          locale: string;
          updated_at: string | null;
          version: number;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email: string;
          id: string;
          locale?: string;
          updated_at?: string | null;
          version?: number;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          id?: string;
          locale?: string;
          updated_at?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_invoice_lines: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          discount_amount: number;
          expense_account_id: string;
          id: string;
          invoice_id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          tax_rate_version_id: string | null;
          unit_cost: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
          warehouse_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          discount_amount?: number;
          expense_account_id: string;
          id?: string;
          invoice_id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          tax_rate_version_id?: string | null;
          unit_cost: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          discount_amount?: number;
          expense_account_id?: string;
          id?: string;
          invoice_id?: string;
          line_number?: number;
          product_id?: string;
          quantity?: number;
          tax_rate_version_id?: string | null;
          unit_cost?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_lines_company_id_expense_account_id_fkey";
            columns: ["company_id", "expense_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "purchase_invoice_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoice_lines_company_id_invoice_id_fkey";
            columns: ["company_id", "invoice_id"];
            isOneToOne: false;
            referencedRelation: "purchase_invoices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "purchase_invoice_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "purchase_invoice_lines_company_id_tax_rate_version_id_fkey";
            columns: ["company_id", "tax_rate_version_id"];
            isOneToOne: false;
            referencedRelation: "tax_rate_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "purchase_invoice_lines_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      purchase_invoices: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          document_date: string;
          document_number: string;
          due_date: string;
          id: string;
          notes: string | null;
          outstanding_balance: number;
          posted_at: string | null;
          posted_by: string | null;
          posting_date: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          subtotal: number;
          supplier_id: string;
          supplier_reference: string | null;
          tax_total: number;
          total: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          document_date: string;
          document_number: string;
          due_date: string;
          id?: string;
          notes?: string | null;
          outstanding_balance?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          supplier_id: string;
          supplier_reference?: string | null;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          document_date?: string;
          document_number?: string;
          due_date?: string;
          id?: string;
          notes?: string | null;
          outstanding_balance?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          supplier_id?: string;
          supplier_reference?: string | null;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_invoices_company_id_supplier_id_fkey";
            columns: ["company_id", "supplier_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      return_document_lines: {
        Row: {
          account_id: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          discount_amount: number;
          id: string;
          line_number: number;
          net_amount: number;
          product_id: string;
          quantity: number;
          return_id: string;
          source_line_id: string;
          tax_account_id: string | null;
          tax_amount: number;
          total: number;
          unit_amount: number;
          warehouse_id: string | null;
        };
        Insert: {
          account_id: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          discount_amount?: number;
          id?: string;
          line_number: number;
          net_amount: number;
          product_id: string;
          quantity: number;
          return_id: string;
          source_line_id: string;
          tax_account_id?: string | null;
          tax_amount?: number;
          total: number;
          unit_amount: number;
          warehouse_id?: string | null;
        };
        Update: {
          account_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          discount_amount?: number;
          id?: string;
          line_number?: number;
          net_amount?: number;
          product_id?: string;
          quantity?: number;
          return_id?: string;
          source_line_id?: string;
          tax_account_id?: string | null;
          tax_amount?: number;
          total?: number;
          unit_amount?: number;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "return_document_lines_company_id_account_id_fkey";
            columns: ["company_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "return_document_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_document_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "return_document_lines_company_id_return_id_fkey";
            columns: ["company_id", "return_id"];
            isOneToOne: false;
            referencedRelation: "return_documents";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "return_document_lines_company_id_tax_account_id_fkey";
            columns: ["company_id", "tax_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "return_document_lines_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      return_documents: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          company_id: string;
          contact_id: string;
          created_at: string;
          created_by: string;
          document_number: string;
          id: string;
          journal_entry_id: string | null;
          posted_at: string | null;
          posted_by: string | null;
          reason: string;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          return_date: string;
          return_type: string;
          reversal_journal_id: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          source_invoice_id: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          subtotal: number;
          tax_total: number;
          total: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          company_id: string;
          contact_id: string;
          created_at?: string;
          created_by: string;
          document_number: string;
          id?: string;
          journal_entry_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reason: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          return_date: string;
          return_type: string;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_invoice_id: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          company_id?: string;
          contact_id?: string;
          created_at?: string;
          created_by?: string;
          document_number?: string;
          id?: string;
          journal_entry_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reason?: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          return_date?: string;
          return_type?: string;
          reversal_journal_id?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source_invoice_id?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "return_documents_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_documents_company_id_contact_id_fkey";
            columns: ["company_id", "contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "return_documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_documents_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_documents_reversal_journal_id_fkey";
            columns: ["reversal_journal_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_company_id_role_id_fkey";
            columns: ["company_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_invoice_lines: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          discount_amount: number;
          id: string;
          invoice_id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          revenue_account_id: string;
          tax_rate_version_id: string | null;
          unit_price: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
          warehouse_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          discount_amount?: number;
          id?: string;
          invoice_id: string;
          line_number: number;
          product_id: string;
          quantity: number;
          revenue_account_id: string;
          tax_rate_version_id?: string | null;
          unit_price: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          discount_amount?: number;
          id?: string;
          invoice_id?: string;
          line_number?: number;
          product_id?: string;
          quantity?: number;
          revenue_account_id?: string;
          tax_rate_version_id?: string | null;
          unit_price?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_invoice_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoice_lines_company_id_invoice_id_fkey";
            columns: ["company_id", "invoice_id"];
            isOneToOne: false;
            referencedRelation: "sales_invoices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sales_invoice_lines_company_id_product_id_fkey";
            columns: ["company_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sales_invoice_lines_company_id_revenue_account_id_fkey";
            columns: ["company_id", "revenue_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sales_invoice_lines_company_id_tax_rate_version_id_fkey";
            columns: ["company_id", "tax_rate_version_id"];
            isOneToOne: false;
            referencedRelation: "tax_rate_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sales_invoice_lines_company_id_warehouse_id_fkey";
            columns: ["company_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      sales_invoices: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          currency_code: string;
          customer_id: string;
          document_date: string;
          document_number: string;
          due_date: string;
          exchange_rate: number;
          id: string;
          notes: string | null;
          outstanding_balance: number;
          posted_at: string | null;
          posted_by: string | null;
          posting_date: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          subtotal: number;
          tax_total: number;
          total: number;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          currency_code?: string;
          customer_id: string;
          document_date: string;
          document_number: string;
          due_date: string;
          exchange_rate?: number;
          id?: string;
          notes?: string | null;
          outstanding_balance?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          currency_code?: string;
          customer_id?: string;
          document_date?: string;
          document_number?: string;
          due_date?: string;
          exchange_rate?: number;
          id?: string;
          notes?: string | null;
          outstanding_balance?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          posting_date?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          subtotal?: number;
          tax_total?: number;
          total?: number;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_invoices_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoices_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sales_invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_invoices_currency_code_fkey";
            columns: ["currency_code"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
        ];
      };
      supplier_payment_allocations: {
        Row: {
          allocated_amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          payable_id: string;
          payment_id: string;
        };
        Insert: {
          allocated_amount: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          payable_id: string;
          payment_id: string;
        };
        Update: {
          allocated_amount?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          payable_id?: string;
          payment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_payment_allocations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplier_payment_allocations_company_id_payment_id_fkey";
            columns: ["company_id", "payment_id"];
            isOneToOne: false;
            referencedRelation: "supplier_payments";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "supplier_payment_allocations_payable_id_fkey";
            columns: ["payable_id"];
            isOneToOne: false;
            referencedRelation: "accounts_payable";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_payments: {
        Row: {
          amount: number;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at: string;
          created_by: string;
          document_number: string;
          id: string;
          notes: string | null;
          payment_date: string;
          posted_at: string | null;
          posted_by: string | null;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          status: string;
          supplier_id: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          amount: number;
          bank_account_id: string;
          branch_id: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          document_number: string;
          id?: string;
          notes?: string | null;
          payment_date: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          supplier_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          amount?: number;
          bank_account_id?: string;
          branch_id?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          document_number?: string;
          id?: string;
          notes?: string | null;
          payment_date?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          status?: string;
          supplier_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_payments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplier_payments_company_id_bank_account_id_fkey";
            columns: ["company_id", "bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "supplier_payments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplier_payments_company_id_supplier_id_fkey";
            columns: ["company_id", "supplier_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      tax_codes: {
        Row: {
          category: string;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          input_account_id: string | null;
          is_active: boolean;
          name: string;
          output_account_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          category: string;
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          input_account_id?: string | null;
          is_active?: boolean;
          name: string;
          output_account_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          category?: string;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          input_account_id?: string | null;
          is_active?: boolean;
          name?: string;
          output_account_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tax_codes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tax_codes_company_id_input_account_id_fkey";
            columns: ["company_id", "input_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "tax_codes_company_id_output_account_id_fkey";
            columns: ["company_id", "output_account_id"];
            isOneToOne: false;
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      tax_export_batches: {
        Row: {
          artifact_path: string | null;
          company_id: string;
          created_at: string;
          created_by: string;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          period_end: string;
          period_start: string;
          profile_id: string;
          status: string;
          validation_errors: Json;
        };
        Insert: {
          artifact_path?: string | null;
          company_id: string;
          created_at?: string;
          created_by: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          period_end: string;
          period_start: string;
          profile_id: string;
          status?: string;
          validation_errors?: Json;
        };
        Update: {
          artifact_path?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          profile_id?: string;
          status?: string;
          validation_errors?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "tax_export_batches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tax_export_batches_company_id_profile_id_fkey";
            columns: ["company_id", "profile_id"];
            isOneToOne: false;
            referencedRelation: "tax_export_profiles";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      tax_export_profiles: {
        Row: {
          adapter_code: string;
          adapter_version: string;
          code: string;
          company_id: string;
          configuration: Json;
          created_at: string;
          created_by: string | null;
          effective_from: string;
          id: string;
          name: string;
          schema_checksum: string | null;
          source_reference: string | null;
          status: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          adapter_code: string;
          adapter_version: string;
          code: string;
          company_id: string;
          configuration?: Json;
          created_at?: string;
          created_by?: string | null;
          effective_from: string;
          id?: string;
          name: string;
          schema_checksum?: string | null;
          source_reference?: string | null;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          adapter_code?: string;
          adapter_version?: string;
          code?: string;
          company_id?: string;
          configuration?: Json;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          id?: string;
          name?: string;
          schema_checksum?: string | null;
          source_reference?: string | null;
          status?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tax_export_profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tax_rate_versions: {
        Row: {
          calculation_basis: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          effective_from: string;
          effective_to: string | null;
          id: string;
          notes: string | null;
          price_includes_tax: boolean;
          rate: number;
          rounding_method: string;
          rounding_scale: number;
          source_reference: string | null;
          status: string;
          tax_code_id: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          calculation_basis?: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          notes?: string | null;
          price_includes_tax?: boolean;
          rate: number;
          rounding_method?: string;
          rounding_scale?: number;
          source_reference?: string | null;
          status?: string;
          tax_code_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          calculation_basis?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          notes?: string | null;
          price_includes_tax?: boolean;
          rate?: number;
          rounding_method?: string;
          rounding_scale?: number;
          source_reference?: string | null;
          status?: string;
          tax_code_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tax_rate_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tax_rate_versions_company_id_tax_code_id_fkey";
            columns: ["company_id", "tax_code_id"];
            isOneToOne: false;
            referencedRelation: "tax_codes";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      units: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          decimal_places: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          decimal_places?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          decimal_places?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "units_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouses: {
        Row: {
          address_line: string | null;
          branch_id: string;
          city: string | null;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          postal_code: string | null;
          province: string | null;
          updated_at: string | null;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          address_line?: string | null;
          branch_id: string;
          city?: string | null;
          code: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          postal_code?: string | null;
          province?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          address_line?: string | null;
          branch_id?: string;
          city?: string | null;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          postal_code?: string | null;
          province?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_branch_id_fkey";
            columns: ["company_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "warehouses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      activate_fixed_asset: {
        Args: { p_asset_id: string; p_company_id: string };
        Returns: number;
      };
      approve_document: {
        Args: {
          p_comment?: string;
          p_company_id: string;
          p_request_id: string;
        };
        Returns: undefined;
      };
      bootstrap_demo_company: { Args: { p_users: Json }; Returns: string };
      close_accounting_period: {
        Args: { p_company_id: string; p_period_id: string };
        Returns: undefined;
      };
      convert_operational_document: {
        Args: { p_company_id: string; p_source_id: string };
        Returns: string;
      };
      create_reconciliation_adjustment: {
        Args: {
          p_company_id: string;
          p_description: string;
          p_idempotency_key: string;
          p_line_id: string;
          p_offset_account_id: string;
        };
        Returns: string;
      };
      current_user_has_company_access: {
        Args: { p_company_id: string };
        Returns: boolean;
      };
      current_user_has_permission: {
        Args: { p_company_id: string; p_permission_code: string };
        Returns: boolean;
      };
      current_user_role: { Args: { p_company_id: string }; Returns: string };
      decide_cash_transaction: {
        Args: {
          p_action: string;
          p_comment?: string;
          p_company_id: string;
          p_transaction_id: string;
        };
        Returns: undefined;
      };
      decide_inventory_adjustment: {
        Args: {
          p_action: string;
          p_adjustment_id: string;
          p_comment?: string;
          p_company_id: string;
        };
        Returns: undefined;
      };
      decide_inventory_operation: {
        Args: {
          p_action: string;
          p_comment?: string;
          p_company_id: string;
          p_operation_id: string;
        };
        Returns: undefined;
      };
      decide_operational_document: {
        Args: {
          p_action: string;
          p_comment?: string;
          p_company_id: string;
          p_document_id: string;
        };
        Returns: undefined;
      };
      decide_return_document: {
        Args: {
          p_action: string;
          p_comment?: string;
          p_company_id: string;
          p_return_id: string;
        };
        Returns: undefined;
      };
      delete_cash_transaction_draft: {
        Args: {
          p_company_id: string;
          p_transaction_id: string;
          p_version: number;
        };
        Returns: undefined;
      };
      delete_fixed_asset_draft: {
        Args: { p_asset_id: string; p_company_id: string; p_version: number };
        Returns: undefined;
      };
      delete_inventory_adjustment: {
        Args: {
          p_adjustment_id: string;
          p_company_id: string;
          p_version: number;
        };
        Returns: undefined;
      };
      delete_inventory_operation: {
        Args: {
          p_company_id: string;
          p_operation_id: string;
          p_version: number;
        };
        Returns: undefined;
      };
      delete_invoice_draft: {
        Args: {
          p_company_id: string;
          p_document_type: string;
          p_invoice_id: string;
          p_version: number;
        };
        Returns: undefined;
      };
      delete_operational_draft: {
        Args: {
          p_company_id: string;
          p_document_id: string;
          p_version: number;
        };
        Returns: undefined;
      };
      delete_return_draft: {
        Args: { p_company_id: string; p_return_id: string; p_version: number };
        Returns: undefined;
      };
      delete_settlement_draft: {
        Args: {
          p_company_id: string;
          p_settlement_id: string;
          p_settlement_type: string;
          p_version: number;
        };
        Returns: undefined;
      };
      dispose_fixed_asset: {
        Args: {
          p_asset_id: string;
          p_company_id: string;
          p_disposal_date: string;
          p_gain_loss_account_id: string;
          p_idempotency_key: string;
          p_proceeds: number;
          p_proceeds_account_id: string;
          p_reason: string;
        };
        Returns: string;
      };
      finalize_bank_reconciliation: {
        Args: { p_company_id: string; p_reconciliation_id: string };
        Returns: undefined;
      };
      get_dashboard_metrics: { Args: { p_company_id: string }; Returns: Json };
      get_my_permissions: { Args: { p_company_id: string }; Returns: string[] };
      match_bank_statement_line: {
        Args: {
          p_company_id: string;
          p_line_id: string;
          p_matched_id: string;
          p_matched_type: string;
        };
        Returns: undefined;
      };
      next_cash_transaction_number: {
        Args: {
          p_branch_id: string;
          p_company_id: string;
          p_document_date: string;
          p_type: string;
        };
        Returns: string;
      };
      next_document_number: {
        Args: {
          p_branch_id?: string;
          p_company_id: string;
          p_document_date: string;
          p_document_type: string;
        };
        Returns: string;
      };
      next_inventory_adjustment_number: {
        Args: {
          p_branch_id: string;
          p_company_id: string;
          p_document_date: string;
        };
        Returns: string;
      };
      next_inventory_operation_number: {
        Args: {
          p_branch_id: string;
          p_company_id: string;
          p_operation_date: string;
          p_operation_type: string;
        };
        Returns: string;
      };
      next_operational_number: {
        Args: {
          p_branch_id: string;
          p_company_id: string;
          p_document_date: string;
          p_document_type: string;
        };
        Returns: string;
      };
      next_return_number: {
        Args: {
          p_branch_id: string;
          p_company_id: string;
          p_date: string;
          p_type: string;
        };
        Returns: string;
      };
      notify_permission_users: {
        Args: {
          p_company_id: string;
          p_entity_id: string;
          p_entity_type: string;
          p_exclude_user: string;
          p_message: string;
          p_permission: string;
          p_title: string;
          p_type: string;
        };
        Returns: undefined;
      };
      post_cash_transaction: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_transaction_id: string;
        };
        Returns: string;
      };
      post_customer_receipt: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_receipt_id: string;
        };
        Returns: string;
      };
      post_fixed_asset_depreciation: {
        Args: {
          p_asset_id: string;
          p_company_id: string;
          p_through_date: string;
        };
        Returns: number;
      };
      post_inventory_adjustment: {
        Args: {
          p_adjustment_id: string;
          p_company_id: string;
          p_idempotency_key: string;
        };
        Returns: string;
      };
      post_inventory_operation: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_operation_id: string;
        };
        Returns: string;
      };
      post_manual_journal: {
        Args: {
          p_branch_id?: string;
          p_company_id: string;
          p_description: string;
          p_idempotency_key: string;
          p_lines: Json;
          p_posting_date: string;
        };
        Returns: string;
      };
      post_operational_fulfillment: {
        Args: {
          p_company_id: string;
          p_document_id: string;
          p_idempotency_key: string;
        };
        Returns: string;
      };
      post_purchase_invoice: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_invoice_id: string;
        };
        Returns: string;
      };
      post_return_document: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_return_id: string;
        };
        Returns: string;
      };
      post_sales_invoice: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_invoice_id: string;
        };
        Returns: string;
      };
      post_supplier_payment: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_payment_id: string;
        };
        Returns: string;
      };
      reject_document: {
        Args: { p_comment: string; p_company_id: string; p_request_id: string };
        Returns: undefined;
      };
      reopen_accounting_period: {
        Args: { p_company_id: string; p_period_id: string; p_reason: string };
        Returns: undefined;
      };
      reverse_cash_transaction: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_reason: string;
          p_reversal_date: string;
          p_transaction_id: string;
        };
        Returns: string;
      };
      reverse_inventory_adjustment: {
        Args: {
          p_adjustment_id: string;
          p_company_id: string;
          p_idempotency_key: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_inventory_operation: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_operation_id: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_invoice: {
        Args: {
          p_company_id: string;
          p_document_type: string;
          p_idempotency_key: string;
          p_invoice_id: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_journal_entry: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_journal_id: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_journal_entry_core: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_journal_id: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_operational_fulfillment: {
        Args: {
          p_company_id: string;
          p_document_id: string;
          p_idempotency_key: string;
          p_reason: string;
          p_reversal_date: string;
        };
        Returns: string;
      };
      reverse_return_document: {
        Args: {
          p_company_id: string;
          p_date: string;
          p_idempotency_key: string;
          p_reason: string;
          p_return_id: string;
        };
        Returns: string;
      };
      reverse_settlement: {
        Args: {
          p_company_id: string;
          p_idempotency_key: string;
          p_reason: string;
          p_reversal_date: string;
          p_settlement_id: string;
          p_settlement_type: string;
        };
        Returns: string;
      };
      save_account_mappings: {
        Args: { p_company_id: string; p_mappings: Json };
        Returns: number;
      };
      save_bank_reconciliation: {
        Args: {
          p_company_id: string;
          p_header: Json;
          p_lines: Json;
          p_reconciliation_id: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_cash_transaction: {
        Args: {
          p_company_id: string;
          p_payload: Json;
          p_transaction_id: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_contact: {
        Args: {
          p_address: Json;
          p_company_id: string;
          p_contact: Json;
          p_contact_id: string;
          p_version: number;
        };
        Returns: string;
      };
      save_fixed_asset: {
        Args: {
          p_asset: Json;
          p_asset_id: string;
          p_company_id: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_inventory_adjustment: {
        Args: {
          p_adjustment_id: string;
          p_company_id: string;
          p_header: Json;
          p_lines: Json;
          p_version?: number;
        };
        Returns: string;
      };
      save_inventory_operation: {
        Args: {
          p_company_id: string;
          p_header: Json;
          p_lines: Json;
          p_operation_id: string;
          p_operation_type: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_invoice_draft: {
        Args: {
          p_company_id: string;
          p_document_type: string;
          p_header: Json;
          p_invoice_id: string;
          p_lines: Json;
          p_version: number;
        };
        Returns: string;
      };
      save_operational_document: {
        Args: {
          p_company_id: string;
          p_document_id: string;
          p_document_type: string;
          p_header: Json;
          p_lines: Json;
          p_version?: number;
        };
        Returns: string;
      };
      save_return_document: {
        Args: {
          p_company_id: string;
          p_lines: Json;
          p_reason: string;
          p_return_date: string;
          p_return_id: string;
          p_return_type: string;
          p_source_invoice_id: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_role: {
        Args: {
          p_code: string;
          p_company_id: string;
          p_name: string;
          p_permission_codes: string[];
          p_role_id: string;
          p_version?: number;
        };
        Returns: string;
      };
      save_settlement_draft: {
        Args: {
          p_allocations: Json;
          p_company_id: string;
          p_header: Json;
          p_settlement_id: string;
          p_settlement_type: string;
          p_version: number;
        };
        Returns: string;
      };
      set_role_active: {
        Args: {
          p_company_id: string;
          p_is_active: boolean;
          p_role_id: string;
          p_version: number;
        };
        Returns: string;
      };
      submit_cash_transaction: {
        Args: { p_company_id: string; p_transaction_id: string };
        Returns: string;
      };
      submit_document: {
        Args: {
          p_company_id: string;
          p_document_id: string;
          p_document_type: string;
        };
        Returns: string;
      };
      submit_inventory_adjustment: {
        Args: { p_adjustment_id: string; p_company_id: string };
        Returns: string;
      };
      submit_inventory_operation: {
        Args: { p_company_id: string; p_operation_id: string };
        Returns: string;
      };
      submit_operational_document: {
        Args: { p_company_id: string; p_document_id: string };
        Returns: string;
      };
      submit_return_document: {
        Args: { p_company_id: string; p_return_id: string };
        Returns: string;
      };
      unmatch_bank_statement_line: {
        Args: { p_company_id: string; p_line_id: string };
        Returns: undefined;
      };
      verify_general_ledger_balance: {
        Args: { p_company_id: string; p_from: string; p_to: string };
        Returns: {
          balanced: boolean;
          total_credit: number;
          total_debit: number;
        }[];
      };
      verify_subledger_reconciliation: {
        Args: { p_company_id: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
