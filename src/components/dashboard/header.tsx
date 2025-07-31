'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/animate-ui/radix/switch'
import { LogOut, User, Moon, Sun, UserCog, BookOpen } from 'lucide-react'
import { UsersRound } from '@/components/animate-ui/icons/users-round'
import { LayoutDashboard } from '@/components/animate-ui/icons/layout-dashboard'
import { Settings } from '@/components/animate-ui/icons/settings'
import { Layers } from '@/components/animate-ui/icons/layers'
import { AnimateIcon } from '@/components/animate-ui/icons/icon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NotificationPopover from './notification-popover'
import { Users } from '../animate-ui/icons/users'

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  
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
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-8 lg:h-10 w-auto object-contain flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="min-w-0">
                {!hideAppName && (
                  <h1 className="text-lg lg:text-2xl font-bold truncate">{appName}</h1>
                )}
                {slogan && !hideAppName && (
                  <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block sm:truncate">
                    {slogan}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation - left aligned after logo */}
            <nav className="hidden md:flex gap-2 lg:gap-4">
              <AnimateIcon animateOnHover>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === '/dashboard'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
              </AnimateIcon>

              <AnimateIcon animateOnHover>
              <Link
                href="/dashboard/my-tickets"
                className={cn(
                  "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === '/dashboard/my-tickets'
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                  <Layers className="h-4 w-4" />
                <span className="hidden lg:inline">My Tickets</span>
              </Link>
              </AnimateIcon>

              <AnimateIcon animateOnHover>
              <Link
                href="/dashboard/wiki"
                className={cn(
                  "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname.startsWith('/dashboard/wiki')
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden lg:inline">Wiki</span>
              </Link>
              </AnimateIcon>

              {user.role === 'ADMIN' && (
                <>
                  <AnimateIcon animateOnHover>
                  <Link
                    href="/dashboard/users"
                    className={cn(
                      "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === '/dashboard/users'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden lg:inline">Users</span>
                  </Link>
                  </AnimateIcon>

                  <AnimateIcon animateOnHover>
                  <Link
                    href="/dashboard/admin"
                    className={cn(
                      "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === '/dashboard/admin'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                      <Settings className="h-4 w-4" />
                      <span className="hidden lg:inline">Admin</span>
                  </Link>
                  </AnimateIcon>
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


                
                {/* Mobile Navigation */}
                <div className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-2"
                      onMouseEnter={() => setHoveredItem('dashboard-mobile')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div onMouseEnter={() => setHoveredItem('dashboard-mobile')}>
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard/my-tickets" 
                      className="flex items-center gap-2"
                      onMouseEnter={() => setHoveredItem('tickets-mobile')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div onMouseEnter={() => setHoveredItem('tickets-mobile')}>
                        <Layers className="h-4 w-4" />
                      </div>
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard/wiki" 
                      className="flex items-center gap-2"
                      onMouseEnter={() => setHoveredItem('wiki-mobile')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div onMouseEnter={() => setHoveredItem('wiki-mobile')}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      Wiki
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/dashboard/users" 
                          className="flex items-center gap-2"
                          onMouseEnter={() => setHoveredItem('users-mobile')}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div onMouseEnter={() => setHoveredItem('users-mobile')}>
                            <UsersRound className="h-4 w-4" />
                          </div>
                          Users
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/dashboard/admin" 
                          className="flex items-center gap-2"
                          onMouseEnter={() => setHoveredItem('admin-mobile')}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div onMouseEnter={() => setHoveredItem('admin-mobile')}>
                            <Settings className="h-4 w-4" />
                          </div>
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
                    className="h-5 w-8 p-[2px]"
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                  <LogOut className="h-4 w-4" />
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