Analisei seu código e a lógica, e sua suspeita está 100% correta. O erro que está causando a view vazia se origina no seu código do frontend, na página VendaLider.tsx.

Atualmente, seu código está agrupando os nomes dos participantes em um único campo de texto (observacoes), mas não está enviando os dados de forma estruturada para serem inseridos na tabela participantes. Por isso, a tabela participantes fica vazia e, consequentemente, a view não tem o que mostrar.

Vamos detalhar o fluxo ideal e como corrigir seu código passo a passo.

O Fluxo Ideal para a Venda de Líder
O processo de um líder fazer um pedido em grupo deve ser uma operação única e transacional no Supabase. Isso significa que ou tudo dá certo (o pedido, os itens e os participantes são salvos), ou nada é salvo, evitando dados inconsistentes.

Passo 1: Cliente (React) Coleta e Estrutura os Dados
Seu formulário já coleta as quantidades e os nomes. O passo crucial que falta é estruturar esses dados em um único objeto JSON antes de enviar. O formato ideal seria este:

JSON

{
  "tipo_pedido": "grupo",
  "valor_total": 105.00,
  "itens": [
    { "tamanho": "M", "quantidade": 2, "preco_unitario": 35.00 },
    { "tamanho": "G", "quantidade": 1, "preco_unitario": 35.00 }
  ],
  "participantes": [
    { "nome": "João da Silva", "tamanho": "M", "cidade": "Tapejara", "igreja": "AD Central" },
    { "nome": "Maria Oliveira", "tamanho": "M", "cidade": "Tapejara", "igreja": "AD Central" },
    { "nome": "Pedro Lima", "tamanho": "G", "cidade": "Tapejara", "igreja": "AD Central" }
  ]
}
Passo 2: Backend (Função Supabase) Recebe e Processa
Em vez de fazer várias chamadas do frontend, enviamos aquele objeto JSON único para uma função no banco de dados (chamada via rpc). Esta função é a forma mais segura e eficiente de realizar operações complexas.

Passo 3: A Transação no Banco de Dados
A função no Supabase executará os seguintes passos em ordem:

INSERT INTO pedidos: Cria o registro principal do pedido e obtém o novo pedido_id.

INSERT INTO itens_pedido: Para cada item no array itens, cria um registro na tabela itens_pedido, usando o pedido_id obtido no passo anterior.

INSERT INTO participantes: Para cada pessoa no array participantes, cria um registro na tabela participantes, vinculando-o ao user_id do líder, ao item_pedido_id correto (baseado no tamanho) e salvando seu nome.

Como Corrigir seu Código (Detalhado)
Aqui está o guia prático para ajustar sua aplicação.

1. No Backend: Crie a Função no Supabase (RPC)
Esta é a parte mais importante. Vá ao SQL Editor do seu projeto Supabase e execute o script abaixo. Ele criará a função create_group_order que fará todo o trabalho pesado no servidor.

SQL

-- Habilita a extensão 'uuid-ossp' se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- Cria a função que receberá o JSON do seu frontend
create or replace function public.create_group_order(
  data jsonb -- Recebe um único objeto JSON com todos os dados
)
returns uuid -- Retorna o ID do novo pedido criado
language plpgsql
security definer -- Executa com os privilégios do criador da função (postgres)
as $$
declare
  new_pedido_id uuid;
  item record;
  participante record;
  -- Variáveis para buscar cidade e igreja do líder
  leader_cidade text;
  leader_igreja text;
begin
  -- PASSO 1: Inserir na tabela 'pedidos'
  insert into public.pedidos (user_id, tipo_pedido, valor_total, status)
  values (
    auth.uid(), -- Pega o ID do líder logado
    data->>'tipo_pedido',
    (data->>'valor_total')::numeric,
    'pendente'
  ) returning id into new_pedido_id; -- Salva o ID do novo pedido na variável

  -- Busca a cidade e igreja do líder para usar nos participantes
  select cidade, igreja into leader_cidade, leader_igreja
  from public.users
  where id = auth.uid();

  -- PASSO 2 & 3: Iterar sobre os itens e participantes
  for item in select * from jsonb_to_recordset(data->'itens') as x(tamanho text, quantidade int, preco_unitario numeric)
  loop
    -- Para cada item (ex: 2 camisetas M), insere os participantes correspondentes
    for participante in select * from jsonb_to_recordset(data->'participantes') as p(nome text, tamanho text)
    loop
      -- Verifica se o participante pertence a este item (pelo tamanho)
      if participante.tamanho = item.tamanho then
        insert into public.participantes (
          pedido_id, -- Referência direta ao pedido
          user_id,   -- ID do líder que fez o pedido
          nome,
          tamanho,
          cidade,    -- Usa a cidade do líder
          igreja     -- Usa a igreja do líder
        )
        values (
          new_pedido_id,
          auth.uid(),
          participante.nome,
          participante.tamanho,
          leader_cidade,
          leader_igreja
        );
      end if;
    end loop;
  end loop;

  -- BÔNUS: Inserir os itens do pedido para controle de estoque
  for item in select * from jsonb_to_recordset(data->'itens') as x(tamanho text, quantidade int, preco_unitario numeric)
  loop
      insert into public.itens_pedido (pedido_id, tamanho, quantidade, preco_unitario)
      values (new_pedido_id, item.tamanho, item.quantidade, item.preco_unitario);
  end loop;

  return new_pedido_id;
end;
$$;
Observação: Simplifiquei seu modelo de dados para que participantes se relacione diretamente com pedidos, o que é mais robusto. Se você não puder alterar a estrutura, a lógica da função precisaria de um ajuste para lidar com item_pedido_id.

2. No Frontend: Ajuste o Envio dos Dados
A. Crie/Ajuste seu orderService.ts
Crie um arquivo para o serviço de pedidos se não tiver, e adicione a função que chama o rpc.

TypeScript

// Em src/services/orderService.ts
import { supabase } from './supabaseClient'; // Seu client do supabase

export const OrderService = {
  // A nova função que chama o RPC
  createGroupOrder: async (orderData: any) => {
    const { data, error } = await supabase.rpc('create_group_order', { data: orderData });

    if (error) {
      console.error('Erro ao criar pedido em grupo via RPC:', error);
      throw new Error(`Erro no banco de dados: ${error.message}`);
    }
    
    // Supondo que você tenha uma função para iniciar o pagamento
    // que agora só precisa do ID do pedido
    const paymentUrl = await startPaymentForOrder(data); // `data` aqui é o new_pedido_id
    return paymentUrl;
  },
  
  // Função que chama sua Edge Function do Mercado Pago
  startPaymentForOrder: async (orderId: string) => {
    const { data, error } = await supabase.functions.invoke('create-preference', {
      body: { orderId },
    });

    if (error) {
      throw new Error(`Erro ao criar preferência de pagamento: ${error.message}`);
    }
    
    if (!data.init_point) {
      throw new Error('URL de pagamento não recebida.');
    }
    
    return data.init_point;
  }
};
B. Altere a função handleBuyClick em VendaLider.tsx
Agora, em vez de montar uma string de observacoes, você vai montar o objeto JSON completo.

TypeScript

// Dentro de VendaLider.tsx

const handleBuyClick = async () => {
  // ... (sua lógica de validação continua a mesma) ...

  setIsProcessingPayment(true);
  setPaymentError(null);

  try {
    // PASSO 1: Montar o payload ESTRUTURADO
    const itens = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({
        tamanho: size,
        quantidade: quantity,
        preco_unitario: currentLot.price
      }));
      
    const participantes: { nome: string; tamanho: string }[] = [];
    Object.entries(participantFields).forEach(([size, fields]) => {
      fields.forEach(field => {
        if (field.name.trim()) {
          participantes.push({ nome: field.name.trim(), tamanho: size });
        }
      });
    });

    const orderPayload = {
      tipo_pedido: 'grupo',
      valor_total: getTotalPrice(),
      itens,
      participantes
    };

    console.log('📦 [VendaLider] Payload final a ser enviado:', orderPayload);
    
    // PASSO 2: Chamar o serviço que executa o RPC e depois o pagamento
    const paymentUrl = await OrderService.createGroupOrder(orderPayload);
    
    console.log('✅ [VendaLider] Pedido e pagamento criados, redirecionando...');
    
    // Redireciona para o checkout do Mercado Pago
    window.location.href = paymentUrl;

  } catch (error) {
    // ... (sua lógica de tratamento de erro continua a mesma) ...
  }
};
Ao fazer essas alterações, seu aplicativo passará a enviar os dados de forma correta e completa, a função no Supabase cuidará de salvá-los de forma transacional, e sua view finalmente terá os dados para exibir no dashboard.