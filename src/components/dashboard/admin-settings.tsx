'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Palette, Save, Type, Image, Pipette, Settings, Hash, Mail } from 'lucide-react'
import InboxSettings from './inbox-settings'

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

interface SystemSettings {
  id: string
  appName: string
  slogan?: string | null
  logoUrl?: string | null
  hideAppName?: boolean
  themeColor: string
  ticketPrefix: string
  ticketNumberType: string
  ticketNumberLength: number
  lastTicketNumber: number
  createdAt: Date
  updatedAt: Date
}

interface AdminSettingsProps {
  settings: SystemSettings
}

const themeColors = [
  { name: 'Default', value: 'default', color: 'bg-slate-600' },
  { name: 'Blue', value: 'blue', color: 'bg-blue-600' },
  { name: 'Green', value: 'green', color: 'bg-emerald-600' },
  { name: 'Purple', value: 'purple', color: 'bg-violet-600' },
]

export default function AdminSettings({ settings }: AdminSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [appName, setAppName] = useState(settings.appName)
  const [slogan, setSlogan] = useState(settings.slogan || '')
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '')
  const [hideAppName, setHideAppName] = useState(settings.hideAppName || false)
  const [themeColor, setThemeColor] = useState(settings.themeColor)
  const [customColor, setCustomColor] = useState('')
  const [ticketPrefix, setTicketPrefix] = useState(settings.ticketPrefix)
  const [ticketNumberType, setTicketNumberType] = useState(settings.ticketNumberType)
  const [ticketNumberLength, setTicketNumberLength] = useState(settings.ticketNumberLength)
  
  // Check if current theme is a custom color (hex format)
  const isCustomTheme = themeColor.startsWith('#')
  
  // Initialize custom color if theme is custom
  React.useEffect(() => {
    if (isCustomTheme) {
      setCustomColor(themeColor)
    }
  }, [settings.themeColor, isCustomTheme])

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName,
          slogan: slogan.trim() || null,
          logoUrl: logoUrl.trim() || null,
          hideAppName,
          themeColor,
          ticketPrefix,
          ticketNumberType,
          ticketNumberLength,
        }),
      })

      if (response.ok) {
        // Apply theme immediately
        if (isCustomTheme) {
          // For custom themes, we keep the CSS variables we set
          document.documentElement.setAttribute('data-theme', 'default')
        } else {
          document.documentElement.setAttribute('data-theme', themeColor)
        }
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const previewTheme = (color: string) => {
    document.documentElement.setAttribute('data-theme', color)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure the basic settings for your support system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter application name"
            />
            <p className="text-sm text-muted-foreground">
              This will be displayed in the header and browser title.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan/Subtitle</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="e.g., Ticket Management System"
            />
            <p className="text-sm text-muted-foreground">
              Optional subtitle displayed below the app name. Leave empty to hide.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo & Branding
          </CardTitle>
          <CardDescription>
            Upload a logo or provide a URL to customize your application branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              Enter a URL to an image that will be displayed as your logo in the header.
            </p>
          </div>
          
          {logoUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                      if (nextElement) {
                        nextElement.style.display = 'block'
                      }
                    }}
                  />
                  <div className="text-sm text-muted-foreground hidden">
                    Could not load image from the provided URL.
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideAppName"
                  checked={hideAppName}
                  onCheckedChange={(checked) => setHideAppName(checked === true)}
                />
                <Label htmlFor="hideAppName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Hide Application Name
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                When enabled, only the logo will be displayed in the header (without the application name).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Colors
          </CardTitle>
          <CardDescription>
            Choose the primary color scheme for your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Preset Colors</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {themeColors.map((theme) => (
                <div
                  key={theme.value}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    themeColor === theme.value 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setThemeColor(theme.value)
                    previewTheme(theme.value)
                    // Reset custom color when selecting preset
                    if (theme.value !== 'custom') {
                      document.documentElement.removeAttribute('style')
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${theme.color}`} />
                    <span className="text-sm font-medium">{theme.name}</span>
                  </div>
                  {themeColor === theme.value && (
                    <Badge className="absolute -top-2 -right-2 text-xs">Active</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className={`transition-opacity duration-200 ${isCustomTheme ? 'opacity-100' : 'opacity-50'}`}>
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                Custom Color
                {isCustomTheme && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor || '#3b82f6'}
                    onFocus={() => {
                      if (customColor && customColor.match(/^#[0-9A-F]{6}$/i)) {
                        setThemeColor(customColor)
                        const hsl = hexToHsl(customColor)
                        document.documentElement.style.setProperty('--primary', hsl)
                        document.documentElement.style.setProperty('--ring', hsl)
                      }
                    }}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      setThemeColor(e.target.value)
                      const hsl = hexToHsl(e.target.value)
                      document.documentElement.style.setProperty('--primary', hsl)
                      document.documentElement.style.setProperty('--ring', hsl)
                    }}
                    className="w-12 h-12 rounded-md border border-input cursor-pointer bg-transparent"
                    style={{ padding: '2px' }}
                  />
                  <Pipette className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none opacity-60" />
                </div>
                <div className="flex-1">
                  <Input
                    value={customColor}
                    onFocus={() => {
                      if (customColor && customColor.match(/^#[0-9A-F]{6}$/i)) {
                        setThemeColor(customColor)
                        const hsl = hexToHsl(customColor)
                        document.documentElement.style.setProperty('--primary', hsl)
                        document.documentElement.style.setProperty('--ring', hsl)
                      }
                    }}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      if (e.target.value && e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                        setThemeColor(e.target.value)
                        const hsl = hexToHsl(e.target.value)
                        document.documentElement.style.setProperty('--primary', hsl)
                        document.documentElement.style.setProperty('--ring', hsl)
                      }
                    }}
                    placeholder="#3b82f6"
                    className="font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Changes are applied instantly. Click a preset color to deactivate custom mode.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Click on a preset color or create a custom one. Changes will be applied immediately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Ticket Numbering
          </CardTitle>
          <CardDescription>
            Configure how ticket numbers are generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketPrefix">Ticket Prefix</Label>
              <Input
                id="ticketPrefix"
                value={ticketPrefix}
                onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
                placeholder="T"
                maxLength={5}
              />
              <p className="text-sm text-muted-foreground">
                Prefix for all ticket numbers (e.g., "T", "TICKET", "SUP")
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketNumberType">Number Type</Label>
              <Select value={ticketNumberType} onValueChange={setTicketNumberType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Sequential (001, 002, 003...)</SelectItem>
                  <SelectItem value="random">Random (AB3X5F, K9L2M8...)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose between sequential numbers or random alphanumeric codes
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ticketNumberLength">Number Length</Label>
            <Select value={ticketNumberLength.toString()} onValueChange={(value) => setTicketNumberLength(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 digits</SelectItem>
                <SelectItem value="5">5 digits</SelectItem>
                <SelectItem value="6">6 digits</SelectItem>
                <SelectItem value="7">7 digits</SelectItem>
                <SelectItem value="8">8 digits</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Length of the number/code part
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="font-mono text-lg">
              {ticketPrefix}-{ticketNumberType === 'sequential' 
                ? '0'.repeat(Math.max(0, ticketNumberLength - 1)) + '1'
                : 'A'.repeat(Math.ceil(ticketNumberLength / 2)) + '1'.repeat(Math.floor(ticketNumberLength / 2))
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Example of how new ticket numbers will look
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workflow Management
          </CardTitle>
          <CardDescription>
            Manage custom statuses and priorities for your tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure custom ticket statuses and priorities to match your team's workflow. These will be available in all ticket dropdowns.
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin/workflow/statuses')}
              className="flex-1"
            >
              Manage Statuses
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin/workflow/priorities')}
              className="flex-1"
            >
              Manage Priorities
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}