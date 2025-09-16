import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
  try {
    console.log('🧪 Testando trigger de criação automática de participantes...');
    
    // Buscar um usuário admin para teste
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, nome, tipo, cidade, igreja')
      .eq('tipo', 'admin')
      .limit(1);
    
    if (adminError || !adminUser || adminUser.length === 0) {
      console.log('❌ Não foi possível encontrar usuário para teste');
      return;
    }
    
    console.log('ℹ️  Usando usuário para teste:', adminUser[0].nome);
    
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
      // Limpar pedido se item falhou
      await supabase.from('pedidos').delete().eq('id', pedidoTeste.id);
      return;
    }
    
    console.log('✅ Item de teste criado:', itemTeste.id);
    
    // Aguardar um pouco para o trigger processar
    console.log('⏳ Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o participante foi criado automaticamente
    const { data: participanteTeste, error: participanteError } = await supabase
      .from('participantes')
      .select('*')
      .eq('item_pedido_id', itemTeste.id);
    
    if (participanteError) {
      console.error('❌ Erro ao verificar participante de teste:', participanteError);
    } else {
      if (participanteTeste.length > 0) {
        console.log('🎉 TRIGGER FUNCIONANDO! Participante criado automaticamente:');
        console.log('   Nome:', participanteTeste[0].nome);
        console.log('   Tamanho:', participanteTeste[0].tamanho);
        console.log('   Cidade:', participanteTeste[0].cidade);
        console.log('   Igreja:', participanteTeste[0].igreja);
      } else {
        console.log('❌ TRIGGER NÃO FUNCIONANDO! Nenhum participante foi criado automaticamente.');
        console.log('   Isso indica que o trigger não está ativo ou há um problema na função.');
      }
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Deletar participante de teste (se existir)
    if (participanteTeste && participanteTeste.length > 0) {
      const { error: deleteParticipanteError } = await supabase
        .from('participantes')
        .delete()
        .eq('item_pedido_id', itemTeste.id);
      
      if (deleteParticipanteError) {
        console.error('⚠️  Erro ao deletar participante de teste:', deleteParticipanteError);
      }
    }
    
    // Deletar item de teste
    const { error: deleteItemError } = await supabase
      .from('itens_pedido')
      .delete()
      .eq('id', itemTeste.id);
    
    if (deleteItemError) {
      console.error('⚠️  Erro ao deletar item de teste:', deleteItemError);
    }
    
    // Deletar pedido de teste
    const { error: deletePedidoError } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoTeste.id);
    
    if (deletePedidoError) {
      console.error('⚠️  Erro ao deletar pedido de teste:', deletePedidoError);
    }
    
    console.log('✅ Dados de teste removidos');
    
    // Verificar estatísticas finais
    const { count: totalParticipantes, error: countError } = await supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n👥 Total de participantes na tabela: ${totalParticipantes}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTrigger();