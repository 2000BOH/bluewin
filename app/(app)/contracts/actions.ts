'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createContract,
  updateContract,
  deleteContract,
  type ContractInsert,
  type ContractUpdate,
} from '@/lib/queries/contracts'
import { parseNumber } from '@/lib/utils/format'

export type ContractFormState = { error?: string; ok?: boolean; id?: string }

const required = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim()
  if (!s) throw new Error(`${name} 필수입니다.`)
  return s
}
const optional = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}
const numReq = (v: FormDataEntryValue | null, name: string): number => {
  const n = Number(v)
  if (!Number.isFinite(n)) throw new Error(`${name} 숫자여야 합니다.`)
  return n
}
const numOpt = (v: FormDataEntryValue | null): number | null =>
  parseNumber(String(v ?? ''))
const dateOpt = (v: FormDataEntryValue | null): string | null => optional(v)
const checkbox = (v: FormDataEntryValue | null): boolean => v === 'on'

const buildPayload = (form: FormData) => ({
  phase: numReq(form.get('phase'), '차수'),
  room_no: required(form.get('room_no'), '호수'),
  contract_no: optional(form.get('contract_no')),
  buyer_id: required(form.get('buyer_id'), '계약자'),
  contract_form: optional(form.get('contract_form')),
  contract_date: dateOpt(form.get('contract_date')),
  operation_type: optional(form.get('operation_type')),
  operation_start: dateOpt(form.get('operation_start')),
  operation_end: dateOpt(form.get('operation_end')),
  accommodation_type: optional(form.get('accommodation_type')),
  reverse_issuance: checkbox(form.get('reverse_issuance')),
  initial_cost: numOpt(form.get('initial_cost')),
  initial_cost_detail: null,
  move_in_date: dateOpt(form.get('move_in_date')),
  account_bank: optional(form.get('account_bank')),
  account_no: optional(form.get('account_no')),
  business_no: optional(form.get('business_no')),
  tax_info: null,
  tenant_name: optional(form.get('tenant_name')),
  tenant_phone: optional(form.get('tenant_phone')),
  lease_start: dateOpt(form.get('lease_start')),
  lease_end: dateOpt(form.get('lease_end')),
  note: optional(form.get('note')),
})

export async function createContractAction(
  _prev: ContractFormState,
  form: FormData,
): Promise<ContractFormState> {
  let newId: string | null = null
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const payload: ContractInsert = { ...buildPayload(form), creator: user.id, updater: user.id }
    const created = await createContract(supabase, payload)
    newId = created.id
    revalidatePath('/contracts')
  } catch (e) {
    return { error: (e as Error).message }
  }
  if (newId) redirect(`/contracts/${newId}`)
  return { ok: true }
}

export async function updateContractAction(
  _prev: ContractFormState,
  form: FormData,
): Promise<ContractFormState> {
  let id: string | null = null
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const payload: ContractUpdate = { ...buildPayload(form), updater: user.id }
    await updateContract(supabase, id, payload)
    revalidatePath('/contracts')
    revalidatePath(`/contracts/${id}`)
  } catch (e) {
    return { error: (e as Error).message }
  }
  if (id) redirect(`/contracts/${id}`)
  return { ok: true }
}

export async function deleteContractAction(form: FormData): Promise<void> {
  const user = await getCurrentAppUser()
  if (!user) return
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteContract(supabase, id)
  revalidatePath('/contracts')
  redirect('/contracts')
}
