
"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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

const DATE_FORMATS_TO_TRY: string[] = ["P", "PP", "PPP", "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd"];

export function DatePickerField({
  label,
  selectedDate,
  onDateChange,
  id,
  ariaDescribedBy,
  disabled = false,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>("");

  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "P", { locale: tr }));
    } else {
      setInputValue("");
    }
  }, [selectedDate]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const tryParseDate = (value: string): Date | undefined => {
    const referenceDate = new Date();
    for (const fmt of DATE_FORMATS_TO_TRY) {
      try {
        let parsedDate;
        // Locale-sensitive formats
        if (fmt === "P" || fmt === "PP" || fmt === "PPP") {
          parsedDate = parse(value, fmt, referenceDate, { locale: tr });
        } else {
          // Other common formats
          parsedDate = parse(value, fmt, referenceDate);
        }
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch (e) {
        // Ignore parsing errors and try the next format
      }
    }
    return undefined;
  };

  const handleInputBlur = () => {
    const parsedValue = tryParseDate(inputValue);
    if (parsedValue) {
      onDateChange(parsedValue);
      // Value will be updated via useEffect when selectedDate prop changes
    } else {
      // If parsing fails, revert to the last valid selected date or clear
      if (selectedDate) {
        setInputValue(format(selectedDate, "P", { locale: tr }));
      } else {
        setInputValue("");
        onDateChange(undefined); // Explicitly clear if parsing fails and no prior date
      }
    }
  };
  
  const handleCalendarSelect = (date?: Date) => {
    onDateChange(date);
    setIsOpen(false);
    if (date) {
      setInputValue(format(date, "P", { locale: tr }));
    } else {
      setInputValue("");
    }
  };


  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id={id}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={() => setIsOpen(true)}
              placeholder="Bir tarih seçin veya yapıştırın"
              aria-describedby={ariaDescribedBy}
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal h-10 pr-10", // Added pr-10 for icon space
                 !selectedDate && !inputValue && "text-muted-foreground"
              )}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              aria-label="Takvimi aç"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            initialFocus={isOpen || !selectedDate} // Focus calendar if open or no date selected
            disabled={disabled}
            locale={tr}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
