import { useState, useEffect, useRef, useCallback } from 'react';

export type TiltAction = 'correct' | 'pass' | null;

interface DeviceTiltOptions {
  onCorrect: () => void;
  onPass: () => void;
  enabled: boolean;
}

export function useDeviceTilt({ onCorrect, onPass, enabled }: DeviceTiltOptions) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentAction, setCurrentAction] = useState<TiltAction>(null);

  // Calibration: device must first be held upright on forehead before actions are allowed
  const hasCalibratedNeutralRef = useRef<boolean>(false);
  const canTriggerRef = useRef<boolean>(false);
  const lastTriggerTimeRef = useRef<number>(0);
  const neutralDwellTimerRef = useRef<number>(0);

  // Request iOS motion & orientation permissions on user gesture
  const requestSensorPermission = useCallback(async (): Promise<boolean> => {
    try {
      let granted = true;

      // 1. DeviceOrientation permission (iOS 13+)
      if (
        typeof window !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        granted = granted && perm === 'granted';
      }

      // 2. DeviceMotion permission (iOS 13+)
      if (
        typeof window !== 'undefined' &&
        typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        granted = granted && perm === 'granted';
      }

      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.warn('Orientation/Motion permission failed:', err);
      setHasPermission(true);
      return true;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      hasCalibratedNeutralRef.current = false;
      canTriggerRef.current = false;
      neutralDwellTimerRef.current = 0;
      return;
    }

    // Reset calibration on each new word / round enable
    hasCalibratedNeutralRef.current = false;
    canTriggerRef.current = false;
    neutralDwellTimerRef.current = 0;

    let motionDetected = false;

    // Primary Handler: DeviceMotionEvent.accelerationIncludingGravity (Z axis)
    // When held against forehead facing outwards:
    // - Upright against forehead: Z is near 0 (|Z| < 2.5 m/s^2)
    // - Tilt BACK / UP (looking at ceiling): Z becomes strongly NEGATIVE (Z < -4.2) -> CORRECT!
    // - Tilt FRONT / DOWN (looking at floor): Z becomes strongly POSITIVE (Z > 4.2) -> PASS!
    const handleMotion = (e: DeviceMotionEvent) => {
      const gravity = e.accelerationIncludingGravity;
      if (!gravity || gravity.z === null || gravity.z === undefined) return;

      motionDetected = true;
      const z = gravity.z;
      const now = Date.now();

      // Check if device is in neutral upright forehead position (|z| < 2.8)
      const isNeutral = Math.abs(z) < 2.8;

      if (isNeutral) {
        if (!hasCalibratedNeutralRef.current) {
          // Device has been placed upright on forehead!
          hasCalibratedNeutralRef.current = true;
          canTriggerRef.current = true;
          neutralDwellTimerRef.current = now;
        } else {
          // Returning to neutral re-enables triggering once dwell time passes
          if (now - lastTriggerTimeRef.current > 750) {
            canTriggerRef.current = true;
          }
        }
        return;
      }

      // If not yet calibrated in neutral position, do not trigger anything!
      if (!hasCalibratedNeutralRef.current || !canTriggerRef.current) {
        return;
      }

      // Debounce between actions (at least 800ms)
      if (now - lastTriggerTimeRef.current < 800) {
        return;
      }

      // Tilt Back / Up (Looking at sky) -> CORRECT
      if (z < -4.2) {
        canTriggerRef.current = false;
        lastTriggerTimeRef.current = now;
        setCurrentAction('correct');
        onCorrect();

        setTimeout(() => {
          setCurrentAction(null);
        }, 500);
      }
      // Tilt Front / Down (Nodding toward floor) -> PASS
      else if (z > 4.2) {
        canTriggerRef.current = false;
        lastTriggerTimeRef.current = now;
        setCurrentAction('pass');
        onPass();

        setTimeout(() => {
          setCurrentAction(null);
        }, 500);
      }
    };

    // Secondary fallback handler: DeviceOrientationEvent (only if devicemotion didn't fire)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (motionDetected) return; // Prefer motion gravity

      const beta = e.beta;
      const gamma = e.gamma;
      if (beta === null && gamma === null) return;

      const now = Date.now();

      // In landscape against forehead:
      // Neutral upright: screen faces forward, gamma is near 0 (|gamma| < 20)
      // Tilt back/up: gamma > 40
      // Tilt front/down: gamma < -40
      const isNeutral = gamma !== null && Math.abs(gamma) < 20;

      if (isNeutral) {
        hasCalibratedNeutralRef.current = true;
        if (now - lastTriggerTimeRef.current > 750) {
          canTriggerRef.current = true;
        }
        return;
      }

      if (!hasCalibratedNeutralRef.current || !canTriggerRef.current) return;
      if (now - lastTriggerTimeRef.current < 800) return;

      if (gamma !== null && gamma > 40) {
        canTriggerRef.current = false;
        lastTriggerTimeRef.current = now;
        setCurrentAction('correct');
        onCorrect();
        setTimeout(() => setCurrentAction(null), 500);
      } else if (gamma !== null && gamma < -40) {
        canTriggerRef.current = false;
        lastTriggerTimeRef.current = now;
        setCurrentAction('pass');
        onPass();
        setTimeout(() => setCurrentAction(null), 500);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, onCorrect, onPass]);

  return {
    hasPermission,
    currentAction,
    requestSensorPermission,
  };
}
