import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

export function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return createPortal(
    <div role={type === 'error' ? 'alert' : 'status'} className={`admin-toast admin-toast--${type}`}>{message}</div>,
    document.body
  );
}

export function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} className="admin-modal-dialog" onCancel={onClose}>
      <div className={`admin-modal-panel max-h-[90vh] overflow-y-auto admin-scrollbar ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white dark:bg-[#2f3133] z-10 pb-2 border-b border-outline-variant/30 dark:border-[#3c4a46]">
          <h3 id={titleId} className="text-lg font-semibold text-on-background dark:text-[#f0f0f3]">{title}</h3>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-high dark:hover:bg-[#3c4a46] transition-colors">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body
  );
}
