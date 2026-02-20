import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext'; // Import useDialog
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
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
            await alert(err.message || 'Erro ao fazer login', 'Erro de Acesso', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">💰 Saldo.io</h1>
                    <p className="text-[var(--text-secondary)]">Entre para acessar suas finanças</p>
                </div>

                {/* Error div removed */}

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
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-[var(--primary)] hover:underline">
                        Cadastre-se
                    </Link>
                </div>
            </Card>
        </div>
    );
}
