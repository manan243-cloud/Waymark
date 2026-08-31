import { useRef, useCallback } from "react";

// Long-press to open a menu, plain tap otherwise. Tap detection uses the
// browser's native "click" event (fires reliably even with the small finger
// movement that's normal on a touchscreen) rather than pointerup — pointer
// events get cancelled too easily on real devices and were swallowing taps.
export function useLongPress(onLongPress, onTap, delay = 450) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const start = useCallback(
    (e) => {
      firedRef.current = false;
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay]
  );

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(
    (e) => {
      if (firedRef.current) {
        // This click is the tail end of a long-press — ignore it.
        firedRef.current = false;
        return;
      }
      if (onTap) onTap(e);
    },
    [onTap]
  );

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      cancelTimer();
      firedRef.current = true;
      onLongPress(e);
    },
    [onLongPress, cancelTimer]
  );

  return {
    onPointerDown: start,
    onPointerUp: cancelTimer,
    onPointerLeave: cancelTimer,
    onPointerCancel: cancelTimer,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}
