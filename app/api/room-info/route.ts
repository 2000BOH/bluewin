// 민원접수/객실정보 폼 전용: 차수+호수로 계약 전체 컬럼 조회 API

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const phase = req.nextUrl.searchParams.get('phase')
  const room_no = req.nextUrl.searchParams.get('room_no')

  if (!phase || !room_no) return NextResponse.json({ error: 'phase, room_no 필수' }, { status: 400 })
  const phaseNum = Number(phase)
  if (!Number.isFinite(phaseNum) || phaseNum <= 0) return NextResponse.json({ error: '차수 오류' }, { status: 400 })

  try {
    const supabase = createServiceSupabase()
    const { data, error } = await supabase
      .from('contracts')
      .select('id, contract_no, contract_form, contract_date, contract_status, settlement_date, entrustment_date, reverse_issuance, operation_type, operation_start, operation_end, settlement_amount, commission_amount, stay_agreement, rent_free_months, initial_cost, move_in_date, prepaid_mgmt_fee, furniture_fee, joint_purchase_fee, prepaid_mgmt_deposit, cash_receipt_reverse, account_bank, account_no, account_holder_name, business_no, business_name, representative_name, accommodation_type, tenant_name, tenant_phone, deposit_amount, monthly_rent, lease_start, lease_end, note')
      .eq('phase', phaseNum)
      .eq('room_no', room_no.trim())
      .maybeSingle()

    if (error) { console.error('[room-info]', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
    if (!data) return NextResponse.json({ found: false })

    return NextResponse.json({ found: true, ...data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
