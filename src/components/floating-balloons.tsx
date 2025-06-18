
'use client';

import React, { useEffect, useState } from 'react';

interface BalloonProps {
  id: number;
  color: string;
  delay: number;
  duration: number;
  left: number;
  sizeClass: string;
}

const Balloon: React.FC<BalloonProps> = ({ color, delay, duration, left, sizeClass }) => {
  return (
    <div
      className={`absolute bottom-0 opacity-70 rounded-full animate-float ${sizeClass}`}
      style={{
        background: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        left: `${left}%`,
        boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.1), inset 2px 2px 5px rgba(255,255,255,0.3)',
      }}
    >
      <div
        className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent"
        style={{ 
          borderTop: `8px solid ${color}`,
          bottom: sizeClass === 'w-10 h-14 md:w-12 md:h-16' ? '-5px' : '-4px', // Adjust based on size
          filter: 'brightness(0.8)'
        }}
      />
    </div>
  );
};

interface FloatingBalloonsProps {
  count?: number;
  show: boolean;
  onComplete?: () => void;
}

const PTT_COLORS = ['hsl(209, 100%, 28%)', 'hsl(45, 100%, 50%)', 'hsl(0, 0%, 100%)']; // PTT Mavi, PTT Sarı, Beyaz
const SIZES = ['w-10 h-14 md:w-12 md:h-16', 'w-8 h-12 md:w-10 md:h-14']; // Farklı balon boyutları

export const FloatingBalloons: React.FC<FloatingBalloonsProps> = ({ count = 12, show, onComplete }) => {
  const [balloons, setBalloons] = useState<BalloonProps[]>([]);

  useEffect(() => {
    if (show) {
      const newBalloons = Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i, // Daha benzersiz ID
        color: PTT_COLORS[i % PTT_COLORS.length],
        delay: Math.random() * 2.5, 
        duration: Math.random() * 3 + 5, // Süre 5s ile 8s arası
        left: Math.random() * 92, // Yatay pozisyon (0-92% arası)
        sizeClass: SIZES[i % SIZES.length],
      }));
      setBalloons(newBalloons);

      const maxAnimationTime = 2.5 + 8; // Max delay + Max duration
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        // Balonları hemen temizlemek yerine animasyonun bitmesini bekleyebiliriz
        // veya onComplete ile tetiklendiğinde ana bileşende show=false yapılır.
      }, maxAnimationTime * 1000);
      return () => clearTimeout(timer);

    } else {
       // show false olduğunda balonları hemen temizleyebiliriz veya animasyonun bitmesini bekleyebiliriz
       // Eğer animasyonlar "forwards" ise, bir sonraki show=true'ya kadar kalabilirler.
       // Temizlemek için:
       // setTimeout(() => setBalloons([]), 1000); // Küçük bir gecikmeyle temizle ki fade out olabilsin
       setBalloons([]); // Veya hemen temizle
    }
  }, [show, count, onComplete]);

  if (!show && balloons.length === 0) { // Sadece show false ise ve balon yoksa null dön
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} />
      ))}
    </div>
  );
};
