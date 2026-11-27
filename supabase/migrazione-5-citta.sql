-- Migrazione 5: il comune della casa (per la TARI e i confronti con la media della città).
-- Facoltativa: finché non la esegui, il comune resta salvato solo sul dispositivo.
alter table public.case add column if not exists citta text;
