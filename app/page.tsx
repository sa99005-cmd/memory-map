'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Pin } from '@/components/types';
import { MapPin } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-cream-white rounded-2xl border-4 border-white">
      <div className="text-sage-green animate-pulse flex flex-col items-center gap-2">
        <MapPin size={40} />
        <span className="font-bold">지도 불러오는 중...</span>
      </div>
    </div>
  ),
});



export default function Home() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [focusedPin, setFocusedPin] = useState<Pin | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('memory-map-pins');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPins(parsed);
      } catch (e) {
        console.error("Failed to parse pins from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever pins change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('memory-map-pins', JSON.stringify(pins));
    }
  }, [pins, isLoaded]);

  const handleCountryClick = (lat: number, lng: number, zoom: number) => {
    setFlyToLocation({ lat, lng, zoom });
  };

  const handleAddPin = (newPin: Pin) => {
    const updatedPins = [newPin, ...pins];
    setPins(updatedPins);
  };

  const handleDeletePin = (id: number) => {
    const updatedPins = pins.filter(pin => pin.id !== id);
    setPins(updatedPins);
    if (focusedPin?.id === id) {
      setFocusedPin(null);
    }
  };

  const handlePinClick = (pin: Pin) => {
    setFocusedPin(pin);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-sage-green mb-2 flex items-center gap-2">
            <MapPin className="text-sage-green" fill="#F9F9F5" size={36} />
            Memory Map
          </h1>
          <p className="text-gray-500 font-medium">당신의 발자취를 지도 위에 남겨보세요.</p>
        </div>
        <div className="text-xs text-gray-400 mt-2 md:mt-0 font-light">
          Beta v1.0 • Built with ❤️
        </div>
      </header>

      {/* Content Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 md:h-[calc(100vh-200px)] h-auto">
        {/* Map Area (Fixed height on mobile, flexible on desktop) */}
        <div className="w-full h-[60vh] md:h-auto md:flex-[2.5] relative shadow-sm">
          <MapComponent
            pins={pins}
            onAddPin={handleAddPin}
            focusedPin={focusedPin}
            onDeletePin={handleDeletePin}
            flyToLocation={flyToLocation}
          />
        </div>

        {/* Sidebar Area */}
        <aside className="md:flex-1 h-full relative">
          <Sidebar
            pins={pins}
            onPinClick={handlePinClick}
            onDeletePin={handleDeletePin}
            onCountryClick={handleCountryClick}
          />
        </aside>
      </div>
    </main>
  );
}
