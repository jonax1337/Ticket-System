import React from 'react'
import { 
  // Alert & Status Icons
  AlertCircle, AlertTriangle, AlertOctagon, Info, CheckCircle2, CheckCircle, XCircle, X, Check,
  // Arrow & Direction Icons
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ChevronRight, ChevronDown,
  // Time & Priority Icons
  Clock, Timer, Zap, TrendingUp, TrendingDown, Flame, Star, Bookmark, Flag,
  // Communication & Collaboration Icons
  Users, User, UserPlus, UserMinus, UserCheck, MessageSquare, MessageCircle, Mail, Phone,
  // Organization & Management Icons
  Inbox, Folder, FolderOpen, Archive, Trash2, Settings, Cog, Shield, Lock, Unlock,
  // Tools & Actions Icons
  Edit, Plus, Minus, Search, Filter, RefreshCw, Download, Upload, Copy, Share,
  // Visual & Display Icons
  Circle, Square, Triangle, Diamond, Hexagon, Heart, Eye, EyeOff, Image, Palette,
  // Business & Process Icons
  Briefcase, Target, Activity, BarChart, PieChart, Calendar, FileText, Clipboard, Tag,
  // Technology Icons
  Server, Database, Code, Terminal, Cpu, HardDrive, Wifi, Globe, Smartphone,
  // Weather & Nature Icons
  Sun, Moon, Cloud, Zap as Lightning, Leaf, Mountain,
  LucideIcon
} from 'lucide-react'

export interface IconOption {
  value: string
  label: string
  component: LucideIcon
  category: string
  description?: string
}

export interface ColorOption {
  value: string
  label: string
  hex?: string
  tailwindClasses?: string
  preview: string
}

export const ICON_CATEGORIES = [
  'alerts-status',
  'arrows-directions', 
  'time-priority',
  'communication',
  'organization',
  'tools-actions',
  'visual-display',
  'business-process',
  'technology',
  'nature-weather'
] as const

export type IconCategory = typeof ICON_CATEGORIES[number]

export const ICON_OPTIONS: IconOption[] = [
  // Alert & Status Icons
  { value: 'AlertCircle', label: 'Alert Circle', component: AlertCircle, category: 'alerts-status', description: 'General alert or warning' },
  { value: 'AlertTriangle', label: 'Alert Triangle', component: AlertTriangle, category: 'alerts-status', description: 'Warning or caution' },
  { value: 'AlertOctagon', label: 'Alert Octagon', component: AlertOctagon, category: 'alerts-status', description: 'Stop or critical alert' },
  { value: 'Info', label: 'Info', component: Info, category: 'alerts-status', description: 'Information or help' },
  { value: 'CheckCircle2', label: 'Check Circle', component: CheckCircle2, category: 'alerts-status', description: 'Completed or approved' },
  { value: 'CheckCircle', label: 'Check Circle Alt', component: CheckCircle, category: 'alerts-status', description: 'Success or done' },
  { value: 'XCircle', label: 'X Circle', component: XCircle, category: 'alerts-status', description: 'Error or cancelled' },
  { value: 'X', label: 'X', component: X, category: 'alerts-status', description: 'Close or remove' },
  { value: 'Check', label: 'Check', component: Check, category: 'alerts-status', description: 'Approved or selected' },
  
  // Arrow & Direction Icons
  { value: 'ArrowRight', label: 'Arrow Right', component: ArrowRight, category: 'arrows-directions', description: 'Next or forward' },
  { value: 'ArrowLeft', label: 'Arrow Left', component: ArrowLeft, category: 'arrows-directions', description: 'Previous or back' },
  { value: 'ArrowUp', label: 'Arrow Up', component: ArrowUp, category: 'arrows-directions', description: 'Increase or up' },
  { value: 'ArrowDown', label: 'Arrow Down', component: ArrowDown, category: 'arrows-directions', description: 'Decrease or down' },
  { value: 'ArrowUpRight', label: 'Arrow Up Right', component: ArrowUpRight, category: 'arrows-directions', description: 'Growth or expansion' },
  { value: 'ArrowDownRight', label: 'Arrow Down Right', component: ArrowDownRight, category: 'arrows-directions', description: 'Decline or reduction' },
  { value: 'ChevronRight', label: 'Chevron Right', component: ChevronRight, category: 'arrows-directions', description: 'Expand or navigate' },
  { value: 'ChevronDown', label: 'Chevron Down', component: ChevronDown, category: 'arrows-directions', description: 'Dropdown or collapse' },
  
  // Time & Priority Icons
  { value: 'Clock', label: 'Clock', component: Clock, category: 'time-priority', description: 'Time or schedule' },
  { value: 'Timer', label: 'Timer', component: Timer, category: 'time-priority', description: 'Countdown or deadline' },
  { value: 'Zap', label: 'Zap', component: Zap, category: 'time-priority', description: 'High priority or urgent' },
  { value: 'TrendingUp', label: 'Trending Up', component: TrendingUp, category: 'time-priority', description: 'Increasing priority' },
  { value: 'TrendingDown', label: 'Trending Down', component: TrendingDown, category: 'time-priority', description: 'Decreasing priority' },
  { value: 'Flame', label: 'Flame', component: Flame, category: 'time-priority', description: 'Critical or hot' },
  { value: 'Star', label: 'Star', component: Star, category: 'time-priority', description: 'Important or featured' },
  { value: 'Bookmark', label: 'Bookmark', component: Bookmark, category: 'time-priority', description: 'Saved or marked' },
  { value: 'Flag', label: 'Flag', component: Flag, category: 'time-priority', description: 'Flagged or milestone' },
  
  // Communication & Collaboration Icons
  { value: 'Users', label: 'Users', component: Users, category: 'communication', description: 'Team or group' },
  { value: 'User', label: 'User', component: User, category: 'communication', description: 'Person or individual' },
  { value: 'UserPlus', label: 'User Plus', component: UserPlus, category: 'communication', description: 'Add user or invite' },
  { value: 'UserMinus', label: 'User Minus', component: UserMinus, category: 'communication', description: 'Remove user' },
  { value: 'UserCheck', label: 'User Check', component: UserCheck, category: 'communication', description: 'Verified user' },
  { value: 'MessageSquare', label: 'Message Square', component: MessageSquare, category: 'communication', description: 'Chat or comment' },
  { value: 'MessageCircle', label: 'Message Circle', component: MessageCircle, category: 'communication', description: 'Message or bubble' },
  { value: 'Mail', label: 'Mail', component: Mail, category: 'communication', description: 'Email or message' },
  { value: 'Phone', label: 'Phone', component: Phone, category: 'communication', description: 'Call or contact' },
  
  // Organization & Management Icons
  { value: 'Inbox', label: 'Inbox', component: Inbox, category: 'organization', description: 'Inbox or queue' },
  { value: 'Folder', label: 'Folder', component: Folder, category: 'organization', description: 'Folder or category' },
  { value: 'FolderOpen', label: 'Folder Open', component: FolderOpen, category: 'organization', description: 'Open folder' },
  { value: 'Archive', label: 'Archive', component: Archive, category: 'organization', description: 'Archive or store' },
  { value: 'Trash2', label: 'Trash', component: Trash2, category: 'organization', description: 'Delete or remove' },
  { value: 'Settings', label: 'Settings', component: Settings, category: 'organization', description: 'Settings or config' },
  { value: 'Cog', label: 'Cog', component: Cog, category: 'organization', description: 'Gear or mechanism' },
  { value: 'Shield', label: 'Shield', component: Shield, category: 'organization', description: 'Security or protection' },
  { value: 'Lock', label: 'Lock', component: Lock, category: 'organization', description: 'Locked or secure' },
  { value: 'Unlock', label: 'Unlock', component: Unlock, category: 'organization', description: 'Unlocked or open' },
  
  // Tools & Actions Icons
  { value: 'Edit', label: 'Edit', component: Edit, category: 'tools-actions', description: 'Edit or modify' },
  { value: 'Plus', label: 'Plus', component: Plus, category: 'tools-actions', description: 'Add or create' },
  { value: 'Minus', label: 'Minus', component: Minus, category: 'tools-actions', description: 'Remove or subtract' },
  { value: 'Search', label: 'Search', component: Search, category: 'tools-actions', description: 'Search or find' },
  { value: 'Filter', label: 'Filter', component: Filter, category: 'tools-actions', description: 'Filter or sort' },
  { value: 'RefreshCw', label: 'Refresh', component: RefreshCw, category: 'tools-actions', description: 'Refresh or reload' },
  { value: 'Download', label: 'Download', component: Download, category: 'tools-actions', description: 'Download or save' },
  { value: 'Upload', label: 'Upload', component: Upload, category: 'tools-actions', description: 'Upload or attach' },
  { value: 'Copy', label: 'Copy', component: Copy, category: 'tools-actions', description: 'Copy or duplicate' },
  { value: 'Share', label: 'Share', component: Share, category: 'tools-actions', description: 'Share or distribute' },
  
  // Visual & Display Icons
  { value: 'Circle', label: 'Circle', component: Circle, category: 'visual-display', description: 'Circle or dot' },
  { value: 'Square', label: 'Square', component: Square, category: 'visual-display', description: 'Square or box' },
  { value: 'Triangle', label: 'Triangle', component: Triangle, category: 'visual-display', description: 'Triangle or delta' },
  { value: 'Diamond', label: 'Diamond', component: Diamond, category: 'visual-display', description: 'Diamond or gem' },
  { value: 'Hexagon', label: 'Hexagon', component: Hexagon, category: 'visual-display', description: 'Hexagon or cell' },
  { value: 'Heart', label: 'Heart', component: Heart, category: 'visual-display', description: 'Heart or favorite' },
  { value: 'Eye', label: 'Eye', component: Eye, category: 'visual-display', description: 'View or visible' },
  { value: 'EyeOff', label: 'Eye Off', component: EyeOff, category: 'visual-display', description: 'Hidden or private' },
  { value: 'Image', label: 'Image', component: Image, category: 'visual-display', description: 'Image or picture' },
  { value: 'Palette', label: 'Palette', component: Palette, category: 'visual-display', description: 'Color or design' },
  
  // Business & Process Icons
  { value: 'Briefcase', label: 'Briefcase', component: Briefcase, category: 'business-process', description: 'Business or work' },
  { value: 'Target', label: 'Target', component: Target, category: 'business-process', description: 'Goal or objective' },
  { value: 'Activity', label: 'Activity', component: Activity, category: 'business-process', description: 'Activity or pulse' },
  { value: 'BarChart', label: 'Bar Chart', component: BarChart, category: 'business-process', description: 'Analytics or data' },
  { value: 'PieChart', label: 'Pie Chart', component: PieChart, category: 'business-process', description: 'Statistics or breakdown' },
  { value: 'Calendar', label: 'Calendar', component: Calendar, category: 'business-process', description: 'Calendar or schedule' },
  { value: 'FileText', label: 'File Text', component: FileText, category: 'business-process', description: 'Document or file' },
  { value: 'Clipboard', label: 'Clipboard', component: Clipboard, category: 'business-process', description: 'Clipboard or list' },
  { value: 'Tag', label: 'Tag', component: Tag, category: 'business-process', description: 'Tag or label' },
  
  // Technology Icons
  { value: 'Server', label: 'Server', component: Server, category: 'technology', description: 'Server or infrastructure' },
  { value: 'Database', label: 'Database', component: Database, category: 'technology', description: 'Database or storage' },
  { value: 'Code', label: 'Code', component: Code, category: 'technology', description: 'Code or development' },
  { value: 'Terminal', label: 'Terminal', component: Terminal, category: 'technology', description: 'Terminal or command' },
  { value: 'Cpu', label: 'CPU', component: Cpu, category: 'technology', description: 'CPU or processor' },
  { value: 'HardDrive', label: 'Hard Drive', component: HardDrive, category: 'technology', description: 'Storage or drive' },
  { value: 'Wifi', label: 'WiFi', component: Wifi, category: 'technology', description: 'Network or connection' },
  { value: 'Globe', label: 'Globe', component: Globe, category: 'technology', description: 'Global or internet' },
  { value: 'Smartphone', label: 'Smartphone', component: Smartphone, category: 'technology', description: 'Mobile or device' },
  
  // Nature & Weather Icons
  { value: 'Sun', label: 'Sun', component: Sun, category: 'nature-weather', description: 'Bright or positive' },
  { value: 'Moon', label: 'Moon', component: Moon, category: 'nature-weather', description: 'Night or calm' },
  { value: 'Cloud', label: 'Cloud', component: Cloud, category: 'nature-weather', description: 'Cloud or storage' },
  { value: 'Lightning', label: 'Lightning', component: Lightning, category: 'nature-weather', description: 'Fast or electric' },
  { value: 'Leaf', label: 'Leaf', component: Leaf, category: 'nature-weather', description: 'Nature or eco' },
  { value: 'Mountain', label: 'Mountain', component: Mountain, category: 'nature-weather', description: 'Challenge or peak' },
]

export const COLOR_OPTIONS: ColorOption[] = [
  // Primary Colors
  { 
    value: 'blue', 
    label: 'Blue', 
    hex: '#3b82f6',
    tailwindClasses: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    preview: 'bg-blue-500'
  },
  { 
    value: 'red', 
    label: 'Red', 
    hex: '#ef4444',
    tailwindClasses: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    preview: 'bg-red-500'
  },
  { 
    value: 'green', 
    label: 'Green', 
    hex: '#22c55e',
    tailwindClasses: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    preview: 'bg-green-500'
  },
  { 
    value: 'yellow', 
    label: 'Yellow', 
    hex: '#eab308',
    tailwindClasses: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    preview: 'bg-yellow-500'
  },
  { 
    value: 'orange', 
    label: 'Orange', 
    hex: '#f97316',
    tailwindClasses: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    preview: 'bg-orange-500'
  },
  { 
    value: 'purple', 
    label: 'Purple', 
    hex: '#a855f7',
    tailwindClasses: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    preview: 'bg-purple-500'
  },
  
  // Extended Colors
  { 
    value: 'indigo', 
    label: 'Indigo', 
    hex: '#6366f1',
    tailwindClasses: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    preview: 'bg-indigo-500'
  },
  { 
    value: 'pink', 
    label: 'Pink', 
    hex: '#ec4899',
    tailwindClasses: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
    preview: 'bg-pink-500'
  },
  { 
    value: 'teal', 
    label: 'Teal', 
    hex: '#14b8a6',
    tailwindClasses: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
    preview: 'bg-teal-500'
  },
  { 
    value: 'cyan', 
    label: 'Cyan', 
    hex: '#06b6d4',
    tailwindClasses: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
    preview: 'bg-cyan-500'
  },
  { 
    value: 'emerald', 
    label: 'Emerald', 
    hex: '#10b981',
    tailwindClasses: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    preview: 'bg-emerald-500'
  },
  { 
    value: 'lime', 
    label: 'Lime', 
    hex: '#84cc16',
    tailwindClasses: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800',
    preview: 'bg-lime-500'
  },
  { 
    value: 'amber', 
    label: 'Amber', 
    hex: '#f59e0b',
    tailwindClasses: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    preview: 'bg-amber-500'
  },
  { 
    value: 'rose', 
    label: 'Rose', 
    hex: '#f43f5e',
    tailwindClasses: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    preview: 'bg-rose-500'
  },
  { 
    value: 'violet', 
    label: 'Violet', 
    hex: '#8b5cf6',
    tailwindClasses: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
    preview: 'bg-violet-500'
  },
  { 
    value: 'fuchsia', 
    label: 'Fuchsia', 
    hex: '#d946ef',
    tailwindClasses: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800',
    preview: 'bg-fuchsia-500'
  },
  
  // Neutral Colors
  { 
    value: 'gray', 
    label: 'Gray', 
    hex: '#6b7280',
    tailwindClasses: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
    preview: 'bg-gray-500'
  },
  { 
    value: 'slate', 
    label: 'Slate', 
    hex: '#64748b',
    tailwindClasses: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
    preview: 'bg-slate-500'
  },
  { 
    value: 'zinc', 
    label: 'Zinc', 
    hex: '#71717a',
    tailwindClasses: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800',
    preview: 'bg-zinc-500'
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    hex: '#737373',
    tailwindClasses: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-400 dark:border-neutral-800',
    preview: 'bg-neutral-500'
  },
  { 
    value: 'stone', 
    label: 'Stone', 
    hex: '#78716c',
    tailwindClasses: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-800',
    preview: 'bg-stone-500'
  },
]

// Utility functions
export function getIconByValue(value: string): IconOption | undefined {
  return ICON_OPTIONS.find(icon => icon.value === value)
}

export function getColorByValue(value: string): ColorOption | undefined {
  return COLOR_OPTIONS.find(color => color.value === value)
}

export function getIconsByCategory(category: IconCategory): IconOption[] {
  return ICON_OPTIONS.filter(icon => icon.category === category)
}

export function renderIcon(iconValue: string, className?: string): React.ReactElement | null {
  const iconOption = getIconByValue(iconValue)
  if (!iconOption) return null
  
  const IconComponent = iconOption.component
  return React.createElement(IconComponent, { className })
}

export function getColorClasses(colorValue: string): string {
  const colorOption = getColorByValue(colorValue)
  return colorOption?.tailwindClasses || COLOR_OPTIONS[0].tailwindClasses
}

export function getColorHex(colorValue: string): string {
  const colorOption = getColorByValue(colorValue)
  return colorOption?.hex || COLOR_OPTIONS[0].hex!
}

// Legacy support - maps old color class strings to new color values
export function mapLegacyColorToValue(legacyColorClasses: string): string {
  const colorMap: Record<string, string> = {
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800': 'gray',
    'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800': 'yellow',
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800': 'orange',
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800': 'red',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800': 'blue',
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800': 'green',
  }
  
  return colorMap[legacyColorClasses] || 'gray'
}

// Legacy support - maps hex colors to new color values
export function mapLegacyHexToValue(hex: string): string {
  const hexMap: Record<string, string> = {
    '#2563eb': 'blue',
    '#dc2626': 'red', 
    '#16a34a': 'green',
    '#ca8a04': 'yellow',
    '#9333ea': 'purple',
    '#ea580c': 'orange',
    '#0891b2': 'cyan',
    '#be123c': 'rose',
  }
  
  return hexMap[hex] || 'blue'
}