import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan) {
  const bufferRef = useRef('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter key indicates end of scan
      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code && code.length > 3) {
          e.preventDefault();
          onScan(code);
          bufferRef.current = '';
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
        bufferRef.current = '';
        return;
      }

      // Collect only single characters (printable characters)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set a timeout to clear the buffer if no character is typed within 50ms
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}

export default useBarcodeScanner;
