-- ═══════════════════════════════════════════════════════════════
-- DESPESAS FÁBIO — Restringir acesso a usuários autenticados
-- Execute no Supabase → SQL Editor APÓS criar seu usuário.
-- Troca as policies "allow_all" (acesso público) por acesso
-- somente para usuários logados (role authenticated).
-- ═══════════════════════════════════════════════════════════════

-- Remove as policies públicas antigas
drop policy if exists "allow_all_categorias"   on categorias;
drop policy if exists "allow_all_fornecedores" on fornecedores;
drop policy if exists "allow_all_contas"       on contas_pagar;

-- Acesso total apenas para usuários autenticados
create policy "auth_all_categorias"   on categorias   for all to authenticated using (true) with check (true);
create policy "auth_all_fornecedores" on fornecedores for all to authenticated using (true) with check (true);
create policy "auth_all_contas"       on contas_pagar for all to authenticated using (true) with check (true);
