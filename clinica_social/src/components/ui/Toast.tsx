import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // OVERRIDE GLOBAL ALERT
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      // Basic heuristic to figure out success vs error from legacy string
      const lower = message.toLowerCase();
      let type: ToastType = 'info';
      if (lower.includes('sucesso') || lower.includes('criado') || lower.includes('atualizado') || lower.includes('removido') || lower.includes('excluído')) {
        type = 'success';
      } else if (lower.includes('erro') || lower.includes('falhou') || lower.includes('obrigatório')) {
        type = 'error';
      }
      addToast(message, type);
    };

    return () => {
      window.alert = originalAlert; // cleanup
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-[400px] p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-8 duration-300
              ${t.type === 'success' ? 'bg-white border-l-4 border-green-500 text-slate-800' : ''}
              ${t.type === 'error' ? 'bg-white border-l-4 border-red-500 text-slate-800' : ''}
              ${t.type === 'info' ? 'bg-white border-l-4 border-blue-500 text-slate-800' : ''}
              ${t.type === 'warning' ? 'bg-white border-l-4 border-yellow-500 text-slate-800' : ''}
            `}
          >
            {t.type === 'success' && <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {t.type === 'error' && <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {t.type === 'info' && <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {t.type === 'warning' && <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            
            <p className="text-sm font-semibold flex-1">{t.message}</p>
            
            <button
                onClick={() => setToasts(toasts.filter(x => x.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
