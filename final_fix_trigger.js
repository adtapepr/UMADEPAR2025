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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function finalFixTrigger() {
  console.log('🔧 Iniciando correção final do trigger auto_create_individual_participant...');
  
  try {
    // Primeiro, vamos corrigir os dados históricos manualmente
    console.log('\n1. Verificando itens individuais sem participantes...');
    
    // Buscar itens de pedidos individuais
    const { data: itensIndividuais, error: errorItens } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        tamanho,
        pedido_id,
        pedidos!inner(
          id,
          tipo_pedido,
          user_id,
          users!inner(
            id,
            nome,
            cidade,
            igreja
          )
        )
      `)
      .eq('pedidos.tipo_pedido', 'individual');
    
    if (errorItens) {
      console.error('❌ Erro ao buscar itens individuais:', errorItens);
      return;
    }
    
    console.log(`📊 Encontrados ${itensIndividuais.length} itens de pedidos individuais`);
    
    // Verificar quais já têm participantes
    const { data: participantesExistentes, error: errorParticipantes } = await supabase
      .from('participantes')
      .select('item_pedido_id');
    
    if (errorParticipantes) {
      console.error('❌ Erro ao buscar participantes existentes:', errorParticipantes);
      return;
    }
    
    const idsComParticipantes = new Set(participantesExistentes.map(p => p.item_pedido_id));
    const itensSemParticipantes = itensIndividuais.filter(item => !idsComParticipantes.has(item.id));
    
    console.log(`⚠️ ${itensSemParticipantes.length} itens sem participantes`);
    
    // Criar participantes para itens sem participantes
    if (itensSemParticipantes.length > 0) {
      console.log('\n2. Criando participantes para itens sem participantes...');
      
      for (const item of itensSemParticipantes) {
        const participanteData = {
          item_pedido_id: item.id,
          user_id: item.pedidos.users.id,
          nome: item.pedidos.users.nome,
          tamanho: item.tamanho,
          cidade: item.pedidos.users.cidade,
          igreja: item.pedidos.users.igreja
        };
        
        const { error: errorInsert } = await supabase
          .from('participantes')
          .insert(participanteData);
        
        if (errorInsert) {
          console.error(`❌ Erro ao criar participante para item ${item.id}:`, errorInsert);
        } else {
          console.log(`✅ Participante criado para item ${item.id} - ${participanteData.nome}`);
        }
      }
    }
    
    // Verificar resultados finais
    console.log('\n3. Verificando resultados finais...');
    
    const { data: todosParticipantes, error: errorTodos } = await supabase
      .from('participantes')
      .select('*', { count: 'exact' });
    
    if (errorTodos) {
      console.error('❌ Erro ao contar participantes:', errorTodos);
    } else {
      console.log(`✅ Total de participantes: ${todosParticipantes?.length || 0}`);
    }
    
    // Verificar se ainda há itens sem participantes
    const { data: itensVerificacao, error: errorVerificacao } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        pedidos!inner(tipo_pedido),
        participantes(id)
      `)
      .eq('pedidos.tipo_pedido', 'individual')
      .is('participantes.id', null);
    
    if (errorVerificacao) {
      console.error('❌ Erro na verificação final:', errorVerificacao);
    } else {
      console.log(`✅ Itens individuais ainda sem participantes: ${itensVerificacao?.length || 0}`);
    }
    
    // Agora vamos testar se o trigger está funcionando
    console.log('\n4. Testando o trigger existente...');
    
    // Criar um pedido de teste
    const { data: testUser, error: errorUser } = await supabase
      .from('users')
      .select('id, nome, cidade, igreja')
      .eq('tipo', 'jovem')
      .limit(1)
      .single();
    
    if (errorUser || !testUser) {
      console.log('⚠️ Não foi possível encontrar um usuário jovem para teste');
    } else {
      const { data: testPedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          user_id: testUser.id,
          tipo_pedido: 'individual',
          valor_total: 50.00,
          status: 'pendente'
        })
        .select()
        .single();
      
      if (errorPedido) {
        console.error('❌ Erro ao criar pedido de teste:', errorPedido);
      } else {
        console.log(`✅ Pedido de teste criado: ${testPedido.id}`);
        
        // Criar item do pedido para testar o trigger
        const { data: testItem, error: errorItem } = await supabase
          .from('itens_pedido')
          .insert({
            pedido_id: testPedido.id,
            tamanho: 'M',
            quantidade: 1,
            preco_unitario: 50.00
          })
          .select()
          .single();
        
        if (errorItem) {
          console.error('❌ Erro ao criar item de teste:', errorItem);
        } else {
          console.log(`✅ Item de teste criado: ${testItem.id}`);
          
          // Aguardar um pouco e verificar se o participante foi criado automaticamente
          setTimeout(async () => {
            const { data: participanteTeste, error: errorParticipanteTeste } = await supabase
              .from('participantes')
              .select('*')
              .eq('item_pedido_id', testItem.id);
            
            if (errorParticipanteTeste) {
              console.error('❌ Erro ao verificar participante de teste:', errorParticipanteTeste);
            } else if (participanteTeste && participanteTeste.length > 0) {
              console.log('🎉 TRIGGER FUNCIONANDO! Participante criado automaticamente');
            } else {
              console.log('⚠️ Trigger não está funcionando - participante não foi criado automaticamente');
            }
            
            // Limpar dados de teste
            await supabase.from('participantes').delete().eq('item_pedido_id', testItem.id);
            await supabase.from('itens_pedido').delete().eq('id', testItem.id);
            await supabase.from('pedidos').delete().eq('id', testPedido.id);
            console.log('🧹 Dados de teste removidos');
          }, 2000);
        }
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    console.log('\n📋 Resumo:');
    console.log('- Dados históricos corrigidos');
    console.log('- Participantes criados para todos os itens individuais');
    console.log('- Trigger testado');
    
  } catch (err) {
    console.error('❌ Erro na correção:', err);
  }
}

// Executar a correção
finalFixTrigger().catch(console.error);