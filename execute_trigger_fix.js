import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return false;
    }
    console.log('✅ SQL executado com sucesso:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro na execução:', err);
    return false;
  }
}

async function fixTrigger() {
  console.log('🔧 Iniciando correção do trigger auto_create_individual_participant...');
  
  // 1. Remover trigger existente
  console.log('\n1. Removendo trigger existente...');
  await executeSQL('DROP TRIGGER IF EXISTS trigger_auto_create_individual_participant ON itens_pedido;');
  
  // 2. Remover função existente
  console.log('\n2. Removendo função existente...');
  await executeSQL('DROP FUNCTION IF EXISTS auto_create_individual_participant();');
  
  // 3. Recriar a função
  console.log('\n3. Recriando função...');
  const createFunction = `
    CREATE OR REPLACE FUNCTION auto_create_individual_participant()
    RETURNS TRIGGER AS $$
    DECLARE
        pedido_tipo TEXT;
        user_data RECORD;
    BEGIN
        -- Buscar o tipo do pedido e dados do usuário
        SELECT p.tipo_pedido, u.nome, u.cidade, u.igreja, u.id as user_id
        INTO pedido_tipo, user_data
        FROM pedidos p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = NEW.pedido_id;
        
        -- Se for pedido individual, criar participante automaticamente
        IF pedido_tipo = 'individual' THEN
            INSERT INTO participantes (
                item_pedido_id,
                user_id,
                nome,
                tamanho,
                cidade,
                igreja
            ) VALUES (
                NEW.id,
                user_data.user_id,
                user_data.nome,
                NEW.tamanho,
                user_data.cidade,
                user_data.igreja
            );
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  await executeSQL(createFunction);
  
  // 4. Recriar o trigger
  console.log('\n4. Recriando trigger...');
  const createTrigger = `
    CREATE TRIGGER trigger_auto_create_individual_participant
        AFTER INSERT ON itens_pedido
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_individual_participant();
  `;
  
  await executeSQL(createTrigger);
  
  // 5. Corrigir dados históricos
  console.log('\n5. Corrigindo dados históricos...');
  const fixHistoricalData = `
    INSERT INTO participantes (
        item_pedido_id,
        user_id,
        nome,
        tamanho,
        cidade,
        igreja
    )
    SELECT 
        ip.id as item_pedido_id,
        u.id as user_id,
        u.nome,
        ip.tamanho,
        u.cidade,
        u.igreja
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    JOIN users u ON p.user_id = u.id
    LEFT JOIN participantes part ON part.item_pedido_id = ip.id
    WHERE p.tipo_pedido = 'individual'
      AND part.id IS NULL;
  `;
  
  await executeSQL(fixHistoricalData);
  
  // 6. Verificar resultados
  console.log('\n6. Verificando resultados...');
  
  try {
    const { data: participantes, error: errorPart } = await supabase
      .from('participantes')
      .select('*', { count: 'exact' });
    
    if (errorPart) {
      console.error('❌ Erro ao contar participantes:', errorPart);
    } else {
      console.log(`✅ Total de participantes: ${participantes?.length || 0}`);
    }
    
    const { data: itensIndividuais, error: errorItens } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        pedidos!inner(tipo_pedido),
        participantes(id)
      `)
      .eq('pedidos.tipo_pedido', 'individual')
      .is('participantes.id', null);
    
    if (errorItens) {
      console.error('❌ Erro ao verificar itens sem participantes:', errorItens);
    } else {
      console.log(`✅ Itens individuais sem participantes: ${itensIndividuais?.length || 0}`);
    }
    
  } catch (err) {
    console.error('❌ Erro na verificação:', err);
  }
  
  console.log('\n🎉 Correção do trigger concluída!');
}

// Executar a correção
fixTrigger().catch(console.error);