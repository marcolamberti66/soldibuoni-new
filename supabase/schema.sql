-- ─────────────────────────────────────────────────────────────
-- SoldiBuoni · "La tua casa" — schema per gli account (Supabase)
-- Stessi nomi di campo dello store locale (src/casa/store.js),
-- così la sincronizzazione è 1:1. Ogni riga è visibile solo al
-- proprietario (Row Level Security).
-- Pronto da eseguire nell'SQL editor di un progetto Supabase.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.case (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  nome text,
  cap text check (cap ~ '^\d{5}$'),
  persone smallint check (persone between 1 and 20),
  mq numeric,
  titolo text check (titolo in ('proprieta_mutuo','proprieta','affitto')),
  riscaldamento text check (riscaldamento in ('gas_autonomo','centralizzato','pompa_calore','altro')),
  creato_il timestamptz not null default now()
);

create table if not exists public.documenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  casa_id uuid not null references public.case on delete cascade,
  categoria text not null check (categoria in ('luce','gas','internet','mobile','acqua','tari','condominio','mutuo','affitto','assicurazione','manutenzione','imu','altro')),
  fornitore text, offerta text,
  periodo_dal date, periodo_al date, data_emissione date, scadenza_pagamento date, fine_condizioni date,
  importo numeric(10,2) not null check (importo >= 0),
  consumo numeric, unita text, consumo_annuo_dichiarato numeric,
  prezzo_materia numeric(10,5), quota_fissa_mese numeric(10,2), canone_mensile numeric(10,2),
  tipo_prezzo text check (tipo_prezzo in ('fisso','variabile','tutela')),
  potenza_kw numeric(4,1),
  consumi_stimati boolean, conguaglio boolean, domiciliazione boolean, pagato boolean default false,
  fonte text check (fonte in ('ai','manuale')), affidabilita text,
  creato_il timestamptz not null default now()
);
create index if not exists documenti_casa_cat on public.documenti (casa_id, categoria, periodo_al desc);

create table if not exists public.ricorrenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  casa_id uuid not null references public.case on delete cascade,
  categoria text not null, nome text,
  importo numeric(10,2) not null, frequenza text not null,
  prossima_scadenza date, data_fine date, domiciliazione boolean, attiva boolean default true,
  tasso numeric(6,3), tipo_tasso text, debito_residuo numeric(12,2), prima_casa boolean,
  creato_il timestamptz not null default now()
);

create table if not exists public.promemoria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  casa_id uuid not null references public.case on delete cascade,
  titolo text not null, data date not null, categoria text, fatto boolean default false,
  creato_il timestamptz not null default now()
);

-- Preferenze di notifica (email avvisi)
create table if not exists public.notifiche (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  email_avvisi boolean not null default true,
  giorni_anticipo smallint not null default 14,
  ultimo_invio timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['case','documenti','ricorrenti','promemoria','notifiche'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo proprietario" on public.%I', t);
    execute format('create policy "solo proprietario" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Vista aggregata e anonima per i benchmark futuri: nessun user_id,
-- solo provincia (prime 2 cifre del CAP), categoria, mese e valori.
create or replace view public.benchmark_anonimo as
select left(c.cap, 2) as area, d.categoria, date_trunc('month', d.periodo_al)::date as mese,
       c.persone, c.riscaldamento,
       d.importo / greatest(1, (d.periodo_al - d.periodo_dal + 1) / 30.4375) as importo_mensile,
       case when d.consumo > 0 then d.importo / d.consumo end as costo_unitario,
       d.prezzo_materia, d.tipo_prezzo
from public.documenti d join public.case c on c.id = d.casa_id
where d.periodo_al is not null and d.periodo_dal is not null and c.cap is not null;
revoke all on public.benchmark_anonimo from anon, authenticated;
