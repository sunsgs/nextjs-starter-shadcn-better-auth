'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
    // useState so each browser session gets its own QueryClient,
    // not a shared singleton (important for SSR / concurrent requests)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Don't refetch on window focus in an admin panel —
                        // it's distracting and these aren't real-time feeds
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}