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

async function createTodoList() {
  console.log('📋 Criando lista de tarefas para correção do sistema de participantes...');
  
  const todoList = [
    {
      id: '1',
      content: 'Aplicar migração SQL 020_fix_auto_create_participant_trigger.sql via Supabase Dashboard',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '2', 
      content: 'Verificar se o trigger auto_create_individual_participant foi criado corretamente',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '3',
      content: 'Corrigir dados históricos - criar participantes para itens individuais existentes',
      status: 'pending', 
      priority: 'high'
    },
    {
      id: '4',
      content: 'Testar criação de novo pedido individual para verificar funcionamento do trigger',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: '5',
      content: 'Verificar se a função RPC create_group_order está funcionando corretamente para pedidos em grupo',
      status: 'pending',
      priority: 'medium'
    }
  ];
  
  console.log('\n📝 Lista de tarefas criada:');
  todoList.forEach(todo => {
    console.log(`${todo.id}. [${todo.status.toUpperCase()}] ${todo.content} (${todo.priority})`);
  });
  
  console.log('\n🔧 Próximos passos recomendados:');
  console.log('1. Acesse o Supabase Dashboard: https://app.supabase.com');
  console.log('2. Vá para SQL Editor');
  console.log('3. Execute o conteúdo do arquivo migrations/020_fix_auto_create_participant_trigger.sql');
  console.log('4. Verifique se o trigger foi criado com sucesso');
  console.log('5. Teste a criação de um novo pedido individual');
  
  return todoList;
}

// Executar
createTodoList().catch(console.error);