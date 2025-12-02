import { useEffect } from 'react';

export function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (isOpen) {
      
      const scrollY = window.scrollY;
      
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('menu-open');
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('menu-open');
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
}