// hooks/useSessionExpiry.ts
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10 minutes

export function useSessionExpiry() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== 'authenticated') return

    const lastActive = (session as any)?.lastActive
    if (!lastActive) return

    const checkExpiry = () => {
      const now = Math.floor(Date.now() / 1000)
      if (now - lastActive > INACTIVITY_LIMIT_MS / 1000) {
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
  }, [session, status, router])
}
