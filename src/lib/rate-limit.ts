import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime <= now) {
      delete store[key]
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests' } = options

  return (request: NextRequest) => {
    // Get client identifier (IP + user agent for better uniqueness)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const key = `${ip}:${userAgent.substring(0, 50)}`

    const now = Date.now()
    const resetTime = now + windowMs

    if (!store[key] || store[key].resetTime <= now) {
      // First request in window or window expired
      store[key] = {
        count: 1,
        resetTime
      }
      return { allowed: true, remaining: maxRequests - 1, resetTime }
    }

    if (store[key].count >= maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: store[key].resetTime,
        message 
      }
    }

    // Increment counter
    store[key].count++
    return { 
      allowed: true, 
      remaining: maxRequests - store[key].count, 
      resetTime: store[key].resetTime 
    }
  }
}

// Predefined rate limiters for different endpoint types
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
  message: 'Too many requests, please try again later'
})

export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Rate limit exceeded, please slow down'
})

export const lenientRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Too many requests per minute'
})