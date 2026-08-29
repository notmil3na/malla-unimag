-- ═══════════════════════════════════════════════════════════════════════════
-- MiMalla · Migración: Chat entre amigos (módulo /chat)
-- ═══════════════════════════════════════════════════════════════════════════
-- Cómo aplicar: pega este script en el SQL Editor de Supabase y ejecútalo.
-- En el editor de Supabase se ejecuta con permisos administrativos (storage
-- incluido), de modo que el bucket de adjuntos se crea automáticamente.
-- Si prefieres aplicar por partes, el bucket también puede crearse a mano:
--   Storage → New bucket → "chat-attachments" · Público: OFF · Tamaño máx: 8 MB
--
-- Modelo (sin RLS, igual que el resto del proyecto — la autorización se hace
-- en las Vercel Functions con el JWT propio + service role):
--   conversations            → id, channel_token (clave del canal Realtime)
--   conversation_members     → quién está en cada conversación (PK compuesta)
--   conversation_pairs       → garantiza 1:1 a nivel de base de datos
--                              (user_a < user_b + UNIQUE(user_a, user_b)),
--                              además sirve de índice para resolver la
--                              conversación a partir de la pareja canónica.
--   messages                 → mensajes (text / image / file / assignment / note)
--   message_attachments      → archivos firmados con URLs temporales
--   message_academic_items   → índice de contenido de malla compartido
--   chat_messages            → (LA VIEJA) se elimina; supla la nueva arquitectura.
--
-- Nota: message_academic_items conserva un snapshot en messages.content (JSON)
-- para que el receptor pueda "Añadir a mis asignaciones / apuntes" sin necesitar
-- leer user_data del remitente.
-- ═══════════════════════════════════════════════════════════════════════════

drop table if exists public.chat_messages cascade;

drop table if exists public.message_academic_items cascade;
drop table if exists public.message_attachments cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_pairs cascade;
drop table if exists public.conversation_members cascade;
drop table if exists public.conversations cascade;

-- ── Conversaciones ─────────────────────────────────────────────────────────
create table public.conversations (
  id             uuid primary key default gen_random_uuid(),
  channel_token  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  username        text not null references public.users (username) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz,
  primary key (conversation_id, username)
);

create table public.conversation_pairs (
  conversation_id uuid primary key references public.conversations (id) on delete cascade,
  user_a text not null references public.users (username) on delete cascade,
  user_b text not null references public.users (username) on delete cascade,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index conversation_members_user_idx on public.conversation_members (username);

-- ── Mensajes ───────────────────────────────────────────────────────────────
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender          text not null references public.users (username) on delete cascade,
  message_type    text not null default 'text'
                  check (message_type in ('text', 'image', 'file', 'assignment', 'note')),
  content         text not null default '',
  read            boolean not null default false,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id, sender, read)
  where read = false;

create table public.message_attachments (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.messages (id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null default 'application/octet-stream',
  file_size    bigint not null default 0,
  created_at   timestamptz not null default now()
);

create index message_attachments_message_idx on public.message_attachments (message_id);

create table public.message_academic_items (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.messages (id) on delete cascade,
  item_type    text not null check (item_type in ('assignment', 'note')),
  subject_id   text not null default '',
  assignment_id text,
  note_id       text,
  item_payload jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index message_academic_message_idx on public.message_academic_items (message_id);

-- ── Bucket de adjuntos (solo si la función storage está disponible) ───────
do $$
begin
  begin
    perform storage.create_bucket(
      'chat-attachments',
      jsonb_build_object('public', false, 'file_size_limit', 8388608)
    );
  exception when others then
    raise notice 'No se pudo crear el bucket por SQL: créalo manualmente como "chat-attachments" (privado, 8 MB)';
  end;
end $$;