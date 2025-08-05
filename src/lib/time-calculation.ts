
import { addDays, differenceInCalendarDays, intervalToDuration, max, min, type Duration as DateFnsDuration } from 'date-fns';

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
  // Using a consistent reference date ensures intervalToDuration works as expected for converting days.
  const refStartDate = new Date(2000, 0, 1); 
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
  employmentStartDate: Date,
  targetDate: Date,
  leavePeriodsInput: LeavePeriodData[] = []
): ServiceTime {
  if (!employmentStartDate || !targetDate || employmentStartDate > targetDate) {
    return { years: 0, months: 0, days: 0 };
  }

  // Filter for valid and complete leave periods and sort them.
  const processedLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    .map(lp => ({ startDate: new Date(lp.startDate!), endDate: new Date(lp.endDate!) }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Merge overlapping or contiguous leave periods to simplify calculation.
  const mergedLeavePeriods: Array<{ startDate: Date, endDate: Date }> = [];
  if (processedLeavePeriods.length > 0) {
    let currentMerge = { ...processedLeavePeriods[0] };
    for (let i = 1; i < processedLeavePeriods.length; i++) {
      const nextLeave = processedLeavePeriods[i];
      // If the next leave starts on or before the day after the current merge ends, merge them.
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
  let effectiveCurrentDate = new Date(employmentStartDate); 

  for (const leave of mergedLeavePeriods) {
    // Determine the effective start and end of the leave within the employment period.
    const leaveStartEffective = max([leave.startDate, employmentStartDate]);
    const leaveEndEffective = min([leave.endDate, targetDate]);

    // Calculate worked days from the last point up to the start of this leave.
    if (effectiveCurrentDate < leaveStartEffective) {
      const workSegmentEnd = min([addDays(leaveStartEffective, -1), targetDate]);
      if (effectiveCurrentDate <= workSegmentEnd) {
         totalWorkedDays += differenceInCalendarDays(workSegmentEnd, effectiveCurrentDate) + 1;
      }
    }
    
    // Move the 'current date' cursor past this leave period.
    if (effectiveCurrentDate <= leaveEndEffective) {
      effectiveCurrentDate = addDays(leaveEndEffective, 1);
    }
  }

  // Calculate any remaining worked days after the last leave period.
  if (effectiveCurrentDate <= targetDate) {
    totalWorkedDays += differenceInCalendarDays(targetDate, effectiveCurrentDate) + 1;
  }
  
  return daysToServiceTime(Math.max(0, totalWorkedDays));
}

export function calculateTotalLeaveDuration(
  leavePeriodsInput: LeavePeriodData[] = [],
  employmentStartDate?: Date,
  targetDate?: Date
): ServiceTime | null {
  const validLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    // Only consider leaves that fall at least partially within the employment period.
    .filter(lp => employmentStartDate && targetDate && lp.endDate! >= employmentStartDate && lp.startDate! <= targetDate)
    .map(lp => ({ 
        // Clamp leave dates to be within the employment period.
        startDate: max([new Date(lp.startDate!), employmentStartDate!]), 
        endDate: min([new Date(lp.endDate!), targetDate!])
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (validLeavePeriods.length === 0) {
    return null; 
  }
  
  // Merge overlapping periods to count days correctly.
  const mergedLeavePeriods: Array<{ startDate: Date, endDate: Date }> = [];
  let currentMerge = { ...validLeavePeriods[0] };

  for (let i = 1; i < validLeavePeriods.length; i++) {
    const nextLeave = validLeavePeriods[i];
    if (nextLeave.startDate <= addDays(currentMerge.endDate, 1)) {
      currentMerge.endDate = max([currentMerge.endDate, nextLeave.endDate]);
    } else {
      mergedLeavePeriods.push(currentMerge);
      currentMerge = { ...nextLeave };
    }
  }
  mergedLeavePeriods.push(currentMerge);

  let totalLeaveDays = 0;
  for (const period of mergedLeavePeriods) {
    totalLeaveDays += differenceInCalendarDays(period.endDate, period.startDate) + 1;
  }

  if (totalLeaveDays <= 0) {
    return null;
  }

  return daysToServiceTime(totalLeaveDays);
}
