"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';


type Coordinates = [number, number];

type LocationContextProps = {
  location: Coordinates;
  setLocation: (coords: Coordinates) => void;
  error: string | null;
  setError: (msg: string | null) => void;
};

const defaultLocation: Coordinates = [-1.2921, 36.8219]; // Nairobi fallback

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<Coordinates>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('location') : null;
    return stored ? JSON.parse(stored) : defaultLocation;
  });
  const [error, setError] = useState<string | null>(null);

  // Persist location changes
  useEffect(() => {
    localStorage.setItem('location', JSON.stringify(location));
  }, [location]);

  return (
    <LocationContext.Provider value={{ location, setLocation, error, setError }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextProps => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
};
