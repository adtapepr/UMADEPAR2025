import { useEffect, useRef } from 'react';

export const useCustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Criar elemento do cursor
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    cursorRef.current = cursor;

    // Função para mover o cursor
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };

    // Função para hover em elementos interativos
    const handleMouseEnter = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.add('hover');
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.remove('hover');
      }
    };

    // Função para clique
    const handleMouseDown = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.add('click');
      }
    };

    const handleMouseUp = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.remove('click');
      }
    };

    // Adicionar event listeners
    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Adicionar listeners para elementos interativos
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });

    // Observer para novos elementos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const newInteractiveElements = element.querySelectorAll('a, button, [role="button"], input, textarea, select');
            newInteractiveElements.forEach(el => {
              el.addEventListener('mouseenter', handleMouseEnter);
              el.addEventListener('mouseleave', handleMouseLeave);
            });
            
            // Verificar se o próprio elemento é interativo
            if (element.matches('a, button, [role="button"], input, textarea, select')) {
              element.addEventListener('mouseenter', handleMouseEnter);
              element.addEventListener('mouseleave', handleMouseLeave);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
      
      observer.disconnect();
      
      if (cursorRef.current && document.body.contains(cursorRef.current)) {
        document.body.removeChild(cursorRef.current);
      }
    };
  }, []);

  return cursorRef;
};