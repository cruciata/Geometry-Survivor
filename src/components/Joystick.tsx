import React, { useState, useEffect, useRef } from 'react';

interface JoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setBasePos({ x: clientX, y: clientY });
    setStickPos({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const dx = clientX - basePos.x;
    const dy = clientY - basePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50;

    let finalX = clientX;
    let finalY = clientY;

    if (dist > maxDist) {
      finalX = basePos.x + (dx / dist) * maxDist;
      finalY = basePos.y + (dy / dist) * maxDist;
    }

    setStickPos({ x: finalX, y: finalY });

    const normX = (finalX - basePos.x) / maxDist;
    const normY = (finalY - basePos.y) / maxDist;
    onMove({ x: normX, y: normY });
  };

  const handleEnd = () => {
    setIsDragging(false);
    onMove({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, basePos]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 touch-none"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {isDragging && containerRef.current && (
        (() => {
          const rect = containerRef.current.getBoundingClientRect();
          const scaleX = 750 / rect.width;
          const scaleY = (1334 - 70) / rect.height; // Account for the top offset in App.tsx
          
          return (
            <>
              <div 
                className="absolute w-32 h-32 bg-white/10 border-2 border-white/20 rounded-full pointer-events-none"
                style={{ 
                  left: (basePos.x - rect.left) * scaleX - 64, 
                  top: (basePos.y - rect.top) * scaleY - 64 
                }}
              />
              <div 
                className="absolute w-16 h-16 bg-white/40 rounded-full pointer-events-none shadow-lg"
                style={{ 
                  left: (stickPos.x - rect.left) * scaleX - 32, 
                  top: (stickPos.y - rect.top) * scaleY - 32 
                }}
              />
            </>
          );
        })()
      )}
    </div>
  );
};
