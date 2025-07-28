'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Palette, Mail, Workflow, FileText, Bot, Inbox } from 'lucide-react'
import AdminSettings from '@/components/dashboard/admin-settings'
import EmailSettings from '@/components/dashboard/email-settings'
import EmailTemplateManager from '@/components/dashboard/email-template-manager'
import CustomStatusManager from '@/components/dashboard/custom-status-manager'
import CustomPriorityManager from '@/components/dashboard/custom-priority-manager'
import AutomationSettings from '@/components/dashboard/automation-settings'
import QueueManager from '@/components/dashboard/queue-manager'

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

interface EmailConfiguration {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
  isActive: boolean
  isOutbound: boolean
  lastSync: Date | null
  syncInterval: number
  emailAction: string
  moveToFolder: string | null
  processOnlyUnread: boolean
  subjectFilter: string | null
  fromFilter: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  enableAutoSync: boolean
  createdAt: Date
  updatedAt: Date
}

interface AdminTabsProps {
  settings: SystemSettings
  emailConfigs: EmailConfiguration[]
  priorities: Array<{ id: string; name: string; icon: string; color: string }>
  statuses: Array<{ id: string; name: string; icon: string; color: string }>
}

export default function AdminTabs({ settings, emailConfigs, priorities, statuses }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="w-full overflow-x-auto">
        <TabsList className="inline-flex w-max min-w-full h-auto p-1">
          <TabsTrigger value="general" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Customize</span>
          </TabsTrigger>
          <TabsTrigger value="queues" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Queues</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2 whitespace-nowrap px-3 py-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="general" className="space-y-6 mt-6">
        <GeneralSettings settings={settings} />
      </TabsContent>
      
      <TabsContent value="customize" className="space-y-6 mt-6">
        <CustomizeSettings settings={settings} />
      </TabsContent>
      
      <TabsContent value="queues" className="space-y-6 mt-6">
        <QueueManager />
      </TabsContent>
      
      <TabsContent value="email" className="space-y-6 mt-6">
        <EmailSettings 
          emailConfigs={emailConfigs} 
          priorities={priorities} 
          statuses={statuses} 
        />
      </TabsContent>
      
      <TabsContent value="templates" className="space-y-6 mt-6">
        <EmailTemplateManager />
      </TabsContent>
      
      <TabsContent value="workflow" className="space-y-6 mt-6">
        <WorkflowSettings />
      </TabsContent>
      
      <TabsContent value="automation" className="space-y-6 mt-6">
        <AutomationSettings settings={settings} />
      </TabsContent>
    </Tabs>
  )
}

// General Settings Tab Component
function GeneralSettings({ settings }: { settings: SystemSettings }) {
  return <AdminSettings settings={settings} tabMode="general" />
}

// Customize Settings Tab Component  
function CustomizeSettings({ settings }: { settings: SystemSettings }) {
  return <AdminSettings settings={settings} tabMode="customize" />
}

// Workflow Settings Tab Component
function WorkflowSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomStatusManager />
        <CustomPriorityManager />
      </div>
    </div>
  )
}