import { useState, useEffect } from 'react';

export type TimeMode = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

const getTimeMode = (): TimeMode => {
  const hour = new Date().getHours();
  // Morning: 05:00 AM - 11:59 AM
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  // Noon: 12:00 PM - 01:59 PM
  if (hour >= 12 && hour < 14) {
    return 'noon';
  }
  // Afternoon: 02:00 PM - 04:59 PM
  if (hour >= 14 && hour < 17) {
    return 'afternoon';
  }
  // Evening: 05:00 PM - 06:59 PM
  if (hour >= 17 && hour < 19) {
    return 'evening';
  }
  // Night: 07:00 PM - 04:59 AM
  return 'night';
};

export const useDayTime = (): TimeMode => {
  const [timeMode, setTimeMode] = useState<TimeMode>(getTimeMode());

  useEffect(() => {
    // Check every minute to see if the time mode has changed
    const interval = setInterval(() => {
      const newMode = getTimeMode();
      if (newMode !== timeMode) {
        setTimeMode(newMode);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [timeMode]);

  return timeMode;
};
