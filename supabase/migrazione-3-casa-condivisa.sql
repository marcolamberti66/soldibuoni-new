-- ─────────────────────────────────────────────────────────────
-- SoldiBuoni · migrazione 3 (casa condivisa, sincronizzazione
-- con data di modifica, nuovi eventi). Idempotente.
-- ─────────────────────────────────────────────────────────────

-- 1. Data di ultima modifica: serve a unire le modifiche di due persone
--    (o due dispositivi) tenendo la più recente.
alter table public.case       add column if not exists aggiornato_il timestamptz;
alter table public.documenti  add column if not exists aggiornato_il timestamptz;
alter table public.ricorrenti add column if not exists aggiornato_il timestamptz;
alter table public.promemoria add column if not exists aggiornato_il timestamptz;

-- 2. Chi vive nella casa oltre al proprietario.
create table if not exists public.case_membri (
  casa_id uuid not null references public.case(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  aggiunto_il timestamptz not null default now(),
  primary key (casa_id, user_id)
);
create index if not exists case_membri_user on public.case_membri (user_id);
alter table public.case_membri enable row level security;
revoke all on public.case_membri from anon;
grant select, delete on public.case_membri to authenticated;

-- Accesso a una casa: proprietario o membro. Security definer per
-- evitare ricorsioni tra le regole delle tabelle.
create or replace function public.puo_accedere(c uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.case where id = c and user_id = auth.uid())
      or exists (select 1 from public.case_membri where casa_id = c and user_id = auth.uid());
$$;
revoke all on function public.puo_accedere(uuid) from public, anon;
grant execute on function public.puo_accedere(uuid) to authenticated;

drop policy if exists "membri vedono i membri" on public.case_membri;
create policy "membri vedono i membri" on public.case_membri for select using (public.puo_accedere(casa_id));
drop policy if exists "si esce o si rimuove" on public.case_membri;
create policy "si esce o si rimuove" on public.case_membri for delete
  using (user_id = auth.uid() or exists (select 1 from public.case where id = casa_id and user_id = auth.uid()));

-- 3. Regole: la casa e i suoi dati sono di chi ci vive.
drop policy if exists "solo proprietario" on public.case;
drop policy if exists "chi ci vive" on public.case;
create policy "chi ci vive" on public.case for all
  using (user_id = auth.uid() or public.puo_accedere(id))
  with check (user_id = auth.uid() or public.puo_accedere(id));

do $$
declare t text;
begin
  foreach t in array array['documenti','ricorrenti','promemoria'] loop
    execute format('drop policy if exists "solo proprietario" on public.%I', t);
    execute format('drop policy if exists "chi ci vive" on public.%I', t);
    execute format('create policy "chi ci vive" on public.%I for all using (public.puo_accedere(casa_id)) with check (public.puo_accedere(casa_id))', t);
  end loop;
end $$;

-- Il proprietario di una casa non cambia per un aggiornamento.
create or replace function public.blocca_cambio_proprietario()
returns trigger language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then new.user_id := old.user_id; end if;
  return new;
end $$;
drop trigger if exists case_proprietario_fisso on public.case;
create trigger case_proprietario_fisso before update on public.case
  for each row execute function public.blocca_cambio_proprietario();

-- 4. Inviti: un codice valido 7 giorni, usabile una volta.
create table if not exists public.inviti (
  codice text primary key check (codice ~ '^[A-Z2-9]{8}$'),
  casa_id uuid not null references public.case(id) on delete cascade,
  creato_da uuid not null default auth.uid() references auth.users on delete cascade,
  creato_il timestamptz not null default now(),
  scade_il timestamptz not null default now() + interval '7 days',
  usato_da uuid references auth.users on delete set null,
  usato_il timestamptz
);
alter table public.inviti enable row level security;
revoke all on public.inviti from anon;
grant select, insert, delete on public.inviti to authenticated;
drop policy if exists "chi ci vive invita" on public.inviti;
create policy "chi ci vive invita" on public.inviti for all
  using (public.puo_accedere(casa_id)) with check (public.puo_accedere(casa_id) and creato_da = auth.uid());

-- Chiunque abbia il codice può sapere solo se è valido.
create or replace function public.invito_valido(p_codice text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.inviti where codice = upper(p_codice) and usato_da is null and scade_il > now());
$$;
revoke all on function public.invito_valido(text) from public;
grant execute on function public.invito_valido(text) to anon, authenticated;

-- Accetta: diventi membro; se avevi già una tua casa sul database,
-- i suoi dati confluiscono nella casa condivisa e la vecchia viene chiusa.
create or replace function public.accetta_invito(p_codice text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv public.inviti;
  vecchia uuid;
begin
  if auth.uid() is null then raise exception 'accesso richiesto'; end if;
  select * into inv from public.inviti where codice = upper(p_codice) for update;
  if inv.codice is null then raise exception 'invito inesistente'; end if;
  if exists (select 1 from public.case where id = inv.casa_id and user_id = auth.uid())
     or exists (select 1 from public.case_membri where casa_id = inv.casa_id and user_id = auth.uid()) then
    return inv.casa_id;
  end if;
  if inv.usato_da is not null then raise exception 'invito già usato'; end if;
  if inv.scade_il < now() then raise exception 'invito scaduto'; end if;

  for vecchia in select id from public.case where user_id = auth.uid() and id <> inv.casa_id loop
    update public.documenti  set casa_id = inv.casa_id where casa_id = vecchia;
    update public.ricorrenti set casa_id = inv.casa_id where casa_id = vecchia;
    update public.promemoria set casa_id = inv.casa_id where casa_id = vecchia;
    delete from public.case where id = vecchia;
  end loop;
  delete from public.case_membri where user_id = auth.uid();

  insert into public.case_membri (casa_id, user_id) values (inv.casa_id, auth.uid()) on conflict do nothing;
  update public.inviti set usato_da = auth.uid(), usato_il = now() where codice = inv.codice;
  return inv.casa_id;
end $$;
revoke all on function public.accetta_invito(text) from public, anon;
grant execute on function public.accetta_invito(text) to authenticated;

-- Chi vive nella casa (email), visibile solo a chi ci vive.
create or replace function public.persone_casa(p_casa uuid)
returns table (user_id uuid, email text, proprietario boolean)
language sql security definer set search_path = public stable as $$
  select u.id, u.email::text, true from public.case c join auth.users u on u.id = c.user_id
   where c.id = p_casa and public.puo_accedere(p_casa)
  union all
  select u.id, u.email::text, false from public.case_membri m join auth.users u on u.id = m.user_id
   where m.casa_id = p_casa and public.puo_accedere(p_casa);
$$;
revoke all on function public.persone_casa(uuid) from public, anon;
grant execute on function public.persone_casa(uuid) to authenticated;

-- 5. Nuovi eventi anonimi.
alter table public.eventi drop constraint if exists eventi_nome_check;
alter table public.eventi add constraint eventi_nome_check check (nome in (
  'apertura','onboarding','bolletta_letta','bolletta_errore','voce_manuale','spesa_fissa','account','push_attivate',
  'app_installata','invito_install','condivisione','controllo','controllo_errore','controllo_casa',
  'sezione_condivisa','invito_creato','invito_accettato'));

select to_regclass('public.case_membri') as membri, to_regclass('public.inviti') as inviti;
