-- Migration: 010_create_group_order_function.sql
-- Description: Criar função RPC para pedidos em grupo transacionais
-- Date: 2025-01-25

-- Habilita a extensão 'uuid-ossp' se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- Cria a função que receberá o JSON do frontend
create or replace function public.create_group_order(
  data jsonb -- Recebe um único objeto JSON com todos os dados
)
returns uuid -- Retorna o ID do novo pedido criado
language plpgsql
security definer -- Executa com os privilégios do criador da função (postgres)
as $$
declare
  new_pedido_id uuid;
  new_item_id uuid;
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

  -- PASSO 2: Inserir os itens do pedido
  for item in select * from jsonb_to_recordset(data->'itens') as x(tamanho text, quantidade int, preco_unitario numeric)
  loop
      insert into public.itens_pedido (pedido_id, tamanho, quantidade, preco_unitario)
      values (new_pedido_id, item.tamanho, item.quantidade, item.preco_unitario)
      returning id into new_item_id;
      
      -- PASSO 3: Inserir participantes para este item específico
      for participante in select * from jsonb_to_recordset(data->'participantes') as p(nome text, tamanho text)
      loop
        -- Verifica se o participante pertence a este item (pelo tamanho)
        if participante.tamanho = item.tamanho then
          insert into public.participantes (
            item_pedido_id, -- Referência ao item específico
            user_id,        -- ID do líder que fez o pedido
            nome,
            tamanho,
            cidade,         -- Usa a cidade do líder
            igreja          -- Usa a igreja do líder
          )
          values (
            new_item_id,
            auth.uid(),
            participante.nome,
            participante.tamanho,
            leader_cidade,
            leader_igreja
          );
        end if;
      end loop;
  end loop;

  return new_pedido_id;
end;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.create_group_order(jsonb) TO authenticated;

-- Comentário na função
COMMENT ON FUNCTION public.create_group_order(jsonb) IS 'Função para criar pedidos em grupo de forma transacional, inserindo pedido, itens e participantes';