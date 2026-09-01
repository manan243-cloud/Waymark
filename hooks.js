import { useRef, useState, useCallback } from "react";

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

// Swipe-right to mark done, swipe-left to open the menu. Returns a live
// pixel `offset` to drive a sliding visual, plus pointer handlers. Vertical
// drags (scrolling) are detected early and release the gesture so page
// scroll isn't blocked.
export function useSwipe(onSwipeRight, onSwipeLeft, threshold = 72) {
  const [offset, setOffset] = useState(0);
  const start = useRef(null);
  const active = useRef(false);
  const vertical = useRef(false);

  const onPointerDown = useCallback((e) => {
    start.current = { x: e.clientX, y: e.clientY };
    active.current = true;
    vertical.current = false;
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!active.current || !start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!vertical.current && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
      vertical.current = true;
      active.current = false;
      setOffset(0);
      return;
    }
    if (vertical.current) return;
    setOffset(Math.max(-100, Math.min(100, dx)));
  }, []);

  const finish = useCallback(() => {
    if (!active.current) {
      active.current = false;
      return;
    }
    active.current = false;
    if (offset >= threshold) onSwipeRight && onSwipeRight();
    else if (offset <= -threshold) onSwipeLeft && onSwipeLeft();
    setOffset(0);
  }, [offset, threshold, onSwipeRight, onSwipeLeft]);

  return {
    offset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: () => { active.current = false; setOffset(0); },
      onPointerLeave: () => { if (active.current) finish(); },
    },
  };
}
