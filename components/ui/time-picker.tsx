"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  label: string;
  className?: string;
  required?: boolean;
}

export function TimePicker({
  time,
  setTime,
  label,
  className,
}: TimePickerProps) {
  const [hour, setHour] = React.useState<number>(12);
  const [minute, setMinute] = React.useState<number>(0);
  const [period, setPeriod] = React.useState<"AM" | "PM">("AM");

  React.useEffect(() => {
    if (time) {
      const [h, m] = time.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const newPeriod = h >= 12 ? "PM" : "AM";
        const newHour = h % 12 === 0 ? 12 : h % 12;
        setHour(newHour);
        setMinute(m);
        setPeriod(newPeriod);
      }
    } else {
      setHour(12);
      setMinute(0);
      setPeriod("AM");
    }
  }, [time]);

  const handleTimeChange = (
    newHour: number,
    newMinute: number,
    newPeriod: "AM" | "PM"
  ) => {
    let h24 = newHour;
    if (newPeriod === "PM" && newHour < 12) {
      h24 += 12;
    } else if (newPeriod === "AM" && newHour === 12) {
      h24 = 0;
    }

    const formattedTime = `${String(h24).padStart(2, "0")}:${String(
      newMinute
    ).padStart(2, "0")}`;
    setTime(formattedTime);
  };

  const handleHourChange = (value: string) => {
    const newHour = parseInt(value, 10);
    if (!isNaN(newHour)) {
      setHour(newHour);
      handleTimeChange(newHour, minute, period);
    }
  };

  const handleMinuteChange = (value: string) => {
    const newMinute = parseInt(value, 10);
    if (!isNaN(newMinute)) {
      setMinute(newMinute);
      handleTimeChange(hour, newMinute, period);
    }
  };

  const togglePeriod = () => {
    const newPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    handleTimeChange(hour, minute, newPeriod);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Label className="text-sm font-semibold text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          onClick={togglePeriod}
          className="w-auto px-3"
        >
          {period === "AM" ? "오전" : "오후"}
        </Button>
        <Select
          value={String(hour)}
          onValueChange={handleHourChange}
        >
          <SelectTrigger className="w-14 px-2">
            <SelectValue placeholder={String(hour).padStart(2, "0")} />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <SelectItem key={h} value={String(h)}>
                {String(h).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={String(minute)}
          onValueChange={handleMinuteChange}
        >
          <SelectTrigger className="w-14 px-2">
            <SelectValue placeholder={String(minute).padStart(2, "0")} />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 6 }, (_, i) => i * 10).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {String(m).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}