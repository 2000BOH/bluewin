// Supabase Database 타입.
// supabase/migrations/001_init.sql 와 1:1 매칭. CLI 자동생성 가능해질 때까지 수동 유지.
// 새 컬럼/테이블 추가 시 반드시 이 파일과 마이그레이션을 함께 갱신할 것.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CommonStatus = '접수' | '영선' | '외부업체' | '퇴실' | '청소' | '완료'
export type UrgencyLevel = '긴급' | '일반' | '낮음'
export type UserRole = 'admin' | 'staff' | 'viewer'
export type BuyerType = '개인' | '법인'
export type MaintenanceSourceEnum = '직접입력' | 'complaint' | 'room-transfer' | 'room-check' | 'room-maintenance'
export type MaintenanceTypeEnum = '청소' | '수리' | '비품교체' | '도배장판' | '설비' | '기타'
export type OverallCheckStatus = '정상' | '주의' | '불량'
export type HistoryAction = 'insert' | 'update' | 'delete'
export type RnrStaffNoEnum = '01' | '02' | '03' | '04' | '05' | '06'

type Authoring = {
  creator: string | null
  updater: string | null
}
type Timestamps = {
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          assigned_phase: number | null
          rnr_no: RnrStaffNoEnum | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: UserRole
          assigned_phase?: number | null
          rnr_no?: RnrStaffNoEnum | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }

      rnr_mapping: {
        Row: {
          rnr_no: RnrStaffNoEnum
          name: string | null
          stay_types: Json
          updated_at: string
        }
        Insert: {
          rnr_no: RnrStaffNoEnum
          name?: string | null
          stay_types?: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['rnr_mapping']['Insert']>
        Relationships: []
      }

      rooms: {
        Row: {
          id: string
          phase: number
          room_no: string
          type: string | null
          view_type: string | null
          land_area: number | null
          exclusive_area: number | null
          partial_common_area: number | null
          other_common_area: number | null
          parking_common_area: number | null
          sale_area: number | null
          exclusive_ratio: number | null
          has_terrace: boolean
          has_attic: boolean
          sale_price_excl_vat: number | null
          sale_price_incl_vat: number | null
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
        Relationships: []
      }

      buyers: {
        Row: {
          id: string
          buyer_no: string
          buyer_type: BuyerType
          name1: string
          name2: string | null
          ssn1: string | null
          ssn2: string | null
          phone1: string | null
          phone2: string | null
          tel1: string | null
          tel2: string | null
          email1: string | null
          email2: string | null
          address1: string | null
          address2: string | null
          memo1: string | null
          memo2: string | null
          agree_sms: boolean
          agree_email: boolean
          agree_post: boolean
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['buyers']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['buyers']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['buyers']['Insert']>
        Relationships: []
      }

      contracts: {
        Row: {
          id: string
          phase: number
          room_no: string
          contract_no: string | null
          buyer_id: string
          contract_form: string | null
          contract_date: string | null
          operation_type: string | null
          operation_start: string | null
          operation_end: string | null
          accommodation_type: string | null
          reverse_issuance: boolean
          initial_cost: number | null
          initial_cost_detail: Json | null
          move_in_date: string | null
          account_bank: string | null
          account_no: string | null
          business_no: string | null
          tax_info: Json | null
          tenant_name: string | null
          tenant_phone: string | null
          lease_start: string | null
          lease_end: string | null
          note: string | null
          // Phase C 확장 (migration 004)
          total_supply_amount: number | null
          contract_status: string | null
          settlement_date: string | null
          entrustment_date: string | null
          settlement_amount: number | null
          commission_amount: number | null
          rent_free_months: number | null
          stay_agreement: boolean
          prepaid_mgmt_fee: number | null
          furniture_fee: number | null
          joint_purchase_fee: number | null
          prepaid_mgmt_deposit: number | null
          cash_receipt_reverse: boolean
          account_holder_name: string | null
          business_name: string | null
          representative_name: string | null
          deposit_amount: number | null
          monthly_rent: number | null
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['contracts']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['contracts']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>
        Relationships: []
      }

      consultations: {
        Row: {
          id: string
          buyer_id: string
          contract_id: string | null
          consult_date: string
          channel: string | null
          title: string | null
          content: string | null
          result: string | null
          note: string | null
          consultant: string | null
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['consultations']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['consultations']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['consultations']['Insert']>
        Relationships: []
      }

      maintenance_requests: {
        Row: {
          id: string
          phase: number
          room_no: string
          contract_id: string | null
          title: string
          content: string | null
          requester: string | null
          request_date: string
          urgency: UrgencyLevel
          status: CommonStatus
          assigned_to: string | null
          action_content: string | null
          source: MaintenanceSourceEnum
          source_id: string | null
          stay_type: string | null
          rnr_no: RnrStaffNoEnum | null
          completed_at: string | null
          completed_by: string | null
          photos: Json
        } & Authoring & Timestamps
        Insert: Omit<
          Database['public']['Tables']['maintenance_requests']['Row'],
          'id' | 'created_at' | 'updated_at' | 'photos'
        > & Partial<
          Pick<
            Database['public']['Tables']['maintenance_requests']['Row'],
            'id' | 'created_at' | 'updated_at' | 'photos'
          >
        >
        Update: Partial<Database['public']['Tables']['maintenance_requests']['Insert']>
        Relationships: []
      }

      room_transfers: {
        Row: {
          id: string
          from_phase: number
          from_room_no: string
          to_phase: number
          to_room_no: string
          tenant_name: string | null
          tenant_phone: string | null
          transfer_date: string
          reason: string | null
          status: CommonStatus
          note: string | null
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['room_transfers']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['room_transfers']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['room_transfers']['Insert']>
        Relationships: []
      }

      room_checks: {
        Row: {
          id: string
          phase: number
          room_no: string
          contract_id: string | null
          check_date: string
          checker: string | null
          checklist: Json
          overall_status: OverallCheckStatus
          special_notes: string | null
          photos: Json
          next_check_date: string | null
          status: CommonStatus
          checklist_detail: Json
          ok_count: number
          need_count: number
          move_in_notes: string | null
          contract_notes: string | null
          move_out_notes: string | null
        } & Authoring & Timestamps
        Insert: Omit<
          Database['public']['Tables']['room_checks']['Row'],
          'id' | 'created_at' | 'updated_at' |
          'checklist_detail' | 'ok_count' | 'need_count' |
          'move_in_notes' | 'contract_notes' | 'move_out_notes'
        > & Partial<
          Pick<
            Database['public']['Tables']['room_checks']['Row'],
            'id' | 'created_at' | 'updated_at' |
            'checklist_detail' | 'ok_count' | 'need_count' |
            'move_in_notes' | 'contract_notes' | 'move_out_notes'
          >
        >
        Update: Partial<Database['public']['Tables']['room_checks']['Insert']>
        Relationships: []
      }

      room_maintenance_tasks: {
        Row: {
          id: string
          phase: number
          room_no: string
          contract_id: string | null
          maintenance_type: MaintenanceTypeEnum
          content: string | null
          requester: string | null
          request_date: string
          assigned_to: string | null
          status: CommonStatus
          cost: number | null
          completed_at: string | null
          completed_by: string | null
        } & Authoring & Timestamps
        Insert: Omit<Database['public']['Tables']['room_maintenance_tasks']['Row'], 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Database['public']['Tables']['room_maintenance_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['room_maintenance_tasks']['Insert']>
        Relationships: []
      }

      change_history: {
        Row: {
          id: string
          table_name: string
          record_id: string
          field_name_ko: string | null
          old_value: Json | null
          new_value: Json | null
          changed_by: string | null
          changed_at: string
          action: HistoryAction
        }
        Insert: Omit<Database['public']['Tables']['change_history']['Row'], 'id' | 'changed_at'> &
          Partial<Pick<Database['public']['Tables']['change_history']['Row'], 'id' | 'changed_at'>>
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      encrypt_ssn: {
        Args: { plain: string; key: string }
        Returns: string
      }
    }
    Enums: {
      common_status: CommonStatus
      urgency_level: UrgencyLevel
      user_role: UserRole
      buyer_type: BuyerType
      maintenance_source: MaintenanceSourceEnum
      maintenance_type: MaintenanceTypeEnum
      overall_check_status: OverallCheckStatus
      history_action: HistoryAction
      rnr_staff_no: RnrStaffNoEnum
    }
    CompositeTypes: Record<string, never>
  }
}
