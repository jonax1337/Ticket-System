"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ date, setDate, placeholder = "Select date & time", className = "" }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "10:00"
  )

  React.useEffect(() => {
    setSelectedDate(date)
    if (date) {
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Parse the time and combine with the selected date
      const [hours, minutes] = timeValue.split(':').map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)
      
      setSelectedDate(newDateTime)
      setDate(newDateTime)
      setOpen(false)
    }
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value
    setTimeValue(newTime)
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours, minutes, 0, 0)
      
      setSelectedDate(newDateTime)
      setDate(newDateTime)
    }
  }

  const clearDate = () => {
    setSelectedDate(undefined)
    setDate(undefined)
    setTimeValue("10:00")
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="flex flex-col gap-1 flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-between font-normal flex-1"
            >
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-1">
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="w-24 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
      {selectedDate && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearDate}
          className="px-2"
        >
          ✕
        </Button>
      )}
    </div>
  )
}