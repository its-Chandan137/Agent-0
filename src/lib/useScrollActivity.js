import { useEffect, useRef, useState } from 'react';

export function useScrollActivity(idleDelay = 700) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef(null);

  function handleScroll() {
    setIsScrolling(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, idleDelay);
  }

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    isScrolling,
    handleScroll,
  };
}
