
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
import { Label } from "@/components/ui/label";

interface DatePickerFieldProps {
  label: string;
  selectedDate?: Date;
  onDateChange: (date?: Date) => void;
  id: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
}

export function DatePickerField({
  label,
  selectedDate,
  onDateChange,
  id,
  ariaDescribedBy,
  disabled = false,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            id={id}
            aria-describedby={ariaDescribedBy}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateChange(date);
              setIsOpen(false);
            }}
            initialFocus
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
