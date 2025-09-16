import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureError, addBreadcrumb } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Adiciona breadcrumb antes de capturar o erro
    addBreadcrumb({
      category: 'error',
      message: 'Error Boundary capturou um erro',
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
        url: window.location.href
      }
    });

    // Captura o erro no Sentry com contexto adicional
    captureError(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      source: 'ErrorBoundary'
    });

    // Log detalhado do erro para debug
    console.error('🚨 [ErrorBoundary] Erro capturado:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Salva informações do erro no state
    this.setState({
      error,
      errorInfo
    });

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implementar envio para serviço de monitoramento
    // Por exemplo: Sentry.captureException(error, { extra: errorInfo });
    
    // Por enquanto, apenas log no console
    console.group('📊 [ErrorBoundary] Relatório de Erro');
    console.error('Erro:', error);
    console.error('Informações do Componente:', errorInfo);
    console.error('Stack Trace:', error.stack);
    console.groupEnd();
  };

  private handleRetry = () => {
    console.log('🔄 [ErrorBoundary] Tentando recuperar da falha...');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] via-[#1a4b73] to-[#0f2b45] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            {/* Ícone de Erro */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Ops! Algo deu errado
            </h1>

            {/* Descrição */}
            <p className="text-gray-600 mb-6">
              Encontramos um problema inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalhes do Erro (Dev):</h3>
                <p className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Stack Trace</summary>
                    <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-6 rounded-full hover:brightness-110 transition-all duration-300"
              >
                Tentar Novamente
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-transparent text-[#0f2b45] border-2 border-[#0f2b45] font-bold py-3 px-6 rounded-full hover:bg-[#0f2b45] hover:text-white transition-all duration-300"
              >
                Voltar ao Início
              </button>
            </div>

            {/* Informações de Contato */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Se o problema persistir, entre em contato conosco.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;