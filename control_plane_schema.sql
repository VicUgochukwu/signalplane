-- Control Plane v1 Schema
create schema if not exists control_plane;

-- Signals table: unified intake from all ships
create table if not exists control_plane.signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null check (signal_type in ('messaging','narrative','icp','horizon')),
  company_id uuid null,
  severity int not null check (severity between 1 and 5),
  confidence numeric null,
  title text not null,
  summary text not null,
  evidence_urls text[] not null default '{}',
  source_schema text not null,
  source_table text not null,
  source_id uuid not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- idempotent ingestion per source record
create unique index if not exists uq_control_plane_signals_source
on control_plane.signals (signal_type, source_schema, source_table, source_id);

create index if not exists idx_control_plane_signals_created
on control_plane.signals (created_at desc);

create index if not exists idx_control_plane_signals_type
on control_plane.signals (signal_type);

-- Packets table: weekly intelligence packets
create table if not exists control_plane.packets (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  packet_title text not null,
  exec_summary text[] not null default '{}',
  sections jsonb not null default '{}'::jsonb,
  key_questions text[] not null default '{}',
  bets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_control_plane_packets_week
on control_plane.packets (week_start, week_end);

-- Packet items: links signals to packets
create table if not exists control_plane.packet_items (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references control_plane.packets(id) on delete cascade,
  signal_id uuid not null references control_plane.signals(id) on delete cascade,
  section text not null check (section in ('messaging','narrative','icp','horizon')),
  rank int not null default 0,
  score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (packet_id, signal_id)
);

create index if not exists idx_control_plane_packet_items_packet
on control_plane.packet_items (packet_id);
