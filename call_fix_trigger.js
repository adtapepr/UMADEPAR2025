import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function callFixTrigger() {
  console.log('🔧 Chamando Edge Function para corrigir trigger...');
  
  try {
    const { data, error } = await supabase.functions.invoke('fix-trigger', {
      body: {}
    });
    
    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      return;
    }
    
    console.log('✅ Resposta da Edge Function:', data);
    
    if (data.success) {
      console.log('🎉 Trigger corrigido com sucesso!');
      console.log(`📊 Total de participantes: ${data.stats.totalParticipantes}`);
      console.log(`⚠️ Itens individuais sem participantes: ${data.stats.itensIndividuaisSemParticipantes}`);
    } else {
      console.error('❌ Falha na correção:', data.error);
    }
    
  } catch (err) {
    console.error('❌ Erro na chamada:', err);
  }
}

// Executar a correção
callFixTrigger().catch(console.error);