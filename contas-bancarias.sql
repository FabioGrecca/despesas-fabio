-- ═══════════════════════════════════════════════════════════════
-- DESPESAS FÁBIO — Tabela de Contas/Bancos
-- Rode este SQL uma vez no Supabase → SQL Editor.
-- O app popula a lista inicial sozinho no primeiro acesso.
-- ═══════════════════════════════════════════════════════════════

create table if not exists contas_bancarias (
  id   bigint generated always as identity primary key,
  nome text not null unique
);

alter table contas_bancarias enable row level security;

create policy "allow_all_contas_bancarias"
  on contas_bancarias for all using (true) with check (true);
