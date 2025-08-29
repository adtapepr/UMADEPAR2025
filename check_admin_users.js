import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwrgpdlxhudtyewlmscl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cmdwZGx4aHVkdHlld2xtc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDQ4MzgsImV4cCI6MjA3MTQ4MDgzOH0.F7A9v81dtsHW3vrZ92ltsTYXFtwCSoHvaRCatW1HTPE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Verificando usuários admin...');
    
    // Buscar todos os usuários admin
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('id, email, nome, tipo, igreja')
      .eq('tipo', 'admin');
    
    if (error) {
      console.error('❌ Erro ao buscar usuários admin:', error);
      return;
    }
    
    console.log('📊 Usuários admin encontrados:', adminUsers?.length || 0);
    
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`👤 Admin ${index + 1}:`, {
          id: user.id,
          email: user.email,
          nome: user.nome,
          tipo: user.tipo,
          igreja: user.igreja
        });
      });
    } else {
      console.log('⚠️ Nenhum usuário admin encontrado!');
    }
    
    // Verificar também na tabela auth.users se há metadados
    console.log('\n🔍 Verificando metadados no JWT...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ Nenhum usuário logado para verificar metadados');
    } else if (authData.user) {
      console.log('👤 Usuário logado:', authData.user.email);
      console.log('📋 Metadados:', authData.user.user_metadata);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkAdminUsers();