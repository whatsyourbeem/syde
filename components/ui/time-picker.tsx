"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  label: string;
  className?: string;
  required?: boolean; // Add required prop
}

export function TimePicker({ time, setTime, label, className }: TimePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label className="text-sm font-semibold text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </Label>
      <Input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-auto" // Override w-full from default Input styling
      />
    </div>
  );
}
