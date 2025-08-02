/**
 * Comprehensive type definitions for the ticket management system
 * These types are based on the Prisma schema and provide a single source of truth
 * for all ticket-related interfaces used throughout the application.
 */

// Base types from Prisma schema
export type UserRole = 'ADMIN' | 'SUPPORTER'

// User-related types
export interface User {
  id: string
  email: string
  name: string
  password?: string | null
  role: UserRole
  avatarUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserBasic {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

// Queue-related types
export interface Queue {
  id: string
  name: string
  description?: string | null
  color: string
  icon: string
  isDefault: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface QueueBasic {
  id: string
  name: string
  color: string
  icon: string
}

// Status and Priority types
export interface CustomStatus {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CustomPriority {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Attachment types
export interface TicketAttachment {
  id: string
  filename: string
  filepath: string
  mimetype: string
  size: number
  ticketId: string
  createdAt: Date
}

export interface CommentAttachment {
  id: string
  filename: string
  filepath: string
  mimetype: string
  size: number
  commentId: string
  createdAt: Date
}

// Participant types
export interface TicketParticipant {
  id: string
  ticketId: string
  email: string
  name?: string | null
  type: string // "creator", "cc", "added_manually"
  createdAt: Date
  updatedAt: Date
}

// Watcher types
export interface TicketWatcher {
  id: string
  ticketId: string
  userId: string
  createdAt: Date
  user: UserBasic
}

// Comment types
export interface Comment {
  id: string
  content: string
  fullEmailContent?: string | null
  sentToEmails?: string | null
  type: 'internal' | 'external' // Required type property
  ticketId: string
  userId?: string | null
  fromName?: string | null
  fromEmail?: string | null
  createdAt: Date
  updatedAt: Date
  user?: UserBasic | null
  attachments?: CommentAttachment[]
}

// Comprehensive Ticket interface
export interface Ticket {
  id: string
  ticketNumber?: string | null
  subject: string
  description: string
  htmlContent?: string | null
  status: string
  priority: string
  fromEmail: string
  fromName?: string | null
  assignedToId?: string | null
  queueId?: string | null
  dueDate?: Date | null
  reminderDate?: Date | null
  createdAt: Date
  updatedAt: Date
  assignedTo?: UserBasic | null
  queue?: QueueBasic | null
  comments?: Comment[]
  attachments?: TicketAttachment[]
  participants?: TicketParticipant[]
  watchers?: TicketWatcher[]
}

// Simplified interfaces for different use cases
export interface TicketBasic {
  id: string
  ticketNumber?: string | null
  subject: string
  status: string
  priority: string
  fromEmail: string
  fromName?: string | null
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
  assignedTo?: {
    id: string
    name: string
    email: string
  } | null
  queue?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
  comments: {
    id: string
  }[]
}

export interface TicketWithComments extends Ticket {
  comments: Comment[]
}

export interface TicketWithFullDetails extends Ticket {
  comments: Comment[]
  attachments: TicketAttachment[]
  participants: TicketParticipant[]
  watchers: TicketWatcher[]
}

// Notification types
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  ticketId?: string | null
  commentId?: string | null
  userId: string
  actorId?: string | null
  isRead: boolean
  createdAt: Date
  updatedAt: Date
  user?: UserBasic
  actor?: UserBasic | null
  ticket?: TicketBasic | null
  comment?: Comment | null
}

// Pagination types
export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TicketListResponse {
  tickets: TicketBasic[]
  pagination: PaginationInfo
}

// Form types
export interface CreateTicketData {
  subject: string
  description: string
  priority: string
  status: string
  fromEmail: string
  fromName?: string
  assignedToId?: string
  queueId?: string
  dueDate?: Date
  participants?: string[] // Array of email addresses
}

export interface UpdateTicketData {
  subject?: string
  description?: string
  htmlContent?: string
  priority?: string
  status?: string
  assignedToId?: string
  queueId?: string
  dueDate?: Date
  reminderDate?: Date
}

export interface CreateCommentData {
  content: string
  type: 'internal' | 'external'
  fullEmailContent?: string
  sentToEmails?: string
  fromName?: string
  fromEmail?: string
}

// Filter and sort types
export type SortField = 'id' | 'subject' | 'status' | 'priority' | 'fromName' | 'assignedTo' | 'createdAt' | 'comments'
export type SortDirection = 'asc' | 'desc'

export interface TicketFilters {
  search?: string
  status?: string
  priority?: string
  assignedTo?: string
  queue?: string
  page?: number
  limit?: number
  sortField?: SortField
  sortDirection?: SortDirection
}

// Component prop types
export interface TicketListProps {
  tickets: TicketBasic[]
  isAdmin?: boolean
  pagination?: PaginationInfo
}

export interface TicketDetailsProps {
  ticket: TicketWithFullDetails
  users: UserBasic[]
  currentUser: UserBasic
  isAdmin?: boolean
}

export interface TicketCommentsProps {
  ticket: TicketWithComments
  currentUser: UserBasic
  users: UserBasic[]
  statuses: CustomStatus[]
  priorities: CustomPriority[]
  onTicketUpdate: (updatedTicket: Ticket) => void
}

export interface CommentEditorProps {
  placeholder?: string
  value?: string
  onChange?: (content: string, serializedState?: unknown) => void
  users?: UserBasic[]
  disabled?: boolean
  className?: string
}

// Email template types
export interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EmailTypeConfig {
  id: string
  type: string
  headerTitle: string
  headerSubtitle: string
  headerColor: string
  greeting: string
  introText: string
  footerText: string
  sections: string // JSON array of content sections
  actionButton?: string | null // JSON object for action button config
  createdAt: Date
  updatedAt: Date
}

// System settings types
export interface SystemSettings {
  id: string
  appName: string
  slogan?: string | null
  logoUrl?: string | null
  hideAppName: boolean
  themeColor: string
  ticketPrefix: string
  ticketNumberType: string
  ticketNumberLength: number
  lastTicketNumber: number
  automationEnabled: boolean
  automationWarningDays: number
  automationCloseDays: number
  automationCheckInterval: number
  emailSubjectPrefix: string
  emailBaseTemplate?: string | null
  emailBaseTemplateActive: boolean
  emailShowLogo: boolean
  emailHideAppName: boolean
  emailHideSlogan: boolean
  emailMonochromeLogo: boolean
  emailFixedHeaderColor: boolean
  emailHeaderColor: string
  emailDisclaimerText: string
  createdAt: Date
  updatedAt: Date
}