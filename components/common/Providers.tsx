'use client'

// 전역 클라이언트 프로바이더. React Query 등 클라이언트 전용 컨텍스트를 한 곳에서 묶는다.

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
