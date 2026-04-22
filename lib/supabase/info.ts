// Supabase 환경변수를 런타임 시점에 검증/반환.
// 모듈 로드 시점에 throw 하면 빌드 단계에서 실패할 수 있으므로 호출 시점 lazy 검증.

const requireEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`환경변수 ${key} 가 설정되지 않았습니다. .env.local 을 확인하세요.`)
  }
  return value
}

export const getSupabaseUrl = () => requireEnv('NEXT_PUBLIC_SUPABASE_URL')
export const getSupabaseAnonKey = () => requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
