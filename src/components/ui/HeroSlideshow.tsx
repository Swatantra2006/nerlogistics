'use client';

import { useState, useEffect } from 'react';

const defaultImages = [
  'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=2000&q=80', // Bridge
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2000&q=80', // Trucks
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80', // Mountain road
  'https://images.unsplash.com/photo-1541888087401-d5dc1b369fb0?auto=format&fit=crop&w=2000&q=80'  // Construction
];

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % defaultImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-surface-950">
      {defaultImages.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-70' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${src}')`,
            // Optional: slight scale animation for a "Ken Burns" effect
            transform: index === currentIndex ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 1s ease-in-out, transform 6s ease-in-out',
          }}
        />
      ))}
      {/* Gradient overlay to ensure text remains readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950/40 via-surface-950/30 to-surface-950/90" />
      <div className="absolute inset-0 bg-primary-500/10 mix-blend-overlay" />
    </div>
  );
}
