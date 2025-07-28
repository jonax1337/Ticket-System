"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import { TicketVolumeChartContent } from '@/components/dashboard/charts/ticket-volume-chart-content'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function CollapsibleAnalytics() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Ticket Volume Analytics</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-6 pb-6">
            <TicketVolumeChartContent />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}