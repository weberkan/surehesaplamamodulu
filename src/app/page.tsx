
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/date-picker-field";
import { LeavePeriodInput } from "@/components/leave-period-input";
import { ResultDisplay } from "@/components/result-display";
import { calculateNetServiceTime, FIXED_TARGET_DATE, type LeavePeriodData, type ServiceTime } from "@/lib/time-calculation";
import { PlusCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function TimeSpanCalculatorPage() {
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>();
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriodData[]>([]);
  const [calculatedServiceTime, setCalculatedServiceTime] = useState<ServiceTime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uuid, setUuid] = useState<(() => string) | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Ensure crypto.randomUUID is available (client-side)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      setUuid(() => window.crypto.randomUUID.bind(window.crypto));
    } else {
      // Fallback for environments without crypto.randomUUID (less robust)
      setUuid(() => () => Date.now().toString(36) + Math.random().toString(36).substr(2));
    }
  }, []);

  const handleAddLeavePeriod = () => {
    if (!uuid) return; // Wait for UUID generator to be ready
    setLeavePeriods([...leavePeriods, { id: uuid(), startDate: undefined, endDate: undefined }]);
  };

  const handleRemoveLeavePeriod = (idToRemove: string) => {
    setLeavePeriods(leavePeriods.filter(lp => lp.id !== idToRemove));
  };

  const handleLeaveStartDateChange = (id: string, date?: Date) => {
    setLeavePeriods(leavePeriods.map(lp => lp.id === id ? { ...lp, startDate: date } : lp));
  };

  const handleLeaveEndDateChange = (id: string, date?: Date) => {
    setLeavePeriods(leavePeriods.map(lp => lp.id === id ? { ...lp, endDate: date } : lp));
  };

  const validateInputs = (): boolean => {
    if (!employmentStartDate) {
      toast({
        title: "Validation Error",
        description: "Please select an employment start date.",
        variant: "destructive",
      });
      return false;
    }

    for (const lp of leavePeriods) {
      if (lp.startDate && lp.endDate && lp.startDate > lp.endDate) {
        toast({
          title: "Validation Error",
          description: `Leave period end date cannot be before its start date.`,
          variant: "destructive",
        });
        return false;
      }
      if ((lp.startDate && !lp.endDate) || (!lp.startDate && lp.endDate)) {
         toast({
          title: "Validation Error",
          description: `Please provide both start and end dates for all leave periods.`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleCalculate = () => {
    if (!validateInputs()) {
      setCalculatedServiceTime(null);
      return;
    }

    setIsLoading(true);
    setCalculatedServiceTime(null); // Clear previous results

    // Simulate calculation delay for animation effect
    setTimeout(() => {
      const result = calculateNetServiceTime(employmentStartDate, leavePeriods);
      setCalculatedServiceTime(result);
      setIsLoading(false);
    }, 500); // Adjust delay as needed
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
      <Card className="shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">
            TimeSpan Calculator
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            Calculate service duration until {format(FIXED_TARGET_DATE, "PPP")}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Employment Start Date Section */}
          <section aria-labelledby="employment-start-title">
            <h2 id="employment-start-title" className="font-headline text-xl text-primary mb-3">
              Employment Details
            </h2>
            <DatePickerField
              label="Employment Start Date"
              selectedDate={employmentStartDate}
              onDateChange={setEmploymentStartDate}
              id="employment-start-date"
            />
          </section>

          {/* Leave Periods Section */}
          <section aria-labelledby="leave-periods-title">
            <div className="flex justify-between items-center mb-3">
              <h2 id="leave-periods-title" className="font-headline text-xl text-primary">
                Leave Periods (Optional)
              </h2>
              <Button variant="outline" size="sm" onClick={handleAddLeavePeriod} disabled={!uuid} className="text-primary border-primary hover:bg-primary/10">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Leave
              </Button>
            </div>
            {leavePeriods.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No leave periods added. Click 'Add Leave' to include any.</p>
            )}
            <div className="space-y-4">
              {leavePeriods.map((lp, index) => (
                <LeavePeriodInput
                  key={lp.id}
                  leavePeriod={lp}
                  index={index}
                  onStartDateChange={(date) => handleLeaveStartDateChange(lp.id, date)}
                  onEndDateChange={(date) => handleLeaveEndDateChange(lp.id, date)}
                  onRemove={() => handleRemoveLeavePeriod(lp.id)}
                />
              ))}
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={handleCalculate}
              disabled={isLoading || !uuid}
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Calculate service time"
            >
              {isLoading ? "Calculating..." : "Calculate Service Time"}
            </Button>
          </div>

          {/* Results Display */}
          {(calculatedServiceTime !== null || isLoading) && (
             <ResultDisplay serviceTime={calculatedServiceTime} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
      <footer className="text-center mt-12 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TimeSpan Calculator. All rights reserved.</p>
      </footer>
    </main>
  );
}
