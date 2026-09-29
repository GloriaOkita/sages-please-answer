import { useRef } from "react";

export function useEdgeSwipe(onOpen, edge = 24, threshold = 70) {
  const start = useRef(null);

  return {
    onTouchStart(event) {
      const touch = event.touches[0];
      start.current = touch.clientX <= edge ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd(event) {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.current.x;
      const deltaY = Math.abs(touch.clientY - start.current.y);
      if (deltaX >= threshold && deltaY < 55) onOpen();
      start.current = null;
    },
  };
}
