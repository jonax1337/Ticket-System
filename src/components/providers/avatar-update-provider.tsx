'use client'

import { useAvatarUpdates } from '@/hooks/use-avatar-updates'

export default function AvatarUpdateProvider({ children }: { children: React.ReactNode }) {
  useAvatarUpdates()
  
  return <>{children}</>
}