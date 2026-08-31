import { useRef, useCallback } from "react";

// Fires onLongPress if the pointer is held for `delay`ms without moving away;
// otherwise fires onTap on release. Also treats right-click / long-press-to-
// context-menu as an immediate long-press trigger.
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

  const clear = useCallback(
    (shouldTap) => (e) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (shouldTap && !firedRef.current && onTap) onTap(e);
    },
    [onTap]
  );

  return {
    onPointerDown: start,
    onPointerUp: clear(true),
    onPointerLeave: clear(false),
    onPointerCancel: clear(false),
    onContextMenu: (e) => {
      e.preventDefault();
      if (timerRef.current) clearTimeout(timerRef.current);
      firedRef.current = true;
      onLongPress(e);
    },
  };
}
