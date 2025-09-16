import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrigger() {
  try {
    console.log('🔍 Verificando status do trigger...');
    
    // Verificar se o trigger existe
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'trigger_auto_create_individual_participant');
    
    if (triggerError) {
      console.error('❌ Erro ao verificar trigger:', triggerError);
    } else {
      console.log(`🔧 Trigger encontrado: ${triggerData.length > 0 ? 'SIM' : 'NÃO'}`);
      if (triggerData.length > 0) {
        console.log('📋 Detalhes do trigger:', triggerData[0]);
      }
    }
    
    // Verificar se a função existe
    const { data: functionData, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_name', 'auto_create_individual_participant');
    
    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError);
    } else {
      console.log(`⚙️  Função encontrada: ${functionData.length > 0 ? 'SIM' : 'NÃO'}`);
      if (functionData.length > 0) {
        console.log('📋 Detalhes da função:', {
          routine_name: functionData[0].routine_name,
          routine_type: functionData[0].routine_type,
          data_type: functionData[0].data_type
        });
      }
    }
    
    // Testar o trigger criando um pedido individual de teste
    console.log('\n🧪 Testando trigger com pedido de teste...');
    
    // Primeiro, buscar um usuário existente do tipo 'jovem'
    const { data: usuarios, error: usuarioError } = await supabase
      .from('users')
      .select('id, nome, tipo, cidade, igreja')
      .eq('tipo', 'jovem')
      .limit(1);
    
    if (usuarioError || !usuarios || usuarios.length === 0) {
      console.log('⚠️  Não foi possível encontrar um usuário jovem para teste');
      
      // Vamos usar o admin para teste
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, nome, tipo, cidade, igreja')
        .eq('tipo', 'admin')
        .limit(1);
      
      if (adminError || !adminUser || adminUser.length === 0) {
        console.log('❌ Não foi possível encontrar nenhum usuário para teste');
        return;
      }
      
      console.log('ℹ️  Usando usuário admin para teste:', adminUser[0].nome);
      
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
      
      console.log('✅ Pedido de teste criado:', pedidoTeste.id);
      
      // Criar item do pedido (isso deve disparar o trigger)
      const { data: itemTeste, error: itemError } = await supabase
        .from('itens_pedido')
        .insert({
          pedido_id: pedidoTeste.id,
          tamanho: 'M',
          quantidade: 1,
          preco_unitario: 50.00
        })
        .select()
        .single();
      
      if (itemError) {
        console.error('❌ Erro ao criar item de teste:', itemError);
        return;
      }
      
      console.log('✅ Item de teste criado:', itemTeste.id);
      
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o participante foi criado automaticamente
      const { data: participanteTeste, error: participanteError } = await supabase
        .from('participantes')
        .select('*')
        .eq('item_pedido_id', itemTeste.id);
      
      if (participanteError) {
        console.error('❌ Erro ao verificar participante de teste:', participanteError);
      } else {
        if (participanteTeste.length > 0) {
          console.log('🎉 TRIGGER FUNCIONANDO! Participante criado automaticamente:', {
            nome: participanteTeste[0].nome,
            tamanho: participanteTeste[0].tamanho,
            cidade: participanteTeste[0].cidade,
            igreja: participanteTeste[0].igreja
          });
        } else {
          console.log('❌ TRIGGER NÃO FUNCIONANDO! Nenhum participante foi criado automaticamente.');
        }
      }
      
      // Limpar dados de teste
      console.log('\n🧹 Limpando dados de teste...');
      
      // Deletar participante de teste (se existir)
      if (participanteTeste && participanteTeste.length > 0) {
        await supabase
          .from('participantes')
          .delete()
          .eq('item_pedido_id', itemTeste.id);
      }
      
      // Deletar item de teste
      await supabase
        .from('itens_pedido')
        .delete()
        .eq('id', itemTeste.id);
      
      // Deletar pedido de teste
      await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoTeste.id);
      
      console.log('✅ Dados de teste removidos');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTrigger();