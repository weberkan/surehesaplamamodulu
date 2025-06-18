
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
  employmentStartDate?: Date,
  leavePeriodsInput: LeavePeriodData[] = []
): ServiceTime {
  if (!employmentStartDate || employmentStartDate > FIXED_TARGET_DATE) {
    return { years: 0, months: 0, days: 0 };
  }

  const processedLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    .map(lp => ({ startDate: new Date(lp.startDate!), endDate: new Date(lp.endDate!) }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const mergedLeavePeriods: Array<{ startDate: Date, endDate: Date }> = [];
  if (processedLeavePeriods.length > 0) {
    let currentMerge = { ...processedLeavePeriods[0] };
    for (let i = 1; i < processedLeavePeriods.length; i++) {
      const nextLeave = processedLeavePeriods[i];
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
    const leaveStartEffective = max([leave.startDate, employmentStartDate]);
    const leaveEndEffective = min([leave.endDate, FIXED_TARGET_DATE]);

    if (effectiveCurrentDate < leaveStartEffective) {
      const workSegmentEnd = min([addDays(leaveStartEffective, -1), FIXED_TARGET_DATE]);
      if (effectiveCurrentDate <= workSegmentEnd) {
         totalWorkedDays += differenceInCalendarDays(workSegmentEnd, effectiveCurrentDate) + 1;
      }
    }
    
    if (effectiveCurrentDate <= leaveEndEffective) {
      effectiveCurrentDate = addDays(leaveEndEffective, 1);
    }
  }

  if (effectiveCurrentDate <= FIXED_TARGET_DATE) {
    totalWorkedDays += differenceInCalendarDays(FIXED_TARGET_DATE, effectiveCurrentDate) + 1;
  }
  
  return daysToServiceTime(Math.max(0, totalWorkedDays));
}

export function calculateTotalLeaveDuration(
  leavePeriodsInput: LeavePeriodData[] = []
): ServiceTime | null {
  const validLeavePeriods = leavePeriodsInput
    .filter(lp => lp.startDate && lp.endDate && lp.startDate <= lp.endDate)
    .map(lp => ({ startDate: new Date(lp.startDate!), endDate: new Date(lp.endDate!) }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (validLeavePeriods.length === 0) {
    return null; 
  }

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
