// Fullscreen Service for PartyPop

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export async function enterFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (isFullscreen()) return true;

  const docEl = document.documentElement as any;
  try {
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
      return true;
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
      return true;
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
      return true;
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    // Browser may reject if no user gesture was present
  }
  return false;
}

export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (!isFullscreen()) return true;

  const doc = document as any;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return true;
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
      return true;
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
      return true;
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
      return true;
    }
  } catch (err) {}
  return false;
}

export async function toggleFullscreen(): Promise<boolean> {
  if (isFullscreen()) {
    return exitFullscreen();
  } else {
    return enterFullscreen();
  }
}
