-- Records partagés d'A18 Darts (V1).
-- À coller une fois dans Supabase : projet « arena18-darts » → SQL Editor → New query → Run.
-- Modération : pour supprimer un record, Table Editor → records → sélectionner la ligne → Delete.

create table if not exists public.records (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('volley', 'checkout', 'oneEighty', 'game')),
  name text not null check (char_length(name) between 1 and 20),
  value int not null,
  game text not null check (game in ('301', '501', '701', 'cricket', 'killer', 'clock', 'high')),
  -- Scores impossibles refusés par la base elle-même.
  constraint records_possible check (
    (kind = 'volley' and value between 0 and 180)
    or (kind = 'checkout' and value between 2 and 170)
    or (kind = 'oneEighty' and value = 180)
    or (kind = 'game' and value = 0)
  )
);

create index if not exists records_created_at on public.records (created_at desc);

-- Personne ne lit la table directement : l'app ne fait qu'ajouter des lignes et lire le résumé ci-dessous.
alter table public.records enable row level security;

drop policy if exists "l'app ajoute des records" on public.records;
create policy "l'app ajoute des records" on public.records
  for insert to anon
  with check (created_at > now() - interval '5 minutes' and created_at < now() + interval '1 minute');

grant insert on public.records to anon;

-- Résumé pour l'accueil : meilleure volée, plus gros checkout, les 180 et le nombre de parties depuis `since`.
create or replace function public.records_summary(since timestamptz)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'best_volley', (
      select json_build_object('name', name, 'value', value) from records
      where kind = 'volley' and created_at >= greatest(since, now() - interval '8 days')
      order by value desc, created_at asc limit 1
    ),
    'best_checkout', (
      select json_build_object('name', name, 'value', value) from records
      where kind = 'checkout' and created_at >= greatest(since, now() - interval '8 days')
      order by value desc, created_at asc limit 1
    ),
    'one_eighties', coalesce((
      select json_agg(name order by first_at desc) from (
        select name, min(created_at) as first_at from records
        where kind = 'oneEighty' and created_at >= greatest(since, now() - interval '8 days')
        group by name
      ) t
    ), '[]'::json),
    'games', (
      select count(*) from records
      where kind = 'game' and created_at >= greatest(since, now() - interval '8 days')
    )
  );
$$;

grant execute on function public.records_summary(timestamptz) to anon;
