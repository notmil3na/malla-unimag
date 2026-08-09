-- MiMalla · Migración: columna notasclase (Notas de clase)
-- ========================================================
-- Cómo usar:
--   1. Abre el dashboard de Supabase → SQL Editor.
--   2. Pega TODO este script y presiona "Run".
--   3. Listo: la app guarda los apuntes por materia y el rastro de lo
--      que se enruta al calendario, asignaciones o semestre en
--      notasclase (jsonb).
--
-- Nota: ALTER ... IF NOT EXISTS es idempotente; si la columna ya existe
-- no hace nada, así que se puede ejecutar sin riesgo.

alter table public.user_data add column if not exists notasclase jsonb not null default '{}'::jsonb;
