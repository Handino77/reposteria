-- ==============================================================================
-- Migración: Protección de contenido PRO a nivel de Base de Datos (PostgreSQL)
-- ==============================================================================

-- 1. Función auxiliar para verificar si el usuario actual tiene acceso PRO o Admin
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
      and (estado_suscripcion = 'activa' or es_admin = true)
  );
$$;

-- 2. Vista segura: rincon_posts_seguros
-- Oculta 'contenido', 'tip_eli' y 'video_url' (devuelve NULL) para posts PRO
-- si la persona no cuenta con suscripción activa ni es admin.
create or replace view public.rincon_posts_seguros as
select
  id,
  tipo,
  acceso,
  titulo,
  extracto,
  fecha_publicacion,
  lectura_minutos,
  tiene_video,
  imagen_url,
  publicado,
  orden,
  creado_en,
  -- Campos protegidos condicionales:
  case
    when acceso = 'free' or public.es_repostera_pro_o_admin() then contenido
    else null
  end as contenido,
  case
    when acceso = 'free' or public.es_repostera_pro_o_admin() then tip_eli
    else null
  end as tip_eli,
  case
    when acceso = 'free' or public.es_repostera_pro_o_admin() then video_url
    else null
  end as video_url
from public.rincon_posts
where publicado = true;

-- Otorgar permisos de lectura en la vista para anon y authenticated
grant select on public.rincon_posts_seguros to anon, authenticated;
