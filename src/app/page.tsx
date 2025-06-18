
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/date-picker-field";
import { LeavePeriodInput } from "@/components/leave-period-input";
import { ResultDisplay } from "@/components/result-display";
import {
  calculateNetServiceTime,
  calculateTotalLeaveDuration,
  FIXED_TARGET_DATE,
  type LeavePeriodData,
  type ServiceTime
} from "@/lib/time-calculation";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Confetti from 'react-confetti';

export default function TimeSpanCalculatorPage() {
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>();
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriodData[]>([]);
  const [calculatedServiceTime, setCalculatedServiceTime] = useState<ServiceTime | null>(null);
  const [totalLeaveDuration, setTotalLeaveDuration] = useState<ServiceTime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uuid, setUuid] = useState<(() => string) | null>(null);
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number | undefined; height: number | undefined }>({ width: undefined, height: undefined });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      window.addEventListener('resize', handleResize);
      handleResize(); 
      
      if (window.crypto && window.crypto.randomUUID) {
        setUuid(() => window.crypto.randomUUID.bind(window.crypto));
      } else {
        setUuid(() => () => Date.now().toString(36) + Math.random().toString(36).substr(2));
      }
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);


  const handleAddLeavePeriod = () => {
    if (!uuid) return;
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
        title: "Doğrulama Hatası",
        description: "Lütfen işe başlangıç tarihini seçin.",
        variant: "destructive",
      });
      return false;
    }

    for (const lp of leavePeriods) {
      if (lp.startDate && lp.endDate && lp.startDate > lp.endDate) {
        toast({
          title: "Doğrulama Hatası",
          description: `İzin bitiş tarihi başlangıç tarihinden önce olamaz.`,
          variant: "destructive",
        });
        return false;
      }
      if ((lp.startDate && !lp.endDate) || (!lp.startDate && lp.endDate)) {
         toast({
          title: "Doğrulama Hatası",
          description: `Lütfen tüm izin dönemleri için hem başlangıç hem de bitiş tarihlerini girin.`,
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
      setTotalLeaveDuration(null);
      return;
    }

    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000); 

    setIsLoading(true);
    setCalculatedServiceTime(null);
    setTotalLeaveDuration(null);

    setTimeout(() => {
      const result = calculateNetServiceTime(employmentStartDate!, leavePeriods);
      setCalculatedServiceTime(result);

      const totalLeaves = calculateTotalLeaveDuration(leavePeriods);
      setTotalLeaveDuration(totalLeaves);

      setIsLoading(false);
    }, 500);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
      {showConfetti && windowDimensions.width && windowDimensions.height && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          confettiSource={{
            x: windowDimensions.width / 2,
            y: windowDimensions.height / 2,
            w: 0,
            h: 0,
          }}
        />
      )}
      <Card className="shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">
            Personel Hareketleri Şube Müdürlüğü
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground pt-2">
            {format(FIXED_TARGET_DATE, "PPP", { locale: tr })} tarihine kadar hizmet süresini hesaplayın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section aria-labelledby="employment-start-title">
            <h2 id="employment-start-title" className="font-headline text-xl text-primary mb-3">
              İstihdam Detayları
            </h2>
            <DatePickerField
              label="İşe Başlangıç Tarihi"
              selectedDate={employmentStartDate}
              onDateChange={setEmploymentStartDate}
              id="employment-start-date"
            />
          </section>

          <section aria-labelledby="leave-periods-title">
            <div className="flex justify-between items-center mb-3">
              <h2 id="leave-periods-title" className="font-headline text-xl text-primary">
                İzin Dönemleri (İsteğe Bağlı)
              </h2>
              <Button variant="outline" size="sm" onClick={handleAddLeavePeriod} disabled={!uuid} className="text-primary border-primary hover:bg-primary/10">
                <PlusCircle className="mr-2 h-4 w-4" /> İzin Ekle
              </Button>
            </div>
            {leavePeriods.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Eklenmiş izin dönemi yok. Eklemek için 'İzin Ekle'ye tıklayın.</p>
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
            {totalLeaveDuration && !isLoading && (
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-md font-semibold text-foreground mb-1">Toplam Kullanılan İzin Süresi:</h3>
                <p className="text-lg text-primary font-medium">
                  {`${totalLeaveDuration.years} Yıl, ${totalLeaveDuration.months} Ay, ${totalLeaveDuration.days} Gün`}
                </p>
              </div>
            )}
          </section>

          <div className="pt-4">
            <Button
              onClick={handleCalculate}
              disabled={isLoading || !uuid}
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Hizmet süresini hesapla"
            >
              {isLoading ? "Hesaplanıyor..." : "Hizmet Süresini Hesapla"}
            </Button>
          </div>

          {(calculatedServiceTime !== null || isLoading) && (
             <ResultDisplay serviceTime={calculatedServiceTime} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
      <footer className="text-center mt-12 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Personel Hareketleri Şube Müdürlüğü. Tüm hakları saklıdır.</p>
      </footer>
    </main>
  );
}
