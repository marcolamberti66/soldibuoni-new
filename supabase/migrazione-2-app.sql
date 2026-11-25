-- ─────────────────────────────────────────────────────────────
-- SoldiBuoni · migrazione 2 (app, notifiche push, misurazione)
-- Da eseguire una volta nel SQL Editor di Supabase. Idempotente:
-- rieseguirla non fa danni.
-- ─────────────────────────────────────────────────────────────

-- 1. Iscrizioni alle notifiche push: una riga per dispositivo.
create table if not exists public.push_iscrizioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  dispositivo text,
  creato_il timestamptz not null default now(),
  ultimo_invio timestamptz
);
alter table public.push_iscrizioni enable row level security;
drop policy if exists "solo proprietario" on public.push_iscrizioni;
create policy "solo proprietario" on public.push_iscrizioni for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_iscrizioni to authenticated;
revoke all on public.push_iscrizioni from anon;

-- 2. Eventi anonimi: nessun utente, nessun identificativo, nessun IP.
--    Chiunque può scrivere (solo nomi ammessi), nessuno può leggere
--    se non tramite la funzione riservata qui sotto.
create table if not exists public.eventi (
  id bigint generated always as identity primary key,
  giorno date not null default (now() at time zone 'Europe/Rome')::date,
  nome text not null check (nome in ('apertura','onboarding','bolletta_letta','bolletta_errore','voce_manuale',
    'spesa_fissa','account','push_attivate','app_installata','invito_install','condivisione')),
  dettaglio text check (dettaglio is null or length(dettaglio) <= 40)
);
create index if not exists eventi_giorno on public.eventi (giorno);
alter table public.eventi enable row level security;
drop policy if exists "solo inserimento" on public.eventi;
create policy "solo inserimento" on public.eventi for insert to anon, authenticated with check (true);
grant insert on public.eventi to anon, authenticated;
revoke select, update, delete on public.eventi from anon, authenticated;

-- 3. Chi può leggere le statistiche (pagina /statistiche).
create table if not exists public.amministratori (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.amministratori enable row level security;
revoke all on public.amministratori from anon, authenticated;

create or replace function public.statistiche(giorni int default 90)
returns table (giorno date, nome text, dettaglio text, n bigint)
language sql security definer set search_path = public stable as $$
  select e.giorno, e.nome, e.dettaglio, count(*)::bigint
  from public.eventi e
  where exists (select 1 from public.amministratori a where a.user_id = auth.uid())
    and e.giorno >= current_date - least(greatest(giorni, 1), 400)
  group by 1, 2, 3
  order by 1;
$$;
revoke all on function public.statistiche(int) from public, anon;
grant execute on function public.statistiche(int) to authenticated;

-- Totali che non dipendono dagli eventi: account, case, documenti, notifiche.
create or replace function public.statistiche_totali()
returns table (voce text, n bigint)
language sql security definer set search_path = public stable as $$
  select * from (
    select 'account'::text, (select count(*) from auth.users)
    union all select 'case', (select count(*) from public.case)
    union all select 'documenti', (select count(*) from public.documenti)
    union all select 'spese_fisse', (select count(*) from public.ricorrenti)
    union all select 'email_lunedi', (select count(*) from public.notifiche where email_avvisi)
    union all select 'dispositivi_push', (select count(*) from public.push_iscrizioni)
  ) t(voce, n)
  where exists (select 1 from public.amministratori a where a.user_id = auth.uid());
$$;
revoke all on function public.statistiche_totali() from public, anon;
grant execute on function public.statistiche_totali() to authenticated;

-- 4. Il proprietario del sito: sostituisci l'email con quella del tuo account SoldiBuoni.
insert into public.amministratori (user_id)
select id from auth.users where lower(email) = lower('LA_TUA_EMAIL@esempio.it')
on conflict do nothing;
