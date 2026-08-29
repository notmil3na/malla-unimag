-- MiMalla · Migración: chat entre amigos
-- ========================================
-- Cómo usar:
--   1. Abre el dashboard de Supabase → SQL Editor.
--   2. Pega TODO este script y presiona "Run".
--   3. Listo: la tabla queda creada con el esquema que espera la app.
--
-- Reglas:
--   * Sin RLS a propósito, igual que las tablas existentes (users, user_data,
--     friendships): la app usa el backend propio con JWT + service_role, y el
--     backend es quien autoriza toda lectura/escritura.
--   * Un mensaje va en una dirección (sender → recipient). El par
--     (sender, recipient) no está ordenado: para leer una conversación se
--     consulta `where sender/recipient in los dos usernames`.
--   * `payload` (jsonb) lleva el contenido tipado:
--       { kind: "texto", texto }            → mensaje de texto
--       { kind: "imagen", url, nombre }     → imagen adjunta (data URL o URL)
--       { kind: "apuntes", ... }            → resumen de apuntes
--       { kind: "notas", ... }              → resumen de notas del semestre
--       { kind: "asignaciones", ... }       → resumen de asignaciones
--   * `read` marca si el destinatario ya abrió/vió el mensaje.

drop table if exists public.chat_messages cascade;

create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  sender      text not null references public.users(username) on delete cascade,
  recipient   text not null references public.users(username) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index chat_messages_partner_idx
  on public.chat_messages (sender, recipient, created_at);
create index chat_messages_recipient_unread_idx
  on public.chat_messages (recipient, read) where read = false;
