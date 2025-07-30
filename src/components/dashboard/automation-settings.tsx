'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/animate-ui/radix/switch'
import { Badge } from '@/components/ui/badge'
import { Bot, Clock, AlertTriangle, Settings, Save, PlayCircle, StopCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AutomationStatus {
  isRunning: boolean
  config: {
    enabled: boolean
    daysUntilWarning: number
    daysUntilAutoClose: number
    checkIntervalMinutes: number
  }
  hasInterval: boolean
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
  automationEnabled: boolean
  automationWarningDays: number
  automationCloseDays: number
  automationCheckInterval: number
  createdAt: Date
  updatedAt: Date
}

interface AutomationSettingsProps {
  settings: SystemSettings
}

export default function AutomationSettings({ settings }: AutomationSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingLoading, setIsTestingLoading] = useState(false)
  const [status, setStatus] = useState<AutomationStatus | null>(null)
  
  // Form state
  const [enabled, setEnabled] = useState(settings.automationEnabled)
  const [warningDays, setWarningDays] = useState(settings.automationWarningDays)
  const [closeDays, setCloseDays] = useState(settings.automationCloseDays)
  const [checkInterval, setCheckInterval] = useState(settings.automationCheckInterval)

  // Load automation status
  React.useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/automation/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.automation)
      }
    } catch (error) {
      console.error('Failed to load automation status:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Include existing settings to avoid overwriting them
          appName: settings.appName || 'Support Dashboard',
          themeColor: settings.themeColor || 'default',
          ticketPrefix: settings.ticketPrefix || 'T',
          ticketNumberType: settings.ticketNumberType || 'sequential',
          ticketNumberLength: settings.ticketNumberLength || 6,
          // Automation settings
          automationEnabled: enabled,
          automationWarningDays: warningDays,
          automationCloseDays: closeDays,
          automationCheckInterval: checkInterval,
        }),
      })

      if (response.ok) {
        // Reload the automation service with new config
        await fetch('/api/admin/automation/reload', { method: 'POST' })
        await loadStatus() // Refresh status
        
        toast.success('Automation settings saved successfully', {
          description: 'The automation service has been updated with your new configuration.'
        })
        router.refresh()
      } else {
        const errorData = await response.json()
        toast.error('Failed to save automation settings', {
          description: errorData.error || 'Please try again or contact support if the problem persists.'
        })
      }
    } catch (error) {
      console.error('Failed to save automation settings:', error)
      toast.error('Failed to save automation settings', {
        description: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestRun = async () => {
    setIsTestingLoading(true)
    
    try {
      const response = await fetch('/api/cron/automation', { method: 'POST' })
      
      if (response.ok) {
        toast.success('Test run completed', {
          description: 'The automation service has processed all eligible tickets.'
        })
      } else {
        const errorData = await response.json()
        toast.error('Test run failed', {
          description: errorData.error || 'Please check the logs for more details.'
        })
      }
    } catch (error) {
      console.error('Failed to run test:', error)
      toast.error('Test run failed', {
        description: 'An unexpected error occurred during the test run.'
      })
    } finally {
      setIsTestingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Automation Service Status
          </CardTitle>
          <CardDescription>
            Current status and configuration of the ticket automation service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {status.isRunning ? (
                    <PlayCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <StopCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">Service</span>
                </div>
                <Badge variant={status.isRunning ? "default" : "secondary"}>
                  {status.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Configuration</span>
                </div>
                <Badge variant={status.config.enabled ? "default" : "secondary"}>
                  {status.config.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Interval</span>
                </div>
                <Badge variant="outline">
                  {status.config.checkIntervalMinutes}m
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading status...
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={loadStatus}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
            
            <Button
              onClick={handleTestRun}
              variant="outline"
              size="sm"
              disabled={isTestingLoading || !enabled}
              className="flex items-center gap-2"
            >
              {isTestingLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Test Run
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Configuration
          </CardTitle>
          <CardDescription>
            Configure the automated ticket closure system behavior and timing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Automation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically close tickets after periods of customer inactivity
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="warningDays">Warning Period</Label>
              <Select value={warningDays.toString()} onValueChange={(value) => setWarningDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="10">10 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Send warning email to customers this many days before auto-closure
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeDays">Auto-Close Period</Label>
              <Select value={closeDays.toString()} onValueChange={(value) => setCloseDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="10">10 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="21">21 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Automatically close tickets after this many days of customer inactivity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkInterval">Check Interval</Label>
              <Select value={checkInterval.toString()} onValueChange={(value) => setCheckInterval(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often to scan for tickets eligible for automation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Automation Timeline</Label>
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Customer inactive for:</span>
                  <Badge variant="outline">{warningDays} days</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  → Warning email sent to customer
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer still inactive for:</span>
                  <Badge variant="outline">{closeDays} days</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  → Ticket automatically closed
                </div>
              </div>
            </div>
          </div>

          {/* Warning Messages */}
          {enabled && warningDays >= closeDays && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Warning:</strong> The warning period should be less than the auto-close period. 
                Customers should receive advance notice before their tickets are closed.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Automation Settings'}
        </Button>
      </div>
    </div>
  )
}