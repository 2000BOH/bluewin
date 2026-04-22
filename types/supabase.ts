// Supabase 자동 생성 타입의 placeholder.
// Phase 2 이후 `supabase gen types typescript --project-id <id>` 로 덮어쓸 예정.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
