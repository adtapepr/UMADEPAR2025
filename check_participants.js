import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParticipants() {
  try {
    console.log('🔍 Verificando status dos participantes...');
    
    // 1. Verificar pedidos individuais sem participantes
    const { data: pedidosIndividuaisSemParticipantes, error: error1 } = await supabase
      .rpc('check_individual_orders_without_participants');
    
    if (error1) {
      console.log('❌ Erro ao executar RPC, tentando consulta direta...');
      
      // Consulta direta se RPC não existir
      const { data: itensIndividuais, error: error2 } = await supabase
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
      
      if (error2) {
        console.error('❌ Erro na consulta:', error2);
        return;
      }
      
      console.log(`📊 Total de itens de pedidos individuais: ${itensIndividuais.length}`);
      
      // Verificar quais têm participantes
      for (const item of itensIndividuais) {
        const { data: participantes, error: error3 } = await supabase
          .from('participantes')
          .select('id')
          .eq('item_pedido_id', item.id);
        
        if (error3) {
          console.error('❌ Erro ao verificar participantes:', error3);
          continue;
        }
        
        if (participantes.length === 0) {
          console.log(`⚠️  Item sem participante:`, {
            item_id: item.id,
            pedido_id: item.pedido_id,
            tamanho: item.tamanho,
            quantidade: item.quantidade,
            user_nome: item.pedidos.users.nome,
            status: item.pedidos.status
          });
        }
      }
    }
    
    // 2. Verificar total de participantes
    const { count: totalParticipantes, error: error4 } = await supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true });
    
    if (error4) {
      console.error('❌ Erro ao contar participantes:', error4);
    } else {
      console.log(`👥 Total de participantes na tabela: ${totalParticipantes}`);
    }
    
    // 3. Verificar total de pedidos por tipo
    const { data: pedidosPorTipo, error: error5 } = await supabase
      .from('pedidos')
      .select('tipo_pedido, status')
      .order('created_at', { ascending: false });
    
    if (error5) {
      console.error('❌ Erro ao buscar pedidos:', error5);
    } else {
      const stats = pedidosPorTipo.reduce((acc, pedido) => {
        const key = `${pedido.tipo_pedido}_${pedido.status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Estatísticas de pedidos:', stats);
    }
    
    // 4. Verificar se o trigger existe
    const { data: triggers, error: error6 } = await supabase
      .rpc('check_trigger_exists', { trigger_name: 'trigger_auto_create_individual_participant' });
    
    if (error6) {
      console.log('❌ Erro ao verificar trigger, consultando diretamente...');
      
      const { data: triggerInfo, error: error7 } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'trigger_auto_create_individual_participant');
      
      if (error7) {
        console.log('⚠️  Não foi possível verificar se o trigger existe');
      } else {
        console.log(`🔧 Trigger encontrado: ${triggerInfo.length > 0 ? 'SIM' : 'NÃO'}`);
      }
    } else {
      console.log(`🔧 Trigger existe: ${triggers ? 'SIM' : 'NÃO'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkParticipants();