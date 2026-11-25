-- ─────────────────────────────────────────────────────────────
-- SoldiBuoni · migrazione 4 (dividere le spese tra chi vive in casa).
-- Idempotente.
-- ─────────────────────────────────────────────────────────────

-- Le persone che dividono le spese: anche senza account (coinquilini, partner).
create table if not exists public.conviventi (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  casa_id uuid not null references public.case on delete cascade,
  nome text not null check (length(nome) between 1 and 40),
  account_id uuid references auth.users on delete set null,
  attivo boolean default true,
  creato_il timestamptz default now(),
  aggiornato_il timestamptz
);
create index if not exists conviventi_casa on public.conviventi (casa_id);

-- Spese divise e rimborsi tra conviventi.
create table if not exists public.movimenti (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  casa_id uuid not null references public.case on delete cascade,
  tipo text not null check (tipo in ('spesa', 'rimborso')),
  descrizione text check (descrizione is null or length(descrizione) <= 80),
  importo numeric(10,2) not null check (importo > 0),
  data date not null,
  pagato_da uuid not null,
  a_chi uuid,
  quote jsonb,
  modo text check (modo is null or modo in ('uguali', 'importi', 'quote')),
  categoria text,
  documento_id uuid,
  ricorrente_id uuid,
  creato_il timestamptz default now(),
  aggiornato_il timestamptz
);
create index if not exists movimenti_casa on public.movimenti (casa_id, data desc);

do $$
declare t text;
begin
  foreach t in array array['conviventi','movimenti'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "chi ci vive" on public.%I', t);
    execute format('create policy "chi ci vive" on public.%I for all using (public.puo_accedere(casa_id)) with check (public.puo_accedere(casa_id))', t);
  end loop;
end $$;

-- Quando una casa si unisce a un'altra (accetta_invito), anche conti e persone la seguono.
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
    update public.conviventi set casa_id = inv.casa_id where casa_id = vecchia;
    update public.movimenti  set casa_id = inv.casa_id where casa_id = vecchia;
    delete from public.case where id = vecchia;
  end loop;
  delete from public.case_membri where user_id = auth.uid();

  insert into public.case_membri (casa_id, user_id) values (inv.casa_id, auth.uid()) on conflict do nothing;
  update public.inviti set usato_da = auth.uid(), usato_il = now() where codice = inv.codice;
  return inv.casa_id;
end $$;
revoke all on function public.accetta_invito(text) from public, anon;
grant execute on function public.accetta_invito(text) to authenticated;

alter table public.eventi drop constraint if exists eventi_nome_check;
alter table public.eventi add constraint eventi_nome_check check (nome in (
  'apertura','onboarding','bolletta_letta','bolletta_errore','voce_manuale','spesa_fissa','account','push_attivate',
  'app_installata','invito_install','condivisione','controllo','controllo_errore','controllo_casa',
  'sezione_condivisa','invito_creato','invito_accettato','dividi_attivato','spesa_divisa','rimborso','sollecito'));

select to_regclass('public.conviventi') as conviventi, to_regclass('public.movimenti') as movimenti;
