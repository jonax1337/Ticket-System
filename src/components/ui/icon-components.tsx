'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  ICON_OPTIONS, 
  COLOR_OPTIONS, 
  ICON_CATEGORIES,
  IconOption, 
  ColorOption, 
  IconCategory,
  getIconByValue,
  getColorByValue,
  getIconsByCategory,
  renderIcon,
  getColorClasses
} from '@/lib/icon-map'

interface IconSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  showCategory?: boolean
}

export function IconSelect({ value, onValueChange, placeholder = "Select icon...", className, showCategory = true }: IconSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<IconCategory | 'all'>('all')
  
  const selectedIcon = getIconByValue(value)
  
  const filteredIcons = selectedCategory === 'all' 
    ? ICON_OPTIONS 
    : getIconsByCategory(selectedCategory)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                {renderIcon(selectedIcon.value, "h-4 w-4")}
                <span>{selectedIcon.label}</span>
              </>
            ) : (
              placeholder
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search icons..." />
          {showCategory && (
            <div className="p-2 border-b">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as IconCategory | 'all')}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ICON_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' & ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <CommandList className="max-h-60">
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              {filteredIcons.map((icon) => (
                <CommandItem
                  key={icon.value}
                  value={`${icon.value} ${icon.label} ${icon.description || ''}`}
                  onSelect={() => {
                    onValueChange(icon.value)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  {renderIcon(icon.value, "h-4 w-4")}
                  <div className="flex flex-col flex-1">
                    <span>{icon.label}</span>
                    {icon.description && (
                      <span className="text-xs text-muted-foreground">{icon.description}</span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === icon.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ColorSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  showHex?: boolean
}

export function ColorSelect({ value, onValueChange, placeholder = "Select color...", className, showHex = false }: ColorSelectProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedColor = getColorByValue(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {selectedColor ? (
              <>
                <div className={cn("h-4 w-4 rounded border", selectedColor.preview)} />
                <span>{selectedColor.label}</span>
                {showHex && selectedColor.hex && (
                  <span className="text-xs text-muted-foreground">{selectedColor.hex}</span>
                )}
              </>
            ) : (
              <>
                <Palette className="h-4 w-4" />
                {placeholder}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search colors..." />
          <CommandList className="max-h-60">
            <CommandEmpty>No color found.</CommandEmpty>
            <CommandGroup>
              {COLOR_OPTIONS.map((color) => (
                <CommandItem
                  key={color.value}
                  value={`${color.value} ${color.label}`}
                  onSelect={() => {
                    onValueChange(color.value)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <div className={cn("h-4 w-4 rounded border", color.preview)} />
                  <div className="flex flex-col flex-1">
                    <span>{color.label}</span>
                    {showHex && color.hex && (
                      <span className="text-xs text-muted-foreground">{color.hex}</span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === color.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface IconBadgeProps {
  icon: string
  color: string
  children: React.ReactNode
  className?: string
}

export function IconBadge({ icon, color, children, className }: IconBadgeProps) {
  const colorClasses = getColorClasses(color)
  
  return (
    <Badge className={cn(colorClasses, "flex items-center gap-1.5", className)}>
      {renderIcon(icon, "h-3 w-3")}
      {children}
    </Badge>
  )
}

interface IconWithColorProps {
  icon: string
  color: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function IconWithColor({ icon, color, className, size = 'md' }: IconWithColorProps) {
  const colorOption = getColorByValue(color)
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {renderIcon(icon, cn(sizeClasses[size], colorOption?.preview.replace('bg-', 'text-')))}
    </div>
  )
}

interface IconPreviewProps {
  icon: string
  color: string
  label: string
  className?: string
}

export function IconPreview({ icon, color, label, className }: IconPreviewProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <IconBadge icon={icon} color={color}>
        {label}
      </IconBadge>
    </div>
  )
}