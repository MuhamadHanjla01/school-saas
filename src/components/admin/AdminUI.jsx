import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return createPortal(
    <div className={`admin-toast admin-toast--${type}`}>{message}</div>,
    document.body
  );
}

export function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-panel max-h-[90vh] overflow-y-auto admin-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white dark:bg-[#2f3133] z-10 pb-2 border-b border-outline-variant/30 dark:border-[#3c4a46]">
          <h3 className="text-lg font-semibold text-on-background dark:text-[#f0f0f3]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-high dark:hover:bg-[#3c4a46] transition-colors">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
