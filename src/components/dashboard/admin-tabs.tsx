'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Palette, Mail, Workflow } from 'lucide-react'
import AdminSettings from '@/components/dashboard/admin-settings'
import EmailSettings from '@/components/dashboard/email-settings'
import CustomStatusManager from '@/components/dashboard/custom-status-manager'
import CustomPriorityManager from '@/components/dashboard/custom-priority-manager'

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
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="customize" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Customize
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </TabsTrigger>
        <TabsTrigger value="workflow" className="flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          Workflow
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-6 mt-6">
        <GeneralSettings settings={settings} />
      </TabsContent>
      
      <TabsContent value="customize" className="space-y-6 mt-6">
        <CustomizeSettings settings={settings} />
      </TabsContent>
      
      <TabsContent value="email" className="space-y-6 mt-6">
        <EmailSettings 
          emailConfigs={emailConfigs} 
          priorities={priorities} 
          statuses={statuses} 
        />
      </TabsContent>
      
      <TabsContent value="workflow" className="space-y-6 mt-6">
        <WorkflowSettings />
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