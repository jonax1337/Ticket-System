// Application performance and security configuration

export const APP_CONFIG = {
  // Performance settings
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 50,
    minPageSize: 10,
  },
  
  // File upload limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerRequest: 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed'
    ]
  },

  // Rate limiting configuration
  rateLimits: {
    strict: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10
    },
    moderate: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    lenient: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60
    }
  },

  // Input validation limits
  validation: {
    maxStringLength: {
      subject: 255,
      description: 10000,
      email: 255,
      name: 255,
      status: 50,
      priority: 50,
      comment: 10000,
      htmlContent: 50000
    },
    minSearchLength: 2,
    maxSearchLength: 100
  },

  // Cache settings
  cache: {
    statusesPriorities: 30 * 1000, // 30 seconds
    notifications: 10 * 1000, // 10 seconds
    emailSync: 5 * 60 * 1000 // 5 minutes
  },

  // Security settings
  security: {
    bcryptRounds: 12,
    sessionMaxAge: 24 * 60 * 60, // 24 hours in seconds
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    htmlSanitization: {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div'],
      allowedAttributes: {
        'a': ['href', 'title'],
        'span': ['class'],
        'div': ['class']
      }
    }
  }
} as const

// Development vs Production configurations
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// Adjust settings based on environment
if (isDevelopment) {
  // More lenient rate limits in development
  APP_CONFIG.rateLimits.strict.maxRequests = 50
  APP_CONFIG.rateLimits.moderate.maxRequests = 500
}

export default APP_CONFIG