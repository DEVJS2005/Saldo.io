import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
    const { alert } = useDialog();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Safety check - we should only be here if we have a valid session via the recovery link
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                await alert('Sessão de recuperação inválida ou expirada. Solicite um novo link.', 'Erro', 'error');
                navigate('/login');
            }
        };
        checkSession();
    }, [navigate, alert]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return alert('As senhas não coincidem.', 'Atenção', 'warning');
        }

        if (password.length < 6) {
            return alert('A nova senha deve ter pelo menos 6 caracteres.', 'Atenção', 'warning');
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            await alert('Sua senha foi atualizada com sucesso!', 'Sucesso', 'success');
            navigate('/'); // Redirect to dashboard since they are logged in now

        } catch (err) {
            console.error('Error updating password:', err);
            await alert(err.message || 'Erro ao redefinir a senha.', 'Erro', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
            <Card className="w-full max-w-md p-6 sm:p-8 shadow-2xl backdrop-blur-md bg-[var(--bg-card)]/80 border-[var(--border-color)]/30">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Redefinir Senha</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Digite sua nova senha abaixo.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">Nova Senha</label>
                        <Input
                            type="password"
                            placeholder="Mínimo de 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-[var(--bg-input)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">Confirmar Nova Senha</label>
                        <Input
                            type="password"
                            placeholder="Repita a nova senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-[var(--bg-input)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-bold shadow-lg shadow-[var(--primary)]/20 transition-all"
                        disabled={loading}
                    >
                        {loading ? 'Atualizando...' : 'Atualizar Senha'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
