import { addDays, differenceInCalendarDays, intervalToDuration, max, min, type Duration as DateFnsDuration } from 'date-fns';

export const FIXED_TARGET_DATE = new Date(2025, 5, 30); // June 30, 2025 (month is 0-indexed, so 5 is June)

export interface LeavePeriodData {
  id: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ServiceTime {
  years: number;
  months: number;
  days: number;
}

function daysToServiceTime(totalDays: number): ServiceTime {
  if (totalDays <= 0) {
    return { years: 0, months: 0, days: 0 };
  }
  // Use an arbitrary reference start date to calculate duration.
  // date-fns intervalToDuration correctly handles years, months, and days based on calendar logic.
  const refStartDate = new Date(2000, 0, 1); // January 1, 2000
  // To represent totalDays, the interval is from refStartDate to addDays(refStartDate, totalDays).
  // E.g., for 1 day, interval is from Jan 1 to Jan 2, which is 1 day.
  const refEndDate = addDays(refStartDate, totalDays);

  const duration: DateFnsDuration = intervalToDuration({
    start: refStartDate,
    end: refEndDate,
  });

  return {
    years: duration.years || 0,
    months: duration.months || 0,
    days: duration.days || 0,
  };
}

export function calculateNetServiceTime(
  employmentStartDate?: Date,
  leavePeriodsInput: LeavePeriodData[] = []
): ServiceTime {
  if (!employmentStartDate || employmentStartDate > FIXED_TARGET_DATE) {
    return { years: 0, months: 0, days: 0 };
  }

  // Ensure dates are actual Date objects and filter invalid/incomplete periods.
  // Sort by start date for merging.
  const processedLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    .map(lp => ({ startDate: new Date(lp.startDate!), endDate: new Date(lp.endDate!) }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Merge overlapping or adjacent leave periods
  const mergedLeavePeriods: Array<{ startDate: Date, endDate: Date }> = [];
  if (processedLeavePeriods.length > 0) {
    let currentMerge = { ...processedLeavePeriods[0] };
    for (let i = 1; i < processedLeavePeriods.length; i++) {
      const nextLeave = processedLeavePeriods[i];
      // If nextLeave starts before or exactly one day after currentMerge ends (touching or overlapping)
      if (nextLeave.startDate <= addDays(currentMerge.endDate, 1)) {
        currentMerge.endDate = max([currentMerge.endDate, nextLeave.endDate]);
      } else {
        mergedLeavePeriods.push(currentMerge);
        currentMerge = { ...nextLeave };
      }
    }
    mergedLeavePeriods.push(currentMerge);
  }

  let totalWorkedDays = 0;
  // Start from the employment start date.
  let effectiveCurrentDate = new Date(employmentStartDate); 

  for (const leave of mergedLeavePeriods) {
    // Consider the portion of the leave that is after or at employmentStartDate and before or at FIXED_TARGET_DATE
    const leaveStartEffective = max([leave.startDate, employmentStartDate]);
    const leaveEndEffective = min([leave.endDate, FIXED_TARGET_DATE]);

    // If there's a work segment before this leave period (and after the previous one / employment start)
    if (effectiveCurrentDate < leaveStartEffective) {
      const workSegmentEnd = min([addDays(leaveStartEffective, -1), FIXED_TARGET_DATE]);
      if (effectiveCurrentDate <= workSegmentEnd) {
         totalWorkedDays += differenceInCalendarDays(workSegmentEnd, effectiveCurrentDate) + 1;
      }
    }
    
    // Advance effectiveCurrentDate past this leave period, if it was affected.
    // Ensure we only advance if the current date is actually covered by this leave period.
    if (effectiveCurrentDate <= leaveEndEffective) {
      effectiveCurrentDate = addDays(leaveEndEffective, 1);
    }
  }

  // After all leave periods, count any remaining workdays until FIXED_TARGET_DATE
  if (effectiveCurrentDate <= FIXED_TARGET_DATE) {
    totalWorkedDays += differenceInCalendarDays(FIXED_TARGET_DATE, effectiveCurrentDate) + 1;
  }
  
  return daysToServiceTime(Math.max(0, totalWorkedDays)); // Ensure result is not negative
}
