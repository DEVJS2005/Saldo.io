import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext'; // Import useDialog
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate, Navigate } from 'react-router-dom';

export default function Register() {
    const { signUp, user, loading: authLoading } = useAuth();
    const { alert } = useDialog(); // Get alert
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null); // Remove error state
    const [success, setSuccess] = useState(false);

    if (!authLoading && user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return alert('As senhas não coincidem.', 'Erro de Validação', 'error');
        }

        setLoading(true);
        // setError(null);

        try {
            const { error: signUpError } = await signUp(email, password);
            if (signUpError) throw signUpError;

            setSuccess(true);
        } catch (err) {
            // setError(err.message);
            await alert(err.message || 'Erro ao criar conta', 'Erro de Cadastro', 'error');
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
                    <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Saldo.io</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Crie sua conta gratuita e comece agora</p>
                </div>

                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-6 rounded-2xl mb-8 shadow-inner">
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-emerald-500/20">
                                ✓
                            </div>
                            <h3 className="text-xl font-bold mb-3">Conta criada!</h3>
                            <p className="text-sm opacity-90 leading-relaxed">
                                Enviamos um link de confirmação para:
                                <strong className="block text-emerald-400 mt-1">{email}</strong>
                            </p>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-xs mb-8 text-left leading-relaxed">
                            <strong className="block mb-1">⚠️ Atenção:</strong>
                            Você deve clicar no link enviado ao seu e-mail para ativar sua conta antes de tentar o login.
                        </div>

                        <Link to="/login" className="block w-full">
                            <Button className="w-full h-11" variant="outline">
                                Voltar para o Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">E-mail</label>
                            <Input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">Senha</label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">Confirmar Senha</label>
                            <Input
                                type="password"
                                placeholder="Repita sua senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Criar minha Conta'}
                        </Button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 pt-6 border-t border-[var(--border-color)]/20 text-center text-sm text-[var(--text-secondary)]">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-[var(--primary)] font-bold hover:underline transition-all">
                            Fazer Login
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
