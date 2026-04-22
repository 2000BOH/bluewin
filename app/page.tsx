import { redirect } from 'next/navigation'

// 루트 진입 시 대시보드로 이동. 미인증 처리는 Phase 2 의 미들웨어에서 수행.
export default function Home() {
  redirect('/dashboard')
}
