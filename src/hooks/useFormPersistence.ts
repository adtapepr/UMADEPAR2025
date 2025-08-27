import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  key: string;
  debounceMs?: number;
  clearOnSubmit?: boolean;
}

/**
 * Hook customizado para persistir dados de formulário no localStorage
 * Mantém os dados mesmo após refresh da página ou navegação
 */
export function useFormPersistence<T>(
  initialValue: T,
  options: FormPersistenceOptions
) {
  const { key, debounceMs = 500, clearOnSubmit = true } = options;
  
  // Estado para controlar se os dados foram recuperados
  const [isDataRecovered, setIsDataRecovered] = useState(false);
  
  // Função para carregar dados do localStorage
  const loadFromStorage = useCallback((): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`📦 [FormPersistence] Dados recuperados para ${key}:`, parsed);
        setIsDataRecovered(true);
        return parsed;
      }
    } catch (error) {
      console.error(`❌ [FormPersistence] Erro ao carregar dados para ${key}:`, error);
    }
    return initialValue;
  }, [key, initialValue]);
  
  // Estado do formulário com dados recuperados
  const [data, setData] = useState<T>(() => loadFromStorage());
  
  // Função para salvar no localStorage
  const saveToStorage = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`💾 [FormPersistence] Dados salvos para ${key}:`, value);
    } catch (error) {
      console.error(`❌ [FormPersistence] Erro ao salvar dados para ${key}:`, error);
    }
  }, [key]);
  
  // Debounce para salvar dados
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(data);
    }, debounceMs);
    
    return () => clearTimeout(timeoutId);
  }, [data, debounceMs, saveToStorage]);
  
  // Função para limpar dados persistidos
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ [FormPersistence] Dados limpos para ${key}`);
      setIsDataRecovered(false);
    } catch (error) {
      console.error(`❌ [FormPersistence] Erro ao limpar dados para ${key}:`, error);
    }
  }, [key]);
  
  // Função para resetar para valores iniciais
  const resetToInitial = useCallback(() => {
    setData(initialValue);
    clearPersistedData();
  }, [initialValue, clearPersistedData]);
  
  // Função para ser chamada após submit bem-sucedido
  const handleSuccessfulSubmit = useCallback(() => {
    if (clearOnSubmit) {
      clearPersistedData();
    }
  }, [clearOnSubmit, clearPersistedData]);
  
  return {
    data,
    setData,
    isDataRecovered,
    clearPersistedData,
    resetToInitial,
    handleSuccessfulSubmit
  };
}

/**
 * Hook específico para persistir estado de quantidades de camisetas
 */
export function useShirtQuantityPersistence(pageKey: string) {
  const initialQuantities = {
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    XG: 0,
    XXG: 0,
    E1: 0,
    E2: 0
  };
  
  return useFormPersistence(initialQuantities, {
    key: `shirt-quantities-${pageKey}`,
    debounceMs: 300,
    clearOnSubmit: true
  });
}

/**
 * Hook específico para persistir dados de participantes
 */
export function useParticipantsPersistence(pageKey: string) {
  const initialParticipants = {
    P: [],
    M: [],
    G: [],
    GG: [],
    XG: [],
    XXG: [],
    E1: [],
    E2: []
  };
  
  return useFormPersistence(initialParticipants, {
    key: `participants-${pageKey}`,
    debounceMs: 500,
    clearOnSubmit: true
  });
}

/**
 * Hook específico para persistir seleção de tamanho (VendaJovem)
 */
export function useSizeSelectionPersistence() {
  return useFormPersistence<{ selectedSize: string | null; quantity: number }>(
    { selectedSize: null, quantity: 1 },
    {
      key: 'venda-jovem-selection',
      debounceMs: 200,
      clearOnSubmit: true
    }
  );
}