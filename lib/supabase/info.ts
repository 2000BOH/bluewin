// Supabase 환경변수를 런타임 시점에 검증/반환.
// process.env[key] 브라켓 표기는 Next.js Edge Runtime에서 인식 실패하므로
// 각 변수를 직접 프로퍼티 접근(dot notation)으로 읽는다.

export const getSupabaseUrl = (): string => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) {
    throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다. .env.local 을 확인하세요.')
  }
  return value
}

export const getSupabaseAnonKey = (): string => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!value) {
    throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요.')
  }
  return value
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
