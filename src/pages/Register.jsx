import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext'; // Import useDialog
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const { signUp } = useAuth();
    const { alert } = useDialog(); // Get alert
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null); // Remove error state
    const [success, setSuccess] = useState(false);

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
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">💰 Saldo.io</h1>
                    <p className="text-[var(--text-secondary)]">Crie sua conta gratuita</p>
                </div>

                {/* Error div removed */}

                {success ? (
                    <div className="text-center">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-lg mb-6">
                            <h3 className="font-bold mb-2">Conta criada com sucesso!</h3>
                            <p>Verifique seu e-mail para confirmar o cadastro.</p>
                        </div>
                        <Link to="/login">
                            <Button className="w-full">Ir para Login</Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                placeholder="Seu e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Senha (mínimo 6 caracteres)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Confirme sua senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Cadastrar'}
                        </Button>
                    </form>
                )}

                {!success && (
                    <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-[var(--primary)] hover:underline">
                            Fazer Login
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
