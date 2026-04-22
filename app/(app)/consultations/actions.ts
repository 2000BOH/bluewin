'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import {
  createConsultation,
  updateConsultation,
  deleteConsultation,
  type ConsultationInsert,
  type ConsultationUpdate,
} from '@/lib/queries/consultations'

export type ConsultationFormState = { error?: string; ok?: boolean }

const required = (v: FormDataEntryValue | null, name: string): string => {
  const s = String(v ?? '').trim()
  if (!s) throw new Error(`${name} 필수입니다.`)
  return s
}
const optional = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim()
  return s ? s : null
}

const buildPayload = (form: FormData) => ({
  buyer_id: required(form.get('buyer_id'), '계약자'),
  contract_id: optional(form.get('contract_id')),
  consult_date: required(form.get('consult_date'), '상담일'),
  channel: optional(form.get('channel')),
  title: optional(form.get('title')),
  content: optional(form.get('content')),
  result: optional(form.get('result')),
  note: optional(form.get('note')),
  consultant: optional(form.get('consultant')),
})

export async function createConsultationAction(
  _prev: ConsultationFormState,
  form: FormData,
): Promise<ConsultationFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const supabase = createServerSupabase()
    const payload: ConsultationInsert = { ...buildPayload(form), creator: user.id, updater: user.id }
    await createConsultation(supabase, payload)
    revalidatePath('/consultations')
    revalidatePath('/consultation-history')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateConsultationAction(
  _prev: ConsultationFormState,
  form: FormData,
): Promise<ConsultationFormState> {
  try {
    const user = await getCurrentAppUser()
    if (!user) return { error: '로그인이 필요합니다.' }
    const id = required(form.get('id'), 'id')
    const supabase = createServerSupabase()
    const payload: ConsultationUpdate = { ...buildPayload(form), updater: user.id }
    await updateConsultation(supabase, id, payload)
    revalidatePath('/consultations')
    revalidatePath('/consultation-history')
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteConsultationAction(form: FormData): Promise<void> {
  const user = await getCurrentAppUser()
  if (!user) return
  const id = String(form.get('id') ?? '').trim()
  if (!id) return
  const supabase = createServerSupabase()
  await deleteConsultation(supabase, id)
  revalidatePath('/consultations')
  revalidatePath('/consultation-history')
}
