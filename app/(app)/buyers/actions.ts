'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createBuyer,
  updateBuyer,
  deleteBuyer,
  type BuyerInsert,
  type BuyerUpdate,
} from '@/lib/queries/buyers'
import type { BuyerType } from '@/types/supabase'

export type BuyerFormState = { error?: string; ok?: boolean }

const required = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim()
  if (!s) throw new Error(`${name} 필수입니다.`)
  return s
}
const optional = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}
const checkbox = (v: FormDataEntryValue | null): boolean => v === 'on'

const buildPayload = (form: FormData) => {
  const buyerType = required(form.get('buyer_type'), '개인/법인') as BuyerType
  if (buyerType !== '개인' && buyerType !== '법인') {
    throw new Error('개인/법인 값이 올바르지 않습니다.')
  }
  // ⚠️ ssn1/ssn2 는 bytea(pgcrypto) 컬럼. Phase 10 에선 RPC 미구현 → 입력 무시.
  return {
    buyer_no: required(form.get('buyer_no'), '계약자번호'),
    buyer_type: buyerType,
    name1: required(form.get('name1'), '계약자명1'),
    name2: optional(form.get('name2')),
    phone1: optional(form.get('phone1')),
    phone2: optional(form.get('phone2')),
    tel1: optional(form.get('tel1')),
    tel2: optional(form.get('tel2')),
    email1: optional(form.get('email1')),
    email2: optional(form.get('email2')),
    address1: optional(form.get('address1')),
    address2: optional(form.get('address2')),
    memo1: optional(form.get('memo1')),
    memo2: optional(form.get('memo2')),
    agree_sms: checkbox(form.get('agree_sms')),
    agree_email: checkbox(form.get('agree_email')),
    agree_post: checkbox(form.get('agree_post')),
    ssn1: null,
    ssn2: null,
  }
}

export async function createBuyerAction(
  _prev: BuyerFormState,
  form: FormData,
): Promise<BuyerFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const payload: BuyerInsert = { ...buildPayload(form), creator: user.id, updater: user.id }
    await createBuyer(supabase, payload)
    revalidatePath('/buyers')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateBuyerAction(
  _prev: BuyerFormState,
  form: FormData,
): Promise<BuyerFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const payload: BuyerUpdate = { ...buildPayload(form), updater: user.id }
    await updateBuyer(supabase, id, payload)
    revalidatePath('/buyers')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteBuyerAction(form: FormData): Promise<void> {
  const user = await getCurrentAppUser()
  if (!user) return
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteBuyer(supabase, id)
  revalidatePath('/buyers')
}
