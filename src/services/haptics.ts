// Tactile Web Haptics Engine

class HapticsEngine {
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;
  }

  // Light click for button taps & drag ticks
  public light() {
    if (this.isSupported) {
      navigator.vibrate(15);
    }
  }

  // Medium thud for card snap or selection
  public medium() {
    if (this.isSupported) {
      navigator.vibrate(35);
    }
  }

  // Heavy buzz for imposter reveal / alert
  public heavy() {
    if (this.isSupported) {
      navigator.vibrate(70);
    }
  }

  // Success double-pulse (correct guess)
  public success() {
    if (this.isSupported) {
      navigator.vibrate([25, 50, 40]);
    }
  }

  // Warning pulse (pass or error)
  public warning() {
    if (this.isSupported) {
      navigator.vibrate([40, 40, 80]);
    }
  }

  // Dramatic drumroll flutter
  public flutter() {
    if (this.isSupported) {
      navigator.vibrate([15, 30, 15, 30, 25]);
    }
  }
}

export const haptics = new HapticsEngine();
