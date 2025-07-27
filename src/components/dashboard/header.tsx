'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { AvatarUploadDialog } from '@/components/dashboard/avatar-upload-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { LogOut, User, Users, LayoutDashboard, Moon, Sun, Settings, Briefcase, Bell, UserCog } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NotificationPopover from './notification-popover'

interface DashboardHeaderProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    role?: string
    image?: string | null
    avatarUrl?: string | null
  }
  appName?: string
  slogan?: string | null
  logoUrl?: string | null
  hideAppName?: boolean
}

export default function DashboardHeader({ user, appName = 'Support Dashboard', slogan, logoUrl, hideAppName }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`
      sticky top-0 z-50 border-b transition-all duration-300
      ${isScrolled 
        ? 'bg-background/80 backdrop-blur-md border-border/50 shadow-sm' 
        : 'bg-card border-border'
      }
    `}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between py-4">
          {/* Left: Logo/Brand + Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div>
                {!hideAppName && (
                  <h1 className="text-2xl font-bold">{appName}</h1>
                )}
                {slogan && !hideAppName && (
                  <p className="text-sm text-muted-foreground">
                    {slogan}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation - left aligned after logo */}
            <nav className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === '/dashboard'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/my-tickets"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === '/dashboard/my-tickets'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Briefcase className="h-4 w-4" />
                My Tickets
              </Link>
              {user.role === 'ADMIN' && (
                <>
                  <Link
                    href="/dashboard/users"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === '/dashboard/users'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === '/dashboard/admin'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Notifications + User Menu */}
          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <NotificationPopover />

            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <UserAvatar 
                  user={{
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl || user.image
                  }}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user.name || 'User'}</span>
                </DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {user.role}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>

                {/* Avatar Upload */}
                {user.id && (
                  <>
                    <div className="px-2 py-1">
                      <AvatarUploadDialog
                        user={{
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          avatarUrl: user.avatarUrl || user.image
                        }}
                        trigger={
                          <Button variant="ghost" className="w-full justify-start text-sm font-normal">
                            <User className="mr-2 h-4 w-4" />
                            Change Avatar
                          </Button>
                        }
                      />
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                
                {/* Mobile Navigation */}
                <div className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/my-tickets" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/users" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/admin" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                </div>
                
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    {theme === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span>Dark Mode</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}