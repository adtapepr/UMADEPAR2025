-- Passo 1: Atualizar o tipo do usuário administrador
-- Baseado no histórico da conversa, o email usado foi 'adm@gmail.com'
UPDATE public.users 
SET tipo = 'admin' 
WHERE email = 'adm@gmail.com';

-- Passo 2: Corrigir Política de Pedidos
ALTER POLICY "Admins can view all orders" ON public.pedidos 
USING (public.is_admin());

-- Passo 3: Corrigir Política de Itens do Pedido
ALTER POLICY "Admins can view all order items" ON public.itens_pedido 
USING (public.is_admin());

-- Passo 4: Corrigir Política de Participantes
ALTER POLICY "Admins can view all participants" ON public.participantes 
USING (public.is_admin());

-- Verificar se as alterações foram aplicadas
SELECT email, tipo FROM public.users WHERE email = 'adm@gmail.com';