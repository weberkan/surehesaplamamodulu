
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
      const timer = setTimeout(() => setShouldAnimate(false), 500); 
      return () => clearTimeout(timer);
    }
  }, [serviceTime, isLoading]);

  if (isLoading) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-lg text-primary">Hesaplanıyor...</CardTitle>
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
    return null; 
  }

  return (
    <Card className={`w-full mt-8 shadow-lg ${shouldAnimate ? 'animate-fade-in' : ''}`}>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Hesaplanan Hizmet Süresi</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 text-center">
          <p className="text-xl font-headline text-primary font-semibold">
            {`${serviceTime.years} Yıl, ${serviceTime.months} Ay, ${serviceTime.days} Gün`}
          </p>
      </CardContent>
    </Card>
  );
}
