-- Paso 1: campo admin
alter table reposteras add column if not exists es_admin boolean not null default false;

-- Paso 2: tabla de posts
create table if not exists rincon_posts (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receta','tip','negocio','curioso','saludo')),
  acceso text not null default 'free' check (acceso in ('free','pro')),
  titulo text not null,
  extracto text not null,
  contenido text not null default '',
  tip_eli text,
  fecha_publicacion date not null default current_date,
  lectura_minutos int not null default 3,
  tiene_video boolean not null default false,
  video_url text,
  imagen_url text,
  publicado boolean not null default false,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- Paso 3: tabla de eventos
create table if not exists rincon_eventos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references rincon_posts(id) on delete cascade,
  repostera_id uuid references reposteras(id) on delete set null,
  tipo text not null check (tipo in ('lectura','guardado','reaccion')),
  creado_en timestamptz not null default now()
);

-- Paso 4: índice único (un evento por usuario+post+tipo)
create unique index if not exists rincon_eventos_unico
  on rincon_eventos (post_id, repostera_id, tipo)
  where repostera_id is not null;

-- Paso 5: RLS posts
alter table rincon_posts enable row level security;

create policy "rincon_posts_lectura_publica"
  on rincon_posts for select
  using (publicado = true);

create policy "rincon_posts_admin_todo"
  on rincon_posts for all
  using (exists (select 1 from reposteras where id = auth.uid() and es_admin = true))
  with check (exists (select 1 from reposteras where id = auth.uid() and es_admin = true));

-- Paso 6: RLS eventos
alter table rincon_eventos enable row level security;

create policy "rincon_eventos_insertar"
  on rincon_eventos for insert
  with check (repostera_id = auth.uid());

create policy "rincon_eventos_lectura_propia"
  on rincon_eventos for select
  using (repostera_id = auth.uid());

create policy "rincon_eventos_delete_propia"
  on rincon_eventos for delete
  using (repostera_id = auth.uid());

create policy "rincon_eventos_admin_lectura"
  on rincon_eventos for select
  using (exists (select 1 from reposteras where id = auth.uid() and es_admin = true));
