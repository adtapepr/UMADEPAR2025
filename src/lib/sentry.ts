import * as Sentry from '@sentry/react';

// Configuração do Sentry
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Inicializa o Sentry apenas se o DSN estiver configurado
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    
    // Configurações de performance
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Filtros de erro
    beforeSend(event, hint) {
      // Filtra erros de desenvolvimento
      if (ENVIRONMENT === 'development') {
        console.log('Sentry Event:', event);
      }
      
      // Filtra erros conhecidos que não são críticos
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Ignora erros de rede temporários
        if (message.includes('Network Error') || message.includes('fetch')) {
          return null;
        }
        
        // Ignora erros de extensões do navegador
        if (message.includes('Extension context invalidated')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Configurações de contexto
    initialScope: {
      tags: {
        component: 'umadepar-frontend',
      },
    },
  });
  
  console.log('🔍 Sentry inicializado:', {
    environment: ENVIRONMENT,
    release: RELEASE,
    dsn_configured: !!SENTRY_DSN
  });
} else {
  console.warn('⚠️ Sentry DSN não configurado. Rastreamento de erros desabilitado.');
}

// Funções utilitárias para captura de erros
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        source: 'manual_capture',
      },
    });
  } else {
    console.error('Error captured (Sentry disabled):', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
    if (context) {
      Sentry.setContext('message_context', context);
    }
  } else {
    console.log(`Message captured (Sentry disabled) [${level}]:`, message, context);
  }
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  } else {
    console.log('Breadcrumb added (Sentry disabled):', breadcrumb);
  }
};

export const setUserContext = (user: { id?: string; email?: string; username?: string }) => {
  if (SENTRY_DSN) {
    Sentry.setUser(user);
  } else {
    console.log('User context set (Sentry disabled):', user);
  }
};

export const setExtraContext = (key: string, value: any) => {
  if (SENTRY_DSN) {
    Sentry.setContext(key, value);
  } else {
    console.log(`Extra context set (Sentry disabled) [${key}]:`, value);
  }
};

// Alias para setExtraContext para compatibilidade
export const setContext = setExtraContext;

// Exporta o Sentry para uso direto quando necessário
export { Sentry };