import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext'; // Import useDialog
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../utils/authErrors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const registerSchema = z.object({
    email: z.string().email({ message: "E-mail inválido." }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"]
});

export default function Register() {
    const { t } = useTranslation();
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

        const result = registerSchema.safeParse({ email, password, confirmPassword });

        if (!result.success) {
            const firstError = result.error.errors[0].message;
            let errKey = firstError;
            if (firstError.includes('E-mail')) errKey = t('auth.err_invalid_email');
            else if (firstError.includes('coincidem')) errKey = t('auth.err_passwords_match');
            else errKey = t('auth.err_password_length');
            return alert(errKey, t('auth.err_validation'), 'error');
        }

        setLoading(true);
        // setError(null);

        try {
            const { error: signUpError } = await signUp(email, password);
            if (signUpError) throw signUpError;

            setSuccess(true);
        } catch (err) {
            // setError(err.message);
            await alert(getErrorMessage(err, t), t('auth.err_register'), 'error');
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
                    <p className="text-[var(--text-secondary)] text-sm">{t('auth.register_subtitle')}</p>
                </div>

                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-6 rounded-2xl mb-8 shadow-inner">
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-emerald-500/20">
                                ✓
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t('auth.account_created')}</h3>
                            <p className="text-sm opacity-90 leading-relaxed">
                                {t('auth.confirm_link_sent')}
                                <strong className="block text-emerald-400 mt-1">{email}</strong>
                            </p>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-xs mb-8 text-left leading-relaxed shadow-sm">
                            <strong className="block mb-1 flex items-center gap-1">
                                <span className="text-lg">📩</span> {t('auth.attention')}
                            </strong>
                            <span dangerouslySetInnerHTML={{ __html: t('auth.verify_link_msg').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            <br /><br />
                            <span className="italic opacity-80" dangerouslySetInnerHTML={{ __html: t('auth.spam_tip').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                        </div>

                        <Link to="/login" className="block w-full">
                            <Button className="w-full h-11 transition-all hover:scale-[1.02] active:scale-[0.98]" variant="outline">
                                {t('auth.back_to_login')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">{t('auth.email_label')}</label>
                            <Input
                                type="email"
                                placeholder={t('auth.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">{t('auth.password_label')}</label>
                            <Input
                                type="password"
                                placeholder={t('auth.password_placeholder_reg')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">{t('auth.confirm_password_label')}</label>
                            <Input
                                type="password"
                                placeholder={t('auth.confirm_password_placeholder')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-[var(--bg-input)]/50 border-[var(--border-color)]/50 focus:border-[var(--primary)] transition-all"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2" disabled={loading}>
                            {loading ? t('auth.btn_register_loading') : t('auth.btn_register')}
                        </Button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 pt-6 border-t border-[var(--border-color)]/20 text-center text-sm text-[var(--text-secondary)]">
                        {t('auth.already_have_account')}{' '}
                        <Link to="/login" className="text-[var(--primary)] font-bold hover:underline transition-all">
                            {t('auth.do_login')}
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
