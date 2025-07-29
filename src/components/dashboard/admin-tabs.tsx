'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/tabs'
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
      <TabsList className="w-full grid grid-cols-7 h-auto p-1">
        <TabsTrigger value="general" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">General</span>
        </TabsTrigger>
        <TabsTrigger value="customize" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Palette className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Customize</span>
        </TabsTrigger>
        <TabsTrigger value="queues" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Inbox className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Queues</span>
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Email</span>
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Templates</span>
        </TabsTrigger>
        <TabsTrigger value="workflow" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Workflow className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Workflow</span>
        </TabsTrigger>
        <TabsTrigger value="automation" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0">
          <Bot className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline truncate">Automation</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContents className="mt-6">
        <TabsContent value="general" className="space-y-6">
          <GeneralSettings settings={settings} />
        </TabsContent>
        
        <TabsContent value="customize" className="space-y-6">
          <CustomizeSettings settings={settings} />
        </TabsContent>
        
        <TabsContent value="queues" className="space-y-6">
          <QueueManager />
        </TabsContent>
        
        <TabsContent value="email" className="space-y-6">
          <EmailSettings 
            emailConfigs={emailConfigs} 
            priorities={priorities} 
            statuses={statuses} 
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <EmailTemplateManager />
        </TabsContent>
        
        <TabsContent value="workflow" className="space-y-6">
          <WorkflowSettings />
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-6">
          <AutomationSettings settings={settings} />
        </TabsContent>
      </TabsContents>
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