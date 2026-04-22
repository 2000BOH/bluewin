'use client'

// 로그인 페이지.
// - 이메일 + 비밀번호 입력
// - 서버 액션(loginAction)으로 Supabase Auth 로그인
// - ?redirect=/경로 파라미터를 따라 로그인 후 원래 페이지로 이동

import { Suspense } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { loginAction, type LoginState } from './actions'

const INITIAL_STATE: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? '로그인 중...' : '로그인'}
    </Button>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const redirectTo = params.get('redirect') ?? '/dashboard'
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Bluewin</h1>
        <p className="mt-1 text-sm text-muted-foreground">통합 관리 시스템</p>
      </div>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        계정이 없으신가요? 관리자(블루오션 자산관리)에게 문의하세요.
      </p>
    </div>
  )
}
