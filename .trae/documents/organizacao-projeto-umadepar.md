# Documento de Organização do Projeto - UMADEPAR 2025

## 1. Estrutura de Arquivos Proposta

```
umadepar-2025/
├── public/
│   ├── images/
│   │   ├── logo-umadepar.png
│   │   ├── hero-background.jpg
│   │   └── camiseta-mockups/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Modal.jsx
│   │   ├── forms/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── CheckoutForm.jsx
│   │   ├── dashboard/
│   │   │   ├── KPICards.jsx
│   │   │   ├── SalesTable.jsx
│   │   │   ├── LabelGenerator.jsx
│   │   │   └── Charts.jsx
│   │   └── product/
│   │       ├── ProductCarousel.jsx
│   │       ├── SizeSelector.jsx
│   │       └── QuantitySelector.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── VendaIndividual.jsx
│   │   ├── VendaGrupo.jsx
│   │   ├── Dashboard.jsx
│   │   └── Profile.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSupabase.js
│   │   └── useLocalStorage.js
│   ├── services/
│   │   ├── supabase.js
│   │   ├── authService.js
│   │   ├── orderService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .env.local
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 2. Migração do Protótipo

### 2.1 Análise do Código Atual
**Arquivos Existentes:**
- `dashboard-amd`: Dashboard administrativo completo em HTML/JS
- `home`: Página inicial institucional
- `login`: Sistema de autenticação com múltiplas etapas
- `venda-jovem`: Página de venda individual
- `venda-lider`: Página de venda em grupo

**Pontos Fortes Identificados:**
- Design system consistente com cores e tipografia definidas
- Funcionalidades completas de dashboard com KPIs e relatórios
- Sistema de etiquetas com preview e impressão
- Formulários responsivos e bem estruturados
- Integração com bibliotecas externas (Chart.js, Swiper, jsPDF)

**Melhorias Necessárias:**
- Migrar de HTML estático para React components
- Implementar autenticação real com Supabase
- Substituir dados mock por API real
- Adicionar validações de formulário
- Implementar roteamento com React Router
- Adicionar tratamento de erros e loading states

### 2.2 Plano de Migração

**Fase 1: Setup e Estrutura Base**
1. Criar projeto React com Vite
2. Configurar TailwindCSS
3. Setup do Supabase
4. Criar estrutura de pastas
5. Configurar roteamento

**Fase 2: Componentes Base**
1. Migrar Header e Footer
2. Criar sistema de autenticação
3. Implementar páginas principais
4. Configurar contextos (Auth, Theme)

**Fase 3: Funcionalidades Específicas**
1. Sistema de vendas individual
2. Sistema de vendas em grupo
3. Dashboard administrativo
4. Gerador de etiquetas
5. Relatórios e exportação

**Fase 4: Polimento e Deploy**
1. Testes e validações
2. Otimizações de performance
3. Deploy na Vercel
4. Configuração de domínio

## 3. Padrões de Desenvolvimento

### 3.1 Convenções de Nomenclatura
- **Componentes**: PascalCase (ex: `ProductCarousel.jsx`)
- **Hooks**: camelCase com prefixo 'use' (ex: `useAuth.js`)
- **Services**: camelCase com sufixo 'Service' (ex: `authService.js`)
- **Constants**: UPPER_SNAKE_CASE (ex: `API_ENDPOINTS`)
- **CSS Classes**: kebab-case seguindo BEM quando necessário

### 3.2 Estrutura de Componentes
```jsx
// Exemplo de estrutura padrão
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2, ...props }) => {
  // 1. Hooks de estado
  const [state, setState] = useState(initialValue);
  
  // 2. Hooks de efeito
  useEffect(() => {
    // effect logic
  }, [dependencies]);
  
  // 3. Handlers
  const handleAction = () => {
    // handler logic
  };
  
  // 4. Render
  return (
    <div className="component-wrapper" {...props}>
      {/* JSX content */}
    </div>
  );
};

// 5. PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// 6. Default props
ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

### 3.3 Gerenciamento de Estado
- **Estado Local**: useState para componentes simples
- **Estado Global**: Context API para autenticação e tema
- **Estado do Servidor**: React Query para cache e sincronização
- **Formulários**: React Hook Form para validação e performance

### 3.4 Tratamento de Erros
```jsx
// Error Boundary para captura de erros
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 4. Configurações Essenciais

### 4.1 Variáveis de Ambiente
```env
# .env.example
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=UMADEPAR 2025
VITE_APP_VERSION=1.0.0
```

### 4.2 Configuração do Tailwind
```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#0f2b45',
        'gold': '#edbe66',
        'light-gray': '#d9d9d9',
        'off-white': '#f7fafc',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
```

### 4.3 Configuração do Vite
```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

## 5. Dependências Principais

### 5.1 Dependências de Produção
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-hook-form": "^7.43.0",
    "react-query": "^3.39.0",
    "chart.js": "^4.2.0",
    "react-chartjs-2": "^5.2.0",
    "swiper": "^11.0.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.23",
    "aos": "^2.3.4",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.263.0"
  }
}
```

### 5.2 Dependências de Desenvolvimento
```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.1.0",
    "tailwindcss": "^3.2.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "eslint": "^8.35.0",
    "eslint-plugin-react": "^7.32.0",
    "prettier": "^2.8.0"
  }
}
```

## 6. Scripts de Desenvolvimento

### 6.1 Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write src/**/*.{js,jsx,css,md}",
    "type-check": "tsc --noEmit"
  }
}
```

### 6.2 Comandos de Setup
```bash
# Criar projeto
npm create vite@latest umadepar-2025 -- --template react
cd umadepar-2025

# Instalar dependências
npm install

# Instalar TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Instalar dependências específicas
npm install @supabase/supabase-js react-router-dom react-hook-form
npm install chart.js react-chartjs-2 swiper jspdf aos

# Iniciar desenvolvimento
npm run dev
```

## 7. Próximos Passos

1. **Setup Inicial**: Criar projeto React e configurar ambiente
2. **Migração Gradual**: Converter páginas HTML para componentes React
3. **Integração Supabase**: Implementar autenticação e banco de dados
4. **Testes**: Adicionar testes unitários e de integração
5. **Deploy**: Configurar CI/CD e deploy automático
6. **Monitoramento**: Implementar analytics e error tracking

Este documento serve como guia para transformar o protótipo atual em uma aplicação React moderna, mantendo todas as funcionalidades existentes e adicionando melhorias de arquitetura e experiência do usuário.