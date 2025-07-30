'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useAppSettings } from '@/hooks/use-app-settings'
import { useEffect } from 'react'

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '')
  
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

interface AppThemeProviderProps {
  children: React.ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const { settings } = useAppSettings()

  useEffect(() => {
    if (!settings) return

    const root = document.documentElement
    
    // Apply theme color
    if (settings.themeColor.startsWith('#')) {
      // Custom hex color
      const hsl = hexToHsl(settings.themeColor)
      root.style.setProperty('--primary', hsl)
      root.style.setProperty('--ring', hsl)
      root.setAttribute('data-theme', 'default')
    } else {
      // Predefined theme colors
      const themeColors = {
        default: '0 0% 98%', // Almost white for default
        blue: '221.2 83.2% 53.3%',
        green: '142.1 76.2% 36.3%',
        purple: '262.1 83.3% 57.8%',
        red: '0 84.2% 60.2%',
        amber: '47.9 95.8% 53.1%',
        orange: '24.6 95% 53.1%',
        pink: '322.2 78.9% 52.4%',
        indigo: '263.4 70% 50.4%',
        teal: '173.4 80.4% 40%'
      }
      
      const colorValue = themeColors[settings.themeColor as keyof typeof themeColors] || themeColors.default
      root.style.setProperty('--primary', colorValue)
      root.style.setProperty('--ring', colorValue)
      root.setAttribute('data-theme', settings.themeColor)
    }
  }, [settings])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}