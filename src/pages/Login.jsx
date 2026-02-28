import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext'; // Import useDialog
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { getErrorMessage } from '../utils/authErrors';
import { Link, useNavigate, Navigate } from 'react-router-dom';

export default function Login() {
    const { signIn, user, loading: authLoading } = useAuth();
    const { alert } = useDialog(); // Get alert
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null); // Remove error state

    if (!authLoading && user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // setError(null);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/');
        } catch (err) {
            // setError(err.message);
            await alert(getErrorMessage(err), 'Erro de Acesso', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
            <Card className="w-full max-w-md p-6 sm:p-8 shadow-2xl backdrop-blur-md bg-[var(--bg-card)]/80 border-[var(--border-color)]/30">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)]/10 mb-4 border border-[var(--primary)]/20 shadow-inner">
                        <span className="text-3xl">💰</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2 text-[var(--text-primary)]">
                        Saldo.io
                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border border-[var(--primary)]/20 shadow-sm">BETA</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm">Acesse o poder de organizar a sua vida financeira</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">E-mail</label>
                        <Input
                            type="email"
                            placeholder="exemplo@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            data-testid="input-email"
                            className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">Senha</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            data-testid="input-password"
                            className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading} data-testid="btn-login">
                        {loading ? 'Acessando...' : 'Entrar na Conta'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--border-color)]/20 text-center text-sm text-[var(--text-secondary)]">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-[var(--primary)] font-bold hover:underline transition-all">
                        Cadastre-se agora
                    </Link>
                </div>
            </Card>
        </div>
    );
}
