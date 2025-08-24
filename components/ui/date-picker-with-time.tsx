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
import { Label } from "@/components/ui/label"; // Import Label

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label: string;
  className?: string;
  required?: boolean; // Add required prop
}

export function DatePicker({ date, setDate, label, className, required }: DatePickerProps) {
  return (
    <div className={cn("w-full", className)}>
      <Label className="text-sm font-semibold text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>} {/* Add asterisk */}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal px-2",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="m-0 h-4 w-4" />
            {date ? format(date, "yyyy년 M월 d일") : "날짜 선택"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 h-80 p-0" align="start" side="bottom" sideOffset={10}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate} // Directly set the date
            initialFocus
            className="w-full"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}