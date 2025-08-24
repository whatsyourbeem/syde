
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label: string;
}

export function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
  const [time, setTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setDate(newDate);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      selectedDate.setHours(hours, minutes);
    }
    setDate(selectedDate);
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "yyyy년 M월 d일 a h:mm") : "날짜 및 시간 선택"
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-52 flex flex-col" side="bottom" sideOffset={10} avoidCollisions={false}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="w-full "
          />
          <div className="p-3 border-border mt-12"> {/* Add mt-2 to push it down */}
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
