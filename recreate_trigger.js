import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateTrigger() {
  try {
    console.log('🔧 Recriando trigger e função...');
    
    // 1. Primeiro, vamos dropar o trigger se existir
    console.log('🗑️  Removendo trigger existente (se houver)...');
    const { error: dropTriggerError } = await supabase.rpc('sql', {
      query: 'DROP TRIGGER IF EXISTS trigger_auto_create_individual_participant ON itens_pedido;'
    });
    
    if (dropTriggerError) {
      console.log('⚠️  Erro ao remover trigger (pode não existir):', dropTriggerError.message);
    } else {
      console.log('✅ Trigger removido (se existia)');
    }
    
    // 2. Recriar a função
    console.log('⚙️  Recriando função...');
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION auto_create_individual_participant()
      RETURNS TRIGGER AS $$
      DECLARE
          pedido_record RECORD;
      BEGIN
          -- Busca informações do pedido
          SELECT p.*, u.nome, u.email, u.tipo, u.cidade, u.igreja
          INTO pedido_record
          FROM pedidos p
          JOIN users u ON p.user_id = u.id
          WHERE p.id = NEW.pedido_id;
          
          -- Se o pedido é individual, cria participante automaticamente
          IF pedido_record.tipo_pedido = 'individual' THEN
              INSERT INTO participantes (
                  item_pedido_id,
                  user_id,
                  nome,
                  tamanho,
                  cidade,
                  igreja
              )
              VALUES (
                  NEW.id,
                  pedido_record.user_id,
                  pedido_record.nome,
                  NEW.tamanho,
                  pedido_record.cidade,
                  pedido_record.igreja
              );
              
              -- Log para debug
              RAISE NOTICE 'Participante criado automaticamente: user_id=%, nome=%, tamanho=%', 
                  pedido_record.user_id, pedido_record.nome, NEW.tamanho;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('sql', {
      query: createFunctionQuery
    });
    
    if (createFunctionError) {
      console.error('❌ Erro ao criar função:', createFunctionError);
      return;
    }
    
    console.log('✅ Função criada com sucesso');
    
    // 3. Recriar o trigger
    console.log('🔗 Recriando trigger...');
    const createTriggerQuery = `
      CREATE TRIGGER trigger_auto_create_individual_participant
          AFTER INSERT ON itens_pedido
          FOR EACH ROW
          EXECUTE FUNCTION auto_create_individual_participant();
    `;
    
    const { error: createTriggerError } = await supabase.rpc('sql', {
      query: createTriggerQuery
    });
    
    if (createTriggerError) {
      console.error('❌ Erro ao criar trigger:', createTriggerError);
      return;
    }
    
    console.log('✅ Trigger criado com sucesso');
    
    // 4. Testar o trigger
    console.log('\n🧪 Testando trigger recriado...');
    
    // Buscar um usuário para teste
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, nome, tipo, cidade, igreja')
      .eq('tipo', 'admin')
      .limit(1);
    
    if (adminError || !adminUser || adminUser.length === 0) {
      console.log('❌ Não foi possível encontrar usuário para teste');
      return;
    }
    
    // Criar pedido de teste
    const { data: pedidoTeste, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        user_id: adminUser[0].id,
        tipo_pedido: 'individual',
        valor_total: 50.00,
        status: 'pendente'
      })
      .select()
      .single();
    
    if (pedidoError) {
      console.error('❌ Erro ao criar pedido de teste:', pedidoError);
      return;
    }
    
    console.log('✅ Pedido de teste criado');
    
    // Criar item do pedido (deve disparar o trigger)
    const { data: itemTeste, error: itemError } = await supabase
      .from('itens_pedido')
      .insert({
        pedido_id: pedidoTeste.id,
        tamanho: 'G',
        quantidade: 1,
        preco_unitario: 50.00
      })
      .select()
      .single();
    
    if (itemError) {
      console.error('❌ Erro ao criar item de teste:', itemError);
      await supabase.from('pedidos').delete().eq('id', pedidoTeste.id);
      return;
    }
    
    console.log('✅ Item de teste criado');
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se participante foi criado
    const { data: participanteTeste, error: participanteError } = await supabase
      .from('participantes')
      .select('*')
      .eq('item_pedido_id', itemTeste.id);
    
    if (participanteError) {
      console.error('❌ Erro ao verificar participante:', participanteError);
    } else {
      if (participanteTeste.length > 0) {
        console.log('🎉 TRIGGER FUNCIONANDO! Participante criado:');
        console.log('   Nome:', participanteTeste[0].nome);
        console.log('   Tamanho:', participanteTeste[0].tamanho);
      } else {
        console.log('❌ Trigger ainda não está funcionando');
      }
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    if (participanteTeste && participanteTeste.length > 0) {
      await supabase.from('participantes').delete().eq('item_pedido_id', itemTeste.id);
    }
    
    await supabase.from('itens_pedido').delete().eq('id', itemTeste.id);
    await supabase.from('pedidos').delete().eq('id', pedidoTeste.id);
    
    console.log('✅ Dados de teste removidos');
    
    // 5. Corrigir participantes históricos
    console.log('\n🔄 Corrigindo participantes históricos...');
    
    const { data: itensIndividuais, error: itensError } = await supabase
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
    
    if (itensError) {
      console.error('❌ Erro ao buscar itens históricos:', itensError);
      return;
    }
    
    let corrigidos = 0;
    
    for (const item of itensIndividuais) {
      const { data: participantesExistentes } = await supabase
        .from('participantes')
        .select('id')
        .eq('item_pedido_id', item.id);
      
      if (!participantesExistentes || participantesExistentes.length === 0) {
        const { error: insertError } = await supabase
          .from('participantes')
          .insert({
            item_pedido_id: item.id,
            user_id: item.pedidos.user_id,
            nome: item.pedidos.users.nome,
            tamanho: item.tamanho,
            cidade: item.pedidos.users.cidade,
            igreja: item.pedidos.users.igreja
          });
        
        if (!insertError) {
          corrigidos++;
        }
      }
    }
    
    console.log(`✅ ${corrigidos} participantes históricos corrigidos`);
    
    // Estatísticas finais
    const { count: totalParticipantes } = await supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total de participantes: ${totalParticipantes}`);
    console.log('🎉 Processo concluído! O trigger agora deve estar funcionando.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

recreateTrigger();