import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔧 Iniciando correção do trigger auto_create_individual_participant...')

    // 1. Remover trigger existente
    console.log('1. Removendo trigger existente...')
    const { error: dropTriggerError } = await supabaseAdmin
      .rpc('exec', {
        sql: 'DROP TRIGGER IF EXISTS trigger_auto_create_individual_participant ON itens_pedido;'
      })
    
    if (dropTriggerError) {
      console.log('Aviso ao remover trigger:', dropTriggerError.message)
    }

    // 2. Remover função existente
    console.log('2. Removendo função existente...')
    const { error: dropFunctionError } = await supabaseAdmin
      .rpc('exec', {
        sql: 'DROP FUNCTION IF EXISTS auto_create_individual_participant();'
      })
    
    if (dropFunctionError) {
      console.log('Aviso ao remover função:', dropFunctionError.message)
    }

    // 3. Recriar a função
    console.log('3. Recriando função...')
    const createFunctionSQL = `
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
    `

    const { error: createFunctionError } = await supabaseAdmin
      .rpc('exec', { sql: createFunctionSQL })
    
    if (createFunctionError) {
      throw new Error(`Erro ao criar função: ${createFunctionError.message}`)
    }

    // 4. Recriar o trigger
    console.log('4. Recriando trigger...')
    const createTriggerSQL = `
      CREATE TRIGGER trigger_auto_create_individual_participant
          AFTER INSERT ON itens_pedido
          FOR EACH ROW
          EXECUTE FUNCTION auto_create_individual_participant();
    `

    const { error: createTriggerError } = await supabaseAdmin
      .rpc('exec', { sql: createTriggerSQL })
    
    if (createTriggerError) {
      throw new Error(`Erro ao criar trigger: ${createTriggerError.message}`)
    }

    // 5. Corrigir dados históricos
    console.log('5. Corrigindo dados históricos...')
    const fixHistoricalSQL = `
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
    `

    const { error: fixHistoricalError } = await supabaseAdmin
      .rpc('exec', { sql: fixHistoricalSQL })
    
    if (fixHistoricalError) {
      console.log('Aviso ao corrigir dados históricos:', fixHistoricalError.message)
    }

    // 6. Verificar resultados
    console.log('6. Verificando resultados...')
    
    const { data: participantes, error: participantesError } = await supabaseAdmin
      .from('participantes')
      .select('*', { count: 'exact' })
    
    const { data: itensIndividuais, error: itensError } = await supabaseAdmin
      .from('itens_pedido')
      .select(`
        id,
        pedidos!inner(tipo_pedido),
        participantes(id)
      `)
      .eq('pedidos.tipo_pedido', 'individual')
      .is('participantes.id', null)
    
    const result = {
      success: true,
      message: 'Trigger auto_create_individual_participant corrigido com sucesso!',
      stats: {
        totalParticipantes: participantes?.length || 0,
        itensIndividuaisSemParticipantes: itensIndividuais?.length || 0
      }
    }

    console.log('✅ Correção concluída:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Erro na correção:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})