'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  getIconComponent, 
  ICON_CATEGORIES, 
  ICON_MAP,
  getAllCategories, 
  searchIcons,
  type IconCategoryName 
} from '@/lib/icon-system'
import { Search, ChevronDown, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface IconPickerProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showCategories?: boolean
  allowSearch?: boolean
  triggerClassName?: string
}

export function IconPicker({
  value,
  onValueChange,
  placeholder = 'Select an icon',
  className,
  disabled = false,
  showCategories = true,
  allowSearch = true,
  triggerClassName
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IconCategoryName | 'all'>('all')

  const categories = getAllCategories()

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons: string[] = []

    if (searchQuery.trim()) {
      // If searching, ignore category filter
      icons = searchIcons(searchQuery)
    } else if (selectedCategory === 'all') {
      // Show all icons
      icons = Object.keys(ICON_MAP)
    } else {
      // Show icons from selected category
      icons = ICON_CATEGORIES[selectedCategory]?.icons || []
    }

    return icons
  }, [searchQuery, selectedCategory])

  const handleIconSelect = useCallback((iconName: string) => {
    onValueChange?.(iconName)
    setOpen(false)
    setSearchQuery('')
  }, [onValueChange])

  const IconComponent = value ? getIconComponent(value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span>{value || placeholder}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex flex-col">
          {/* Search */}
          {allowSearch && (
            <div className="p-3 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Category Filter */}
          {showCategories && !searchQuery.trim() && (
            <div className="p-3 border-b flex-shrink-0">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as IconCategoryName | 'all')}>
                <SelectTrigger className="h-8">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <SelectValue placeholder="Select category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Icons Grid */}
          <ScrollArea 
            className="h-48"
            onWheel={(e) => {
              // Fix mouse wheel scrolling in dialogs/popovers
              e.stopPropagation()
            }}
          >
            <div className="p-2">
              {filteredIcons.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No icons found
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 pb-2">
                  {filteredIcons.map((iconName) => {
                    const IconComponent = getIconComponent(iconName)
                    const isSelected = value === iconName
                    
                    return (
                      <Button
                        key={iconName}
                        variant={isSelected ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0',
                          isSelected && 'ring-1 ring-ring'
                        )}
                        onClick={() => handleIconSelect(iconName)}
                        title={iconName}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selected Icon Info */}
          {value && (
            <>
              <Separator />
              <div className="p-2">
                <div className="flex items-center gap-2 text-xs">
                  {IconComponent && <IconComponent className="h-3 w-3" />}
                  <span className="font-medium">{value}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simple icon display component
interface IconDisplayProps {
  iconName: string
  className?: string
  fallback?: React.ReactNode
}

export function IconDisplay({ iconName, className, fallback }: IconDisplayProps) {
  const IconComponent = getIconComponent(iconName)
  
  if (!IconComponent && fallback) {
    return <>{fallback}</>
  }
  
  return <IconComponent className={className} />
}

// Icon with badge component for status/priority display
interface IconWithBadgeProps {
  iconName: string
  badgeText?: string
  iconClassName?: string
  badgeClassName?: string
  variant?: 'status' | 'priority' | 'queue' | 'default'
}

export function IconWithBadge({ 
  iconName, 
  badgeText, 
  iconClassName, 
  badgeClassName,
  variant = 'default' 
}: IconWithBadgeProps) {
  const IconComponent = getIconComponent(iconName)
  
  const badgeVariants = {
    status: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    priority: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    queue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    default: ''
  }
  
  return (
    <div className="flex items-center gap-2">
      <IconComponent className={cn('h-4 w-4', iconClassName)} />
      {badgeText && (
        <Badge 
          variant="outline" 
          className={cn(badgeVariants[variant], badgeClassName)}
        >
          {badgeText}
        </Badge>
      )}
    </div>
  )
}
