'use client'

import { useEffect } from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
  themeColor: string
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  // Remove the hash if it exists
  hex = hex.replace('#', '')
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function ThemeProvider({ children, themeColor }: ThemeProviderProps) {
  useEffect(() => {
    // Check if themeColor is a custom color (hex format)
    const isCustomColor = themeColor.startsWith('#')
    
    if (isCustomColor) {
      // For custom colors, set CSS variables and use default theme
      const hsl = hexToHsl(themeColor)
      document.documentElement.style.setProperty('--primary', hsl)
      document.documentElement.style.setProperty('--ring', hsl)
      document.documentElement.setAttribute('data-theme', 'default')
    } else {
      // For preset themes, clear custom variables and set theme
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--ring')
      document.documentElement.setAttribute('data-theme', themeColor)
    }
  }, [themeColor])

  return <>{children}</>
}