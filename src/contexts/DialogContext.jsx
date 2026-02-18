import { createContext, useContext, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

const DialogContext = createContext();

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) throw new Error('useDialog must be used within a DialogProvider');
    return context;
};

export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState({
        isOpen: false,
        type: 'info', // 'info', 'success', 'warning', 'error', 'confirm'
        title: '',
        message: '',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const closeDialog = () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
    };

    const showDialog = (options) => {
        setDialog({
            isOpen: true,
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            confirmLabel: options.confirmLabel || 'OK',
            cancelLabel: options.cancelLabel || 'Cancelar',
            onConfirm: options.onConfirm || (() => { }),
            onCancel: options.onCancel || (() => { }),
        });
    };

    // Helper functions for easier usage
    const confirm = (message, title = 'Confirmação') => {
        return new Promise((resolve) => {
            showDialog({
                type: 'confirm',
                title,
                message,
                confirmLabel: 'Confirmar',
                cancelLabel: 'Cancelar',
                onConfirm: () => {
                    resolve(true);
                    closeDialog();
                },
                onCancel: () => {
                    resolve(false);
                    closeDialog();
                },
            });
        });
    };

    const alert = (message, title = 'Atenção', type = 'info') => {
        return new Promise((resolve) => {
            showDialog({
                type,
                title,
                message,
                confirmLabel: 'OK',
                onConfirm: () => {
                    resolve(true);
                    closeDialog();
                },
                // For alerts, cancel/overlay click also resolves
                onCancel: () => {
                    resolve(true);
                    closeDialog();
                }
            });
        });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <AlertTriangle className="text-red-500" size={32} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
            case 'success': return <CheckCircle className="text-emerald-500" size={32} />;
            case 'confirm': return <HelpCircle className="text-[var(--primary)]" size={32} />;
            default: return <Info className="text-blue-500" size={32} />;
        }
    };

    return (
        <DialogContext.Provider value={{ showDialog, closeDialog, confirm, alert }}>
            {children}

            {dialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">

                        <div className="flex flex-col items-center text-center gap-4">
                            {getIcon(dialog.type)}

                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{dialog.title}</h3>
                                <p className="text-[var(--text-secondary)] mt-2">{dialog.message}</p>
                            </div>

                            <div className="flex gap-3 w-full mt-2">
                                {dialog.type === 'confirm' && (
                                    <button
                                        onClick={() => {
                                            dialog.onCancel();
                                            closeDialog();
                                        }}
                                        className="flex-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors font-medium"
                                    >
                                        {dialog.cancelLabel}
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        dialog.onConfirm();
                                        // Only close automatically if it's an alert or plain confirm logic handled by promise wrapper
                                        // But effectively for shared usage we close it here inside the wrapper mostly.
                                        // For custom onConfirm passed via showDialog, we might want user to close it manually? 
                                        // For simplicity, our helpers confirm/alert handle closing.
                                        if (!dialog.type === 'confirm' && !dialog.type === 'alert') closeDialog();
                                    }}
                                    className={clsx(
                                        "flex-1 px-4 py-2 rounded-xl text-white font-medium shadow-lg transition-all",
                                        dialog.type === 'error' ? "bg-red-500 shadow-red-500/20 hover:bg-red-600" :
                                            dialog.type === 'warning' ? "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600" :
                                                dialog.type === 'success' ? "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600" :
                                                    "bg-[var(--primary)] shadow-violet-500/20 hover:bg-violet-600"
                                    )}
                                >
                                    {dialog.confirmLabel}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};
