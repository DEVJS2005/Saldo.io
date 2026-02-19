import { Wallet } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg animate-pulse">
                    <Wallet className="text-white animate-bounce" size={32} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--bg-primary)] animate-ping"></div>
            </div>
            <h2 className="mt-6 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-pulse">
                Carregando Saldo.io...
            </h2>
        </div>
    );
}
