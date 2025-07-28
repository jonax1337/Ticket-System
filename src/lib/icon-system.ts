'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Timer,
  AlertTriangle,
  Zap,
  TrendingUp,
  Inbox,
  Folder,
  Circle,
  Users,
  Settings,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Square,
  Archive,
  FileText,
  Mail,
  Phone,
  Globe,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Tag,
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  Minus,
  Upload,
  Download,
  Save,
  Copy,
  Undo,
  Redo,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Calendar,
  CalendarDays,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Home,
  Building,
  MapPin,
  Navigation,
  Compass,
  Layers,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Volume,
  VolumeOff,
  Volume1,
  Volume2,
  VolumeX,
  Image,
  Video,
  Camera,
  Mic,
  Headphones,
  Speaker,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Keyboard,
  Mouse,
  Gamepad2,
  Wrench,
  Hammer,
  Package,
  Box,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Euro,
  BarChart,
  BarChart2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingDown,
  Activity,
  Target,
  Award,
  Medal,
  Trophy,
  Gift,
  PartyPopper,
  Coffee,
  Apple,
  Utensils,
  Car,
  Truck,
  Bus,
  Train,
  Plane,
  Ship,
  Bike,
  Footprints,
  CloudRain,
  CloudSnow,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Umbrella,
  TreePine,
  Flower2,
  Leaf,
  Mountain,
  Waves,
  Flame,
  Snowflake,
  Rainbow,
  Lightbulb,
  Palette,
  Paintbrush,
  Pen,
  PenTool,
  Pencil,
  Eraser,
  Ruler,
  Scissors,
  Paperclip,
  Pin,
  Link,
  Unlink,
  ExternalLink,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  CornerUpRight,
  CornerUpLeft,
  CornerDownRight,
  CornerDownLeft,
  Move,
  MoveHorizontal,
  MoveVertical,
  FlipHorizontal,
  FlipVertical,
  Expand,
  Shrink,
  ZoomIn,
  ZoomOut,
  Focus,
  Crosshair,
  Scan,
  QrCode,
  Hash,
  AtSign,
  Percent,
  Quote,
  MessageSquare,
  MessageCircle,
  Send,
  Reply,
  Forward,
  Share,
  Share2,
  Rss,
  Radio,
  Podcast,
  Headset,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users2,
  UserCog,
  Crown,
  Briefcase,
  GraduationCap,
  School,
  Book,
  BookOpen,
  Library,
  Newspaper,
  FilePlus,
  FileMinus,
  FileEdit,
  FileX,
  FileCheck,
  FileClock,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderEdit,
  FolderX,
  FolderCheck,
  FolderClock,
  HardDrive,
  Usb,
  Disc,
  Film,
  Clapperboard,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Repeat1,
  Shuffle,
  List,
  ListChecks,
  ListTodo,
  Indent,
  Outdent,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  Terminal,
  Command,
  Delete,
  Power,
  PowerOff,
  LogIn,
  LogOut,
  IdCard,
  Fingerprint,
  Dna,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  Key,
  KeyRound,
  LockKeyhole,
  Verified,
  Radar,
  Satellite,
  Router,
  Bluetooth,
  Cpu,
  Battery,
  BatteryLow,
  Plug,
  PlugZap
} from 'lucide-react'

import type { IconName } from 'lucide-react/dynamic'

// Icon category definitions
export const ICON_CATEGORIES = {
  // Status Icons
  status: {
    name: 'Status',
    description: 'Icons for various states and statuses',
    icons: [
      'AlertCircle',
      'CheckCircle2',
      'CheckCircle',
      'XCircle',
      'Clock',
      'Timer',
      'AlertTriangle',
      'Circle',
      'Square',
      'Pause',
      'Play',
      'Archive'
    ] as string[]
  },
  
  // Priority Icons
  priority: {
    name: 'Priority',
    description: 'Icons for priority levels',
    icons: [
      'Zap',
      'TrendingUp',
      'TrendingDown',
      'AlertTriangle',
      'AlertCircle',
      'Timer',
      'Clock',
      'Star',
      'Flag',
      'Target'
    ] as string[]
  },
  
  // Queue & Organization Icons
  organization: {
    name: 'Organization',
    description: 'Icons for queues, folders, and organization',
    icons: [
      'Inbox',
      'Folder',
      'FolderOpen',
      'FolderPlus',
      'Archive',
      'Package',
      'Box',
      'Layers',
      'Tag',
      'Bookmark'
    ] as string[]
  },
  
  // User & People Icons
  people: {
    name: 'People',
    description: 'Icons for users, teams, and roles',
    icons: [
      'User',
      'Users',
      'Users2',
      'UserCheck',
      'UserPlus',
      'UserMinus',
      'UserX',
      'UserCog',
      'Shield',
      'Crown'
    ] as string[]
  },
  
  // Action Icons
  actions: {
    name: 'Actions',
    description: 'Icons for actions and operations',
    icons: [
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'Edit',
      'Trash2',
      'Plus',
      'Minus',
      'Save',
      'Copy',
      'Upload',
      'Download',
      'RefreshCw',
      'Search',
      'Filter',
      'Settings'
    ] as string[]
  },
  
  // Communication Icons
  communication: {
    name: 'Communication',
    description: 'Icons for communication and notifications',
    icons: [
      'Mail',
      'MessageSquare',
      'MessageCircle',
      'Phone',
      'Bell',
      'BellOff',
      'Send',
      'Reply',
      'Forward',
      'Share'
    ] as string[]
  },
  
  // System Icons
  system: {
    name: 'System',
    description: 'Icons for system functions and states',
    icons: [
      'Settings',
      'Wrench',
      'Database',
      'Server',
      'Cloud',
      'Monitor',
      'Smartphone',
      'Laptop',
      'HardDrive'
    ] as string[]
  },
  
  // Business Icons
  business: {
    name: 'Business',
    description: 'Icons for business and professional use',
    icons: [
      'Briefcase',
      'Building',
      'Home',
      'BarChart',
      'LineChart',
      'PieChart',
      'TrendingUp',
      'Activity',
      'Award',
      'Trophy',
      'Target',
      'DollarSign'
    ] as string[]
  },
  
  // Security Icons
  security: {
    name: 'Security',
    description: 'Icons for security and protection',
    icons: [
      'Lock',
      'Unlock',
      'Key',
      'Shield',
      'ShieldCheck',
      'ShieldAlert',
      'ShieldX',
      'Eye',
      'EyeOff',
      'Fingerprint',
      'Verified'
    ] as string[]
  },
  
  // Media Icons
  media: {
    name: 'Media',
    description: 'Icons for media and content',
    icons: [
      'Image',
      'Video',
      'Camera',
      'Mic',
      'Speaker',
      'Headphones',
      'PlayCircle',
      'PauseCircle',
      'StopCircle',
      'Volume',
      'Film'
    ] as string[]
  }
} as const

// Type for category names
export type IconCategoryName = keyof typeof ICON_CATEGORIES

// Combined mapping of all icons
export const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string }> } = {
  // Status Icons
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  AlertTriangle,
  Circle,
  Square,
  Pause,
  Play,
  Archive,
  
  // Priority Icons
  Zap,
  TrendingUp,
  TrendingDown,
  Star,
  Flag,
  Target,
  
  // Organization Icons
  Inbox,
  Folder,
  FolderOpen,
  FolderPlus,
  Package,
  Box,
  Layers,
  Tag,
  Bookmark,
  
  // People Icons
  User,
  Users,
  Users2,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  UserCog,
  Shield,
  Crown,
  
  // Action Icons
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Minus,
  Save,
  Copy,
  Upload,
  Download,
  RefreshCw,
  Search,
  Filter,
  Settings,
  
  // Communication Icons
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  Bell,
  BellOff,
  Send,
  Reply,
  Forward,
  Share,
  
  // System Icons
  Wrench,
  Database,
  Server,
  Cloud,
  Monitor,
  Smartphone,
  Laptop,
  HardDrive,
  
  // Business Icons
  Briefcase,
  Building,
  Home,
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Award,
  Trophy,
  DollarSign,
  
  // Security Icons
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Eye,
  EyeOff,
  Fingerprint,
  Verified,
  
  // Media Icons
  Image,
  Video,
  Camera,
  Mic,
  Speaker,
  Headphones,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Volume,
  Film,
  
  // Additional commonly used icons
  FileText,
  Globe,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Undo,
  Redo,
  RotateCcw,
  RotateCw,
  Calendar,
  CalendarDays,
  MapPin,
  Navigation,
  Compass,
  Wifi,
  WifiOff,
  Signal,
  Volume1,
  Volume2,
  VolumeX,
  VolumeOff,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Gamepad2,
  Hammer,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Euro,
  BarChart2,
  BarChart3,
  Medal,
  Gift,
  PartyPopper,
  Coffee,
  Apple,
  Utensils,
  Car,
  Truck,
  Bus,
  Train,
  Plane,
  Ship,
  Bike,
  Footprints,
  CloudRain,
  CloudSnow,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Umbrella,
  TreePine,
  Flower2,
  Leaf,
  Mountain,
  Waves,
  Flame,
  Snowflake,
  Rainbow,
  Lightbulb,
  Palette,
  Paintbrush,
  Pen,
  PenTool,
  Pencil,
  Eraser,
  Ruler,
  Scissors,
  Paperclip,
  Pin,
  Link,
  Unlink,
  ExternalLink,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  CornerUpRight,
  CornerUpLeft,
  CornerDownRight,
  CornerDownLeft,
  Move,
  MoveHorizontal,
  MoveVertical,
  FlipHorizontal,
  FlipVertical,
  Expand,
  Shrink,
  ZoomIn,
  ZoomOut,
  Focus,
  Crosshair,
  Scan,
  QrCode,
  Hash,
  AtSign,
  Percent,
  Quote,
  Share2,
  Rss,
  Radio,
  Podcast,
  Headset,
  GraduationCap,
  School,
  Book,
  BookOpen,
  Library,
  Newspaper,
  FilePlus,
  FileMinus,
  FileEdit,
  FileX,
  FileCheck,
  FileClock,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FolderMinus,
  FolderEdit,
  FolderX,
  FolderCheck,
  FolderClock,
  Usb,
  Disc,
  Clapperboard,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Repeat1,
  Shuffle,
  List,
  ListChecks,
  ListTodo,
  Indent,
  Outdent,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  Terminal,
  Command,
  Delete,
  Power,
  PowerOff,
  LogIn,
  LogOut,
  IdCard,
  Dna,
  ShieldOff,
  KeyRound,
  LockKeyhole,
  Radar,
  Satellite,
  Router,
  Bluetooth,
  Cpu,
  Battery,
  BatteryLow,
  Plug,
  PlugZap
}

/**
 * Get icon component by name
 * @param iconName - Name of the icon
 * @returns React component or fallback icon
 */
export function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  if (!iconName || typeof iconName !== 'string') {
    return AlertCircle
  }
  return ICON_MAP[iconName] || AlertCircle
}

/**
 * Get icons for a specific category
 * @param category - Category name
 * @returns Array of icon names in the category
 */
export function getIconsForCategory(category: IconCategoryName): string[] {
  return ICON_CATEGORIES[category]?.icons || []
}

/**
 * Get all available categories
 * @returns Array of category information
 */
export function getAllCategories() {
  return Object.entries(ICON_CATEGORIES).map(([key, value]) => ({
    key: key as IconCategoryName,
    ...value
  }))
}

/**
 * Search icons by name across all categories
 * @param query - Search query
 * @returns Array of matching icon names
 */
export function searchIcons(query: string): string[] {
  if (!query.trim()) return []
  
  const lowercaseQuery = query.toLowerCase()
  return Object.keys(ICON_MAP).filter(iconName =>
    iconName.toLowerCase().includes(lowercaseQuery)
  )
}

/**
 * Get category for a specific icon
 * @param iconName - Name of the icon
 * @returns Category name or null if not found
 */
export function getIconCategory(iconName: string): IconCategoryName | null {
  for (const [categoryKey, category] of Object.entries(ICON_CATEGORIES)) {
    if (category.icons.includes(iconName)) {
      return categoryKey as IconCategoryName
    }
  }
  return null
}

/**
 * Check if an icon exists
 * @param iconName - Name of the icon
 * @returns Boolean indicating if icon exists
 */
export function iconExists(iconName: string): boolean {
  return iconName in ICON_MAP
}

/**
 * Get default icons for different contexts
 */
export const DEFAULT_ICONS = {
  status: {
    open: 'AlertCircle',
    closed: 'CheckCircle2',
    inProgress: 'Clock',
    pending: 'Timer',
    cancelled: 'XCircle',
    archived: 'Archive'
  },
  priority: {
    low: 'Circle',
    medium: 'AlertCircle',
    high: 'AlertTriangle',
    urgent: 'Zap',
    critical: 'TrendingUp'
  },
  queue: {
    general: 'Inbox',
    support: 'Folder',
    sales: 'TrendingUp',
    technical: 'Settings',
    billing: 'DollarSign'
  },
  user: {
    admin: 'Shield',
    supporter: 'UserCheck',
    manager: 'Crown',
    user: 'User'
  }
} as const

export type DefaultIconContext = keyof typeof DEFAULT_ICONS
export type DefaultIconType<T extends DefaultIconContext> = keyof typeof DEFAULT_ICONS[T]
