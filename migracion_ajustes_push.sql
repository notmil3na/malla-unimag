-- MiMalla · Migración: columna ajustes (notificaciones push)
-- ========================================================
-- Cómo usar:
--   1. Abre el dashboard de Supabase → SQL Editor.
--   2. Pega TODO este script y presiona "Run".
--   3. Listo: la app guarda la suscripción push y los recordatorios
--      enviados en ajustes.push (jsonb).
--
-- Nota: ALTER ... IF NOT EXISTS es idempotente; si la columna ya existe
-- no hace nada, así que se puede ejecutar sin riesgo.

alter table public.user_data add column if not exists ajustes jsonb not null default '{}'::jsonb;
