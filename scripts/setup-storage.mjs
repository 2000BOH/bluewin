// Supabase Storage 버킷 초기 설정 스크립트.
// 실행: node scripts/setup-storage.mjs
// 조건: .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정 필요.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 수동 파싱
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ .env.local 에 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const BUCKETS = [
  {
    name: 'room-check-photos',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  },
]

for (const bucket of BUCKETS) {
  // 이미 존재하는지 확인
  const { data: existing } = await supabase.storage.getBucket(bucket.name)

  if (existing) {
    console.log(`✅ 버킷 이미 존재: ${bucket.name}`)
    continue
  }

  const { error } = await supabase.storage.createBucket(bucket.name, {
    public: bucket.public,
    fileSizeLimit: bucket.fileSizeLimit,
    allowedMimeTypes: bucket.allowedMimeTypes,
  })

  if (error) {
    console.error(`❌ 버킷 생성 실패 [${bucket.name}]: ${error.message}`)
  } else {
    console.log(`🪣  버킷 생성 완료: ${bucket.name} (public=${bucket.public})`)
  }
}

console.log('\n✔ 스토리지 설정 완료.')
