-- MiMalla · Migración: columna birthdate (fecha de nacimiento en Mi Perfil)
-- ========================================================
-- Cómo usar:
--   1. Abre el dashboard de Supabase → SQL Editor.
--   2. Pega TODO este script y presiona "Run".
--   3. Listo: la app guarda y muestra la fecha de nacimiento en Mi Perfil.
--
-- Nota: ALTER ... IF NOT EXISTS es idempotente; si la columna ya existe
-- no hace nada, así que se puede ejecutar sin riesgo.

alter table public.users add column if not exists birthdate date;
