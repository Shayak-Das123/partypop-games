import { useEffect, useRef, useCallback, useState } from 'react';

interface UseDeviceMotionPassProps {
  onPass: () => void;
  enabled: boolean;
  cooldownMs?: number;
}

export function useDeviceMotionPass({
  onPass,
  enabled,
  cooldownMs = 1200,
}: UseDeviceMotionPassProps) {
  const lastPassTimeRef = useRef<number>(0);
  const lastAccelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 9.8 });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const onPassRef = useRef(onPass);
  onPassRef.current = onPass;

  // Request motion permission (iOS 13+ requirement)
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        const granted = response === 'granted';
        setPermissionGranted(granted);
        return granted;
      } catch (err) {
        console.warn('DeviceMotionEvent permission error:', err);
        return false;
      }
    }
    setPermissionGranted(true);
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity || event.acceleration;
      if (!accel || accel.x === null || accel.y === null || accel.z === null) {
        return;
      }

      const now = Date.now();
      if (now - lastPassTimeRef.current < cooldownMs) {
        // In cooldown period immediately after a pass
        lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };
        return;
      }

      const prev = lastAccelRef.current;
      const dx = accel.x - prev.x;
      const dy = accel.y - prev.y;
      const dz = accel.z - prev.z;

      // Jerk: rate of change of acceleration (captures physical pass / handoff gesture)
      const jerk = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Total instantaneous acceleration magnitude
      const totalAccel = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);

      lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };

      // Passing gesture threshold:
      // When handing phone to someone, jerk exceeds 11 m/s^2 or acceleration peaks above 15 m/s^2
      if (jerk > 11.5 || totalAccel > 16.5) {
        lastPassTimeRef.current = now;
        onPassRef.current();
      }
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, cooldownMs]);

  return {
    requestMotionPermission,
    permissionGranted,
  };
}
