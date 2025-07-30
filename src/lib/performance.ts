// Performance monitoring and optimization utilities
import React from 'react'

export function measurePerformance(name: string) {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
      }
      return duration
    }
  }
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

// Lazy loading utility for heavy components
export function createLazyComponent<T extends React.ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc)
  const FallbackComponent = fallback || (() => React.createElement('div', null, 'Loading...'))
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(LazyComponent, props)
    )
  }
}

// Intersection Observer hook for performance
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

// Virtual scrolling helper for large lists
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan = 5
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2)

  return { startIndex, endIndex, visibleCount }
}

// Memory usage monitoring
export function logMemoryUsage(context?: string) {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as typeof performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    console.log(`🧠 Memory Usage ${context ? `(${context})` : ''}:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
    })
  }
}