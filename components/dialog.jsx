'use client';
import { useEffect, useRef } from 'react';
export default function Dialog({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    const siblings = [...dialog.parentElement.parentElement.children].filter(element => element !== dialog.parentElement);
    const previousInert = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    const controls = () => [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')];
    controls()[0]?.focus();
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key === 'Tab') {
        const items = controls(), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); siblings.forEach((element, i) => { element.inert = previousInert[i]; }); if (previous?.isConnected) previous.focus?.({ preventScroll: true }); };
  }, []);
  return <div className="dialog-backdrop" onClick={onClose}><section ref={ref} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()}><div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}
