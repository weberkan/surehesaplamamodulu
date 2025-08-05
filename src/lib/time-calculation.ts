
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

  let totalLeaveDays = 0;
  for (const period of mergedLeavePeriods) {
     const leaveStartEffective = max([period.startDate, employmentStartDate]);
     const leaveEndEffective = min([period.endDate, targetDate]);
     if(leaveStartEffective <= leaveEndEffective) {
        totalLeaveDays += differenceInCalendarDays(leaveEndEffective, leaveStartEffective);
     }
  }

  const grossDays = differenceInCalendarDays(targetDate, employmentStartDate);
  const netDays = grossDays - totalLeaveDays;

  return daysToServiceTime(Math.max(0, netDays));
}


export function calculateTotalLeaveDuration(
  leavePeriodsInput: LeavePeriodData[] = [],
  employmentStartDate?: Date,
  targetDate?: Date
): ServiceTime | null {
  if (!employmentStartDate || !targetDate) {
    return null;
  }
  
  const validLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    // Only consider leaves that fall at least partially within the employment period.
    .filter(lp => lp.endDate! >= employmentStartDate && lp.startDate! <= targetDate)
    .map(lp => ({ 
        // Clamp leave dates to be within the employment period.
        startDate: max([new Date(lp.startDate!), employmentStartDate]), 
        endDate: min([new Date(lp.endDate!), targetDate])
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (validLeavePeriods.length === 0) {
    return null; 
  }
  
  // Merge overlapping periods to count days correctly.
  const mergedLeavePeriods: Array<{ startDate: Date, endDate: Date }> = [];
  if (validLeavePeriods.length > 0) {
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
  }


  let totalLeaveDays = 0;
  for (const period of mergedLeavePeriods) {
     if (period.startDate <= period.endDate) {
        totalLeaveDays += differenceInCalendarDays(period.endDate, period.startDate);
     }
  }

  if (totalLeaveDays <= 0) {
    return null;
  }

  return daysToServiceTime(totalLeaveDays);
}
