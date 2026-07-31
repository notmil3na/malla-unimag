-- MiMalla · Migración: sistema de amistades (Colaboración)
-- ========================================================
-- Cómo usar:
--   1. Abre el dashboard de Supabase → SQL Editor.
--   2. Pega TODO este script y presiona "Run".
--   3. Listo: la tabla queda creada con el esquema que espera la app.
--
-- IMPORTANTE: se hace DROP de cualquier tabla friendships previa.
-- En tu proyecto ya existía una tabla friendships vacía con otro esquema
-- (solo id/status/created_at y columnas no compatibles); el create table
-- if not exists la omitía y el índice sobre user_username fallaba con el
-- error 42703 ("column user_username does not exist"). Esta versión la
-- reemplaza con el esquema correcto.
--
-- Nota: NO se habilita RLS a propósito, igual que las tablas existentes
-- (users, user_data): la app usa la clave pública (anon) para leer y escribir.
-- La relación es canónica: una sola fila por amistad con
-- (user_username, friend_username) ordenados alfabéticamente.
--   status 'pendiente'  → solicitud (requested_by indica quién la envió).
--   status 'aceptado'   → amistad confirmada.

drop table if exists public.friendships cascade;

create table public.friendships (
  id              uuid primary key default gen_random_uuid(),
  user_username   text not null references public.users(username) on delete cascade,
  friend_username text not null references public.users(username) on delete cascade,
  status          text not null default 'pendiente'
                  check (status in ('pendiente', 'aceptado')),
  requested_by    text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_username, friend_username)
);

create index friendships_user_idx   on public.friendships (user_username);
create index friendships_friend_idx on public.friendships (friend_username);
