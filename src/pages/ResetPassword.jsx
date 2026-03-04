import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ResetPassword() {
    const { t } = useTranslation();
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
                await alert(t('auth.err_invalid_session'), t('errors.title_error'), 'error');
                navigate('/login');
            }
        };
        checkSession();
    }, [navigate, alert]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return alert(t('auth.err_passwords_match'), t('errors.title_attention'), 'warning');
        }

        if (password.length < 6) {
            return alert(t('auth.err_new_password_length'), t('errors.title_attention'), 'warning');
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            await alert(t('auth.password_updated'), t('errors.title_success'), 'success');
            navigate('/'); // Redirect to dashboard since they are logged in now

        } catch (err) {
            console.error('Error updating password:', err);
            await alert(err.message || t('auth.err_reset_password'), t('errors.title_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]">
            <Card className="w-full max-w-md p-6 sm:p-8 shadow-2xl backdrop-blur-md bg-[var(--bg-card)]/80 border-[var(--border-color)]/30">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">{t('auth.reset_password_title')}</h1>
                    <p className="text-[var(--text-secondary)] text-sm">{t('auth.reset_password_desc')}</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">{t('settings.new_password')}</label>
                        <Input
                            type="password"
                            placeholder={t('auth.password_placeholder_reg')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-[var(--bg-input)]/50 focus:border-[var(--primary)] transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-muted)] ml-1">{t('auth.confirm_new_password_label')}</label>
                        <Input
                            type="password"
                            placeholder={t('auth.confirm_password_placeholder')}
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
                        {loading ? t('auth.btn_updating') : t('auth.btn_update_password')}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
