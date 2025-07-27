import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
}

// Generate initials from name or email
const getInitials = (user: UserAvatarProps['user']) => {
  if (user.name && user.name.trim()) {
    const nameParts = user.name.trim().split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    }
    return nameParts[0].charAt(0).toUpperCase()
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  
  return 'U'
}

export function UserAvatar({ user, size = 'lg', className }: UserAvatarProps) {
  const initials = getInitials(user)
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={user.avatarUrl || undefined} alt={user.name || user.email || 'User'} />
      <AvatarFallback className="font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}