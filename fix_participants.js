import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixParticipants() {
  try {
    console.log('🔧 Corrigindo participantes...');
    
    // 1. Buscar todos os itens de pedidos individuais sem participantes
    const { data: itensIndividuais, error: error1 } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        pedido_id,
        tamanho,
        quantidade,
        pedidos!inner(
          id,
          tipo_pedido,
          user_id,
          status,
          users!inner(
            nome,
            cidade,
            igreja
          )
        )
      `)
      .eq('pedidos.tipo_pedido', 'individual');
    
    if (error1) {
      console.error('❌ Erro ao buscar itens:', error1);
      return;
    }
    
    console.log(`📊 Encontrados ${itensIndividuais.length} itens de pedidos individuais`);
    
    // 2. Para cada item, verificar se já tem participante e criar se necessário
    let participantesCriados = 0;
    
    for (const item of itensIndividuais) {
      // Verificar se já existe participante
      const { data: participantesExistentes, error: error2 } = await supabase
        .from('participantes')
        .select('id')
        .eq('item_pedido_id', item.id);
      
      if (error2) {
        console.error(`❌ Erro ao verificar participantes para item ${item.id}:`, error2);
        continue;
      }
      
      if (participantesExistentes.length === 0) {
        // Criar participante
        const { data: novoParticipante, error: error3 } = await supabase
          .from('participantes')
          .insert({
            item_pedido_id: item.id,
            user_id: item.pedidos.user_id,
            nome: item.pedidos.users.nome,
            tamanho: item.tamanho,
            cidade: item.pedidos.users.cidade,
            igreja: item.pedidos.users.igreja
          })
          .select();
        
        if (error3) {
          console.error(`❌ Erro ao criar participante para item ${item.id}:`, error3);
        } else {
          participantesCriados++;
          console.log(`✅ Participante criado para ${item.pedidos.users.nome} - Tamanho: ${item.tamanho} - Status: ${item.pedidos.status}`);
        }
      } else {
        console.log(`ℹ️  Participante já existe para item ${item.id}`);
      }
    }
    
    console.log(`\n🎉 Processo concluído! ${participantesCriados} participantes criados.`);
    
    // 3. Verificar se o trigger está funcionando - criar um teste
    console.log('\n🧪 Testando se o trigger está funcionando...');
    
    // Primeiro, vamos verificar se o trigger existe na base de dados
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_auto_create_individual_participant'
          ) as trigger_exists;
        `
      });
    
    if (triggerError) {
      console.log('⚠️  Não foi possível verificar se o trigger existe via RPC');
    } else {
      console.log(`🔧 Trigger existe: ${triggerCheck?.[0]?.trigger_exists ? 'SIM' : 'NÃO'}`);
    }
    
    // 4. Verificar estatísticas finais
    const { count: totalParticipantes, error: error4 } = await supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true });
    
    if (error4) {
      console.error('❌ Erro ao contar participantes:', error4);
    } else {
      console.log(`\n👥 Total de participantes após correção: ${totalParticipantes}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixParticipants();