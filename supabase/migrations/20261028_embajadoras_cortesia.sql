-- ==============================================================================
-- Migración: Soporte para Embajadoras / Membresías Pro de Cortesía
-- ==============================================================================

-- 1. Actualizar la función para que reconozca tanto 'activa' como 'cortesia'
create or replace function public.es_repostera_pro_o_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from public.reposteras 
    where id = auth.uid() 
      and (estado_suscripcion in ('activa', 'cortesia') or es_admin = true)
  );
$$;

-- 2. Permitir que los administradores puedan ver y actualizar la tabla reposteras
-- (necesario para que Eli pueda listar o activar a sus moderadoras/embajadoras desde el panel)
create policy "reposteras_admin_select"
  on public.reposteras for select
  using (
    exists (select 1 from public.reposteras where id = auth.uid() and es_admin = true)
  );

create policy "reposteras_admin_update"
  on public.reposteras for update
  using (
    exists (select 1 from public.reposteras where id = auth.uid() and es_admin = true)
  )
  with check (
    exists (select 1 from public.reposteras where id = auth.uid() and es_admin = true)
  );
