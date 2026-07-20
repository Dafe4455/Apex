// hooks/useSessionExpiry.ts
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { INACTIVITY_LIMIT_SECONDS } from '@/lib/session-config'

const INACTIVITY_LIMIT_MS = INACTIVITY_LIMIT_SECONDS * 1000

export function useSessionExpiry() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

    const lastActive = (session as any)?.lastActive
    if (!lastActive) return

    const checkExpiry = () => {
      const now = Math.floor(Date.now() / 1000)
      if (now - lastActive > INACTIVITY_LIMIT_SECONDS) {
        // Session expired — force reload to hit middleware
        window.location.href = '/login?expired=true'
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkExpiry, 30000)
    
    // Check on visibility change (tab becomes active)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkExpiry()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [session, status])
}
