import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
                    <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado.</h1>
                    <p className="mb-4 text-[var(--text-secondary)]">
                        Houve um problema ao carregar a página. Isso pode acontecer devido a extensões do navegador (como tradutores) ou falha na conexão.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
