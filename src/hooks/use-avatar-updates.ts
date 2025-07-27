import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hook to periodically check for avatar updates and refresh the session
 * This ensures that avatar changes are reflected across the app without requiring a full page reload
 */
export function useAvatarUpdates() {
  const { data: session, update } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Check for avatar updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const userData = await response.json()
          
          // If avatar has changed, update the session
          if (userData.avatarUrl !== session.user.avatarUrl) {
            await update({ avatarUrl: userData.avatarUrl })
          }
        }
      } catch (error) {
        console.error('Error checking for avatar updates:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id, session?.user?.avatarUrl, update])
}

interface UserSessionData {
  avatarUrl?: string | null
  name?: string
  email?: string
}

/**
 * Manual trigger to update session with latest user data
 * Note: This should be called from a component that has access to the session update function
 */
export async function refreshUserSession(updateFunction: (data: UserSessionData) => Promise<unknown>) {
  try {
    const response = await fetch('/api/users/me')
    if (response.ok) {
      const userData = await response.json()
      
      await updateFunction({ 
        avatarUrl: userData.avatarUrl,
        name: userData.name,
        email: userData.email
      })
      
      return userData
    }
  } catch (error) {
    console.error('Error refreshing user session:', error)
    return null
  }
}