
"use client";

import type { ServiceTime } from "@/lib/time-calculation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ResultDisplayProps {
  serviceTime: ServiceTime | null;
  isLoading: boolean;
}

export function ResultDisplay({ serviceTime, isLoading }: ResultDisplayProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (serviceTime !== null && !isLoading) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 500); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [serviceTime, isLoading]);

  if (isLoading) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">Calculating...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-2/3 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (serviceTime === null) {
    return null; // Don't display anything if no calculation has been made yet or if reset
  }

  return (
    <Card className={`w-full mt-8 shadow-lg ${shouldAnimate ? 'animate-fade-in' : ''}`}>
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Calculated Service Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium text-foreground/80">Years:</span>
          <span className="font-headline text-primary font-semibold">{serviceTime.years}</span>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium text-foreground/80">Months:</span>
          <span className="font-headline text-primary font-semibold">{serviceTime.months}</span>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium text-foreground/80">Days:</span>
          <span className="font-headline text-primary font-semibold">{serviceTime.days}</span>
        </div>
      </CardContent>
    </Card>
  );
}
