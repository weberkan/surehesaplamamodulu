
"use client";

import { DatePickerField } from "@/components/date-picker-field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { LeavePeriodData } from "@/lib/time-calculation";

interface LeavePeriodInputProps {
  leavePeriod: LeavePeriodData;
  index: number;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  onRemove: () => void;
}

export function LeavePeriodInput({
  leavePeriod,
  index,
  onStartDateChange,
  onEndDateChange,
  onRemove,
}: LeavePeriodInputProps) {
  const startDateId = `leave-${leavePeriod.id}-start-date`;
  const endDateId = `leave-${leavePeriod.id}-end-date`;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 border rounded-lg shadow-sm bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full sm:w-auto">
        <DatePickerField
          label={`Leave ${index + 1} Start Date`}
          selectedDate={leavePeriod.startDate}
          onDateChange={onStartDateChange}
          id={startDateId}
        />
        <DatePickerField
          label={`Leave ${index + 1} End Date`}
          selectedDate={leavePeriod.endDate}
          onDateChange={onEndDateChange}
          id={endDateId}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remove leave period ${index + 1}`}
        className="mt-2 sm:mt-0 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
}
