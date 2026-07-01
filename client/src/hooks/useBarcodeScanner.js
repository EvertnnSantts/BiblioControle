import { useState, useRef, useEffect, useCallback } from 'react';

export function useBarcodeScanner(onScan) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Foca automaticamente ao montar a tela
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = value.trim();
      if (code) {
        onScan(code);
        setValue('');
      }
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return {
    value,
    setValue,
    inputRef,
    handleChange,
    handleKeyDown,
    focusInput
  };
}

export default useBarcodeScanner;
