create table public.pedidos (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  tipo_pedido character varying(20) not null,
  valor_total numeric(10, 2) not null,
  status character varying(20) null default 'pendente'::character varying,
  observacoes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  mp_preference_id text null,
  mp_payment_id bigint null,
  mp_status character varying(50) null,
  mp_transaction_amount numeric(10, 2) null,
  mp_currency_id character varying(3) null,
  mp_payment_method_id character varying(50) null,
  mp_payment_type_id character varying(50) null,
  mp_date_created timestamp with time zone null,
  mp_date_approved timestamp with time zone null,
  mp_status_detail character varying(100) null,
  mp_external_reference character varying(255) null,
  mp_collector_id bigint null,
  mp_operation_type character varying(50) null,
  mp_installments integer null,
  mp_issuer_id character varying(50) null,
  mp_card_last_four_digits character varying(4) null,
  mp_card_first_six_digits character varying(6) null,
  mp_fee_amount numeric(10, 2) null,
  mp_net_amount numeric(10, 2) null,
  constraint pedidos_pkey primary key (id),
  constraint pedidos_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint pedidos_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pendente'::character varying,
            'pago'::character varying,
            'cancelado'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint pedidos_tipo_pedido_check check (
    (
      (tipo_pedido)::text = any (
        (
          array[
            'individual'::character varying,
            'grupo'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint pedidos_valor_total_check check ((valor_total > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_preference_id on public.pedidos using btree (mp_preference_id) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_payment_id on public.pedidos using btree (mp_payment_id) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_status on public.pedidos using btree (mp_status) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_transaction_amount on public.pedidos using btree (mp_transaction_amount) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_payment_method_id on public.pedidos using btree (mp_payment_method_id) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_date_approved on public.pedidos using btree (mp_date_approved) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_status_detail on public.pedidos using btree (mp_status_detail) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_external_reference on public.pedidos using btree (mp_external_reference) TABLESPACE pg_default;

create index IF not exists idx_pedidos_mp_payment_method_date on public.pedidos using btree (mp_payment_method_id, mp_date_approved) TABLESPACE pg_default;

create index IF not exists idx_pedidos_status_mp_status on public.pedidos using btree (status, mp_status) TABLESPACE pg_default;

create index IF not exists idx_pedidos_user_id on public.pedidos using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_pedidos_status on public.pedidos using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pedidos_tipo_pedido on public.pedidos using btree (tipo_pedido) TABLESPACE pg_default;

create index IF not exists idx_pedidos_created_at on public.pedidos using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_pedidos_valor_total on public.pedidos using btree (valor_total) TABLESPACE pg_default;

create trigger update_pedidos_updated_at BEFORE
update on pedidos for EACH row
execute FUNCTION update_updated_at_column ();



essa é a migração que foi criada para corrigir, mas esta dando problemas no supabase:
ERROR:  42703: column p.mp_payment_status does not exist
LINE 14:     p.mp_payment_status,
             ^

             

-- Corrige a categorização dos métodos de pagamento na view vw_payment_details
-- Baseado na documentação oficial do Mercado Pago para webhooks

CREATE OR REPLACE VIEW public.vw_payment_details AS
SELECT 
    p.id,
    p.user_id,
    p.status,
    p.valor_total,
    p.created_at,
    p.updated_at,
    p.mp_preference_id,
    p.mp_payment_id,
    p.mp_payment_status,
    p.mp_payment_method_id,
    p.mp_payment_type_id,
    p.mp_installments,
    p.mp_card_first_six_digits,
    p.mp_card_last_four_digits,
    p.mp_card_holder_name,
    p.mp_transaction_amount,
    p.mp_net_received_amount,
    p.mp_total_paid_amount,
    p.mp_fee_details,
    p.mp_date_approved,
    p.mp_date_created,
    p.mp_last_modified,
    p.mp_webhook_data,
    
    -- Categorização corrigida baseada em mp_payment_type_id
    CASE 
        WHEN p.mp_payment_type_id = 'account_money' THEN 'account_money'
        WHEN p.mp_payment_type_id = 'ticket' THEN 'ticket'
        WHEN p.mp_payment_type_id = 'bank_transfer' THEN 'bank_transfer'
        WHEN p.mp_payment_type_id = 'atm' THEN 'atm'
        WHEN p.mp_payment_type_id = 'credit_card' THEN 'credit_card'
        WHEN p.mp_payment_type_id = 'debit_card' THEN 'debit_card'
        WHEN p.mp_payment_type_id = 'prepaid_card' THEN 'prepaid_card'
        WHEN p.mp_payment_type_id = 'digital_currency' THEN 'digital_currency'
        WHEN p.mp_payment_type_id = 'digital_wallet' THEN 'digital_wallet'
        WHEN p.mp_payment_type_id = 'voucher_card' THEN 'voucher_card'
        WHEN p.mp_payment_type_id = 'crypto_transfer' THEN 'crypto_transfer'
        WHEN p.mp_payment_type_id = 'pix' THEN 'pix'
        ELSE 'other'
    END AS metodo_pagamento,
    
    -- Descrição amigável do método de pagamento
    CASE 
        WHEN p.mp_payment_type_id = 'account_money' THEN 'Mercado Pago'
        WHEN p.mp_payment_type_id = 'ticket' THEN 'Boleto'
        WHEN p.mp_payment_type_id = 'bank_transfer' THEN 'Transferência Bancária'
        WHEN p.mp_payment_type_id = 'atm' THEN 'Caixa Eletrônico'
        WHEN p.mp_payment_type_id = 'credit_card' THEN 'Cartão de Crédito'
        WHEN p.mp_payment_type_id = 'debit_card' THEN 'Cartão de Débito'
        WHEN p.mp_payment_type_id = 'prepaid_card' THEN 'Cartão Pré-pago'
        WHEN p.mp_payment_type_id = 'digital_currency' THEN 'Moeda Digital'
        WHEN p.mp_payment_type_id = 'digital_wallet' THEN 'Carteira Digital'
        WHEN p.mp_payment_type_id = 'voucher_card' THEN 'Cartão Voucher'
        WHEN p.mp_payment_type_id = 'crypto_transfer' THEN 'Transferência Crypto'
        WHEN p.mp_payment_type_id = 'pix' THEN 'PIX'
        ELSE 'Outros'
    END AS metodo_pagamento_descricao,
    
    -- Status de pagamento em português
    CASE 
        WHEN p.mp_payment_status = 'approved' THEN 'Aprovado'
        WHEN p.mp_payment_status = 'pending' THEN 'Pendente'
        WHEN p.mp_payment_status = 'authorized' THEN 'Autorizado'
        WHEN p.mp_payment_status = 'in_process' THEN 'Em Processamento'
        WHEN p.mp_payment_status = 'in_mediation' THEN 'Em Mediação'
        WHEN p.mp_payment_status = 'rejected' THEN 'Rejeitado'
        WHEN p.mp_payment_status = 'cancelled' THEN 'Cancelado'
        WHEN p.mp_payment_status = 'refunded' THEN 'Reembolsado'
        WHEN p.mp_payment_status = 'charged_back' THEN 'Estornado'
        ELSE p.mp_payment_status
    END AS status_pagamento_descricao,
    
    -- Diferença entre valor do pedido e valor pago
    COALESCE(p.mp_transaction_amount, 0) - p.valor_total AS diferenca_valor,
    
    -- Tempo para aprovação (em minutos)
    CASE 
        WHEN p.mp_date_approved IS NOT NULL AND p.mp_date_created IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (p.mp_date_approved - p.mp_date_created)) / 60
        ELSE NULL
    END AS tempo_aprovacao_minutos,
    
    -- Indicadores booleanos
    p.mp_payment_status = 'approved' AS pagamento_aprovado,
    p.mp_installments > 1 AS pagamento_parcelado,
    p.mp_card_first_six_digits IS NOT NULL AS possui_dados_cartao,
    COALESCE(p.mp_transaction_amount, 0) != p.valor_total AS valor_divergente
    
FROM pedidos p
WHERE p.mp_payment_id IS NOT NULL
ORDER BY p.created_at DESC;



view atual:

create view public.vw_payment_details as
select
  p.id as pedido_id,
  p.user_id,
  u.nome as comprador_nome,
  u.email as comprador_email,
  p.tipo_pedido,
  p.valor_total as valor_pedido_original,
  p.status as status_pedido,
  p.created_at as data_criacao_pedido,
  p.updated_at as data_atualizacao_pedido,
  p.mp_preference_id,
  p.mp_payment_id,
  p.mp_status,
  p.mp_status_detail,
  p.mp_external_reference,
  p.mp_transaction_amount as valor_pago_real,
  p.mp_currency_id as moeda,
  p.mp_fee_amount as taxa_mp,
  p.mp_net_amount as valor_liquido_recebido,
  p.mp_payment_method_id as metodo_pagamento,
  p.mp_payment_type_id as tipo_pagamento,
  p.mp_installments as parcelas,
  p.mp_date_created as data_criacao_pagamento,
  p.mp_date_approved as data_aprovacao_pagamento,
  p.mp_card_first_six_digits as bin_cartao,
  p.mp_card_last_four_digits as final_cartao,
  p.mp_issuer_id as banco_emissor,
  p.mp_collector_id,
  p.mp_operation_type as tipo_operacao,
  case
    when p.mp_payment_method_id::text = 'pix'::text then 'PIX'::character varying
    when p.mp_payment_method_id::text = 'credit_card'::text then 'Cartão de Crédito'::character varying
    when p.mp_payment_method_id::text = 'debit_card'::text then 'Cartão de Débito'::character varying
    when p.mp_payment_method_id::text = 'bank_transfer'::text then 'Transferência Bancária'::character varying
    when p.mp_payment_method_id::text = 'ticket'::text then 'Boleto'::character varying
    else COALESCE(
      p.mp_payment_method_id,
      'Não informado'::character varying
    )
  end as metodo_pagamento_descricao,
  case
    when p.mp_status::text = 'approved'::text then 'Aprovado'::character varying
    when p.mp_status::text = 'rejected'::text then 'Rejeitado'::character varying
    when p.mp_status::text = 'cancelled'::text then 'Cancelado'::character varying
    when p.mp_status::text = 'pending'::text then 'Pendente'::character varying
    when p.mp_status::text = 'in_process'::text then 'Em Processamento'::character varying
    when p.mp_status::text = 'in_mediation'::text then 'Em Mediação'::character varying
    else COALESCE(p.mp_status, 'Não informado'::character varying)
  end as status_pagamento_descricao,
  case
    when p.mp_transaction_amount is not null then round(p.mp_transaction_amount - p.valor_total, 2)
    else null::numeric
  end as diferenca_valor,
  case
    when p.mp_date_approved is not null
    and p.mp_date_created is not null then EXTRACT(
      epoch
      from
        p.mp_date_approved - p.mp_date_created
    ) / 60::numeric
    else null::numeric
  end as tempo_aprovacao_minutos,
  p.mp_payment_id is not null as tem_pagamento_mp,
  p.mp_status::text = 'approved'::text as pagamento_aprovado,
  p.mp_installments > 1 as pagamento_parcelado,
  p.mp_card_last_four_digits is not null as pagamento_cartao
from
  pedidos p
  left join users u on p.user_id = u.id
order by
  p.created_at desc;


  preciso que veja isso e me diga se está tudo certo 