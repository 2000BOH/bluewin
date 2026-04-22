// shadcn 기본 유틸 (cn). Phase 3 부터 동일 디렉토리에 history.ts / format.ts / mask.ts / status.ts 추가 예정.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
