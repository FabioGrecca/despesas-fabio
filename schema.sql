-- ═══════════════════════════════════════════════
-- DESPESAS FÁBIO — Schema Supabase
-- Execute este SQL no Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. CATEGORIAS
create table if not exists categorias (
  id   bigint generated always as identity primary key,
  nome text not null unique
);

-- 2. FORNECEDORES
create table if not exists fornecedores (
  id   bigint generated always as identity primary key,
  nome text not null unique
);

-- 3. CONTAS A PAGAR
create table if not exists contas_pagar (
  id         text primary key,
  fornecedor text,
  categoria  text,
  valor      numeric(12,2) not null,
  vencimento date not null,
  origem     text,
  obs        text,
  status     text not null default 'pendente',
  pago_em    date,
  valor_pago numeric(12,2),
  created_at timestamptz default now()
);

-- ── Índices para performance ─────────────────────
create index if not exists idx_contas_vencimento on contas_pagar(vencimento);
create index if not exists idx_contas_status     on contas_pagar(status);
create index if not exists idx_contas_categoria  on contas_pagar(categoria);
create index if not exists idx_contas_fornecedor on contas_pagar(fornecedor);

-- ── Row Level Security (acesso público por ora) ──
alter table categorias   enable row level security;
alter table fornecedores enable row level security;
alter table contas_pagar enable row level security;

create policy "allow_all_categorias"   on categorias   for all using (true) with check (true);
create policy "allow_all_fornecedores" on fornecedores for all using (true) with check (true);
create policy "allow_all_contas"       on contas_pagar for all using (true) with check (true);
