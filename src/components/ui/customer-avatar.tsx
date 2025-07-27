import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface CustomerAvatarProps {
  name?: string | null
  email: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
}

// Generate initials from name or email for customers
const getCustomerInitials = (name?: string | null, email?: string) => {
  if (name && name.trim()) {
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    }
    return nameParts[0].charAt(0).toUpperCase()
  }
  
  if (email) {
    const emailPart = email.split('@')[0]
    // If email part has periods or underscores, try to get initials from parts
    if (emailPart.includes('.') || emailPart.includes('_')) {
      const parts = emailPart.split(/[._]/)
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
      }
    }
    return emailPart.charAt(0).toUpperCase()
  }
  
  return 'C'
}

export function CustomerAvatar({ name, email, size = 'lg', className }: CustomerAvatarProps) {
  const initials = getCustomerInitials(name, email)
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}