import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Search, BookmarkPlus, BookmarkCheck,
  Heart, Lock, Sparkles, Clock, X, Video, Settings
} from 'lucide-react'
import logoWebP from '../assets/images/logo-cifu.webp'
import logoPNG from '../assets/images/logo-cifu.png'

/* ─── Estáticos de referencia ─────────────────────────────── */
const ETIQUETAS = {
  receta: 'Receta', tip: 'Tip de cocina',
  negocio: 'Negocio repostero', curioso: 'Dato curioso', saludo: 'Saludo de Eli',
}
const COLORES_TIPO = {
  receta:  { fondo: 'bg-[var(--vino-suave)]',   texto: 'text-[var(--vino)]' },
  tip:     { fondo: 'bg-[var(--verde-fondo)]',  texto: 'text-[var(--verde)]' },
  negocio: { fondo: 'bg-[var(--oro-fondo)]',    texto: 'text-[var(--oro)]' },
  curioso: { fondo: 'bg-[var(--oro-fondo)]',    texto: 'text-[var(--oro)]' },
  saludo:  { fondo: 'bg-[var(--superficie-2)]', texto: 'text-[var(--tinta-media)]' },
}
const CATEGORIAS = [
  { id: 'todo', label: 'Todo' }, { id: 'receta', label: 'Recetas' },
  { id: 'tip', label: 'Tips' }, { id: 'curioso', label: 'Datos curiosos' },
  { id: 'negocio', label: 'Negocio' },
]

/* ─── Helper YouTube ─────────────────────────────────────── */
function youtubeEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

/* ─── Ícono play SVG ─────────────────────────────────────── */
function IconoPlay() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white opacity-90" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function RinconDeEli({ isPro = false, isAdmin = false, user, onIrASuscripcion, onAbrirAdmin }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState('todo')
  const [busqueda, setBusqueda] = useState('')
  const [postAbierto, setPostAbierto] = useState(null)
  const [misEventos, setMisEventos] = useState([])   // [{post_id, tipo}]
  const [feedbackVisible, setFeedbackVisible] = useState(false)

  /* ── Cargar posts publicados ── */
  useEffect(() => {
    async function cargar() {
      setLoading(true)
      const { data, error } = await supabase
        .from('rincon_posts')
        .select('*')
        .eq('publicado', true)
        .order('orden', { ascending: true })
        .order('fecha_publicacion', { ascending: false })
      if (!error) setPosts(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  /* ── Cargar eventos del usuario ── */
  useEffect(() => {
    if (!user) return
    async function cargarEventos() {
      const { data } = await supabase
        .from('rincon_eventos')
        .select('post_id, tipo')
        .eq('repostera_id', user.id)
      setMisEventos(data || [])
    }
    cargarEventos()
  }, [user])

  /* ── Helpers de estado ── */
  const tieneEvento = (postId, tipo) => misEventos.some((e) => e.post_id === postId && e.tipo === tipo)
  const puedeVer = (p) => isAdmin || isPro || p.acceso === 'free'
  const noLeidas = posts.filter((p) => puedeVer(p) && !tieneEvento(p.id, 'lectura')).length

  /* ── Registrar evento ── */
  async function registrar(postId, tipo) {
    if (!user) return
    // Insertar; el índice único en BD evita duplicados
    await supabase.from('rincon_eventos').upsert(
      { post_id: postId, repostera_id: user.id, tipo },
      { onConflict: 'post_id,repostera_id,tipo', ignoreDuplicates: true }
    )
    setMisEventos((prev) => {
      if (prev.some((e) => e.post_id === postId && e.tipo === tipo)) return prev
      return [...prev, { post_id: postId, tipo }]
    })
  }

  /* ── Eliminar evento (des-guardar / quitar reacción) ── */
  async function eliminarEvento(postId, tipo) {
    if (!user) return
    await supabase.from('rincon_eventos')
      .delete()
      .eq('post_id', postId)
      .eq('repostera_id', user.id)
      .eq('tipo', tipo)
    setMisEventos((prev) => prev.filter((e) => !(e.post_id === postId && e.tipo === tipo)))
  }

  /* ── Abrir post ── */
  const abrirPost = useCallback(async (p) => {
    setPostAbierto(p)
    setFeedbackVisible(false)
    document.body.style.overflow = 'hidden'
    if (!tieneEvento(p.id, 'lectura')) {
      await registrar(p.id, 'lectura')
    }
  }, [misEventos, user]) // eslint-disable-line

  const cerrarModal = useCallback(() => {
    setPostAbierto(null)
    setFeedbackVisible(false)
    document.body.style.overflow = ''
  }, [])

  /* ── Toggle guardado ── */
  const toggleGuardado = async (postId) => {
    if (tieneEvento(postId, 'guardado')) {
      await eliminarEvento(postId, 'guardado')
    } else {
      await registrar(postId, 'guardado')
      setFeedbackVisible(true)
      setTimeout(() => setFeedbackVisible(false), 2500)
    }
  }

  /* ── Toggle reacción ── */
  const toggleReaccion = async (postId) => {
    if (tieneEvento(postId, 'reaccion')) {
      await eliminarEvento(postId, 'reaccion')
    } else {
      await registrar(postId, 'reaccion')
      setFeedbackVisible(true)
      setTimeout(() => setFeedbackVisible(false), 2500)
    }
  }

  /* ── Escape ── */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') cerrarModal() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [cerrarModal])

  /* ── Filtrado ── */
  const filtrados = posts.filter((p) => {
    if (categoria !== 'todo' && p.tipo !== categoria) return false
    const t = busqueda.toLowerCase()
    return !t || p.titulo.toLowerCase().includes(t) || p.extracto.toLowerCase().includes(t)
  })

  /* ── Render ── */
  return (
    <div className="pb-16">

      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
        <div className="flex items-center gap-4">
          <picture className="shrink-0">
            <source srcSet={logoWebP} type="image/webp" />
            <img src={logoPNG} alt="Eli Cifu" width={68} height={68}
              className="w-[68px] h-[68px] rounded-full object-cover"
              style={{ boxShadow: '0 4px 16px rgba(142,58,88,0.25), 0 0 0 2.5px #8E3A58' }} />
          </picture>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--vino)] mb-0.5">
              El Rincón de Eli
            </p>
            <h1 className="font-serif-title text-[24px] sm:text-[28px] font-semibold leading-tight text-[var(--tinta)] tracking-[-0.02em]">
              Directo de mi cocina<br className="hidden sm:block" /> a la tuya
            </h1>
            <p className="text-[13px] text-[var(--tinta-suave)] mt-1 max-w-xs">
              Tips, recetas y secretos de cocina de Eli Cifu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {noLeidas > 0 && (
            <div className="flex items-center gap-2 bg-[var(--verde-fondo)] text-[var(--verde)] text-[12px] font-bold px-4 py-2.5 rounded-full" aria-live="polite">
              <span className="w-2 h-2 rounded-full bg-[var(--verde)] inline-block" aria-hidden="true" />
              {noLeidas} {noLeidas === 1 ? 'nueva' : 'nuevas'}
            </div>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onAbrirAdmin}
              className="flex items-center gap-2 bg-[var(--superficie)] border border-[var(--linea)] text-[var(--tinta-media)] text-[12px] font-semibold px-3.5 py-2 rounded-full hover:border-[var(--vino-borde)] hover:text-[var(--tinta)] transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 stroke-[1.8]" />
              Administrar
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 bg-[var(--superficie)] border border-[var(--linea)] rounded-[13px] px-4 py-3 mb-4 shadow-[0_4px_12px_rgba(66,42,28,.04)]">
        <Search className="w-4 h-4 text-[var(--tinta-tenue)] shrink-0 stroke-[1.8]" aria-hidden="true" />
        <input type="search" placeholder="Buscar un tip, una receta, una palabra..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-transparent text-[13.5px] text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)] outline-none"
          aria-label="Buscar publicaciones" />
        {busqueda && (
          <button type="button" onClick={() => setBusqueda('')}
            className="text-[var(--tinta-tenue)] hover:text-[var(--tinta)] transition-colors cursor-pointer" aria-label="Limpiar búsqueda">
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        )}
      </div>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6" role="group" aria-label="Filtrar por categoría">
        {CATEGORIAS.map((cat) => (
          <button key={cat.id} type="button" onClick={() => setCategoria(cat.id)} aria-pressed={categoria === cat.id}
            className={`shrink-0 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
              categoria === cat.id
                ? 'bg-[var(--vino)] text-white shadow-[0_4px_12px_rgba(142,58,88,0.25)]'
                : 'bg-[var(--superficie)] border border-[var(--linea)] text-[var(--tinta-media)] hover:border-[var(--vino-borde)] hover:text-[var(--tinta)]'
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--superficie)] rounded-[16px] overflow-hidden animate-pulse">
              <div className="h-[108px] bg-[var(--linea)]" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-2.5 bg-[var(--linea)] rounded w-1/3" />
                <div className="h-4 bg-[var(--linea)] rounded w-4/5" />
                <div className="h-3 bg-[var(--linea)] rounded w-full" />
                <div className="h-3 bg-[var(--linea)] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && filtrados.length === 0 && (
        <div className="text-center py-16 text-[var(--tinta-suave)]">
          <p className="font-serif-title text-[18px] mb-2">
            {posts.length === 0 ? 'Pronto habrá contenido aquí' : 'Sin resultados'}
          </p>
          <p className="text-[13px]">
            {posts.length === 0 ? 'Eli está preparando los primeros posts.' : 'Prueba con otra palabra o categoría.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((p) => {
            const leido = tieneEvento(p.id, 'lectura')
            const guardado = tieneEvento(p.id, 'guardado')
            const colores = COLORES_TIPO[p.tipo] || COLORES_TIPO.saludo
            const bloqueado = !puedeVer(p)

            return (
              <article key={p.id}
                className={`bg-[var(--superficie)] rounded-[16px] overflow-hidden shadow-[0_6px_20px_rgba(66,42,28,.06)] flex flex-col cursor-pointer transition-all hover:shadow-[0_12px_30px_rgba(66,42,28,.12)] hover:-translate-y-[3px] ${leido ? 'opacity-80 hover:opacity-100' : ''}`}
                onClick={() => abrirPost(p)}>

                {/* Cabecera */}
                <div className={`h-[120px] flex items-center justify-center relative overflow-hidden`}
                  style={p.imagen_url ? {} : undefined}>
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <div className={`absolute inset-0 ${colores.fondo}`} />}
                  {/* Badges */}
                  {!leido && !guardado && (
                    <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-[var(--vino)] z-10" aria-label="No leída" />
                  )}
                  {guardado && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold bg-[var(--verde-fondo)] text-[var(--verde)] px-2 py-1 rounded-full z-10">
                      <BookmarkCheck className="w-3 h-3 stroke-[2]" aria-hidden="true" />Guardada
                    </span>
                  )}
                  {p.tiene_video && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold bg-[var(--tinta)] text-white px-2 py-1 rounded-full z-10">
                      <Video className="w-3 h-3 stroke-[2]" aria-hidden="true" />Video
                    </span>
                  )}
                  <span className={`absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full z-10 ${p.acceso === 'free' ? 'bg-[var(--verde-fondo)] text-[var(--verde)]' : 'bg-[var(--oro-fondo)] text-[var(--oro)]'}`}>
                    {p.acceso === 'free' ? 'Gratis' : 'Pro'}
                  </span>
                  {bloqueado && (
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center z-10">
                      <Lock className="w-5 h-5 text-white opacity-70 stroke-[1.5]" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Cuerpo */}
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${colores.texto}`}>
                    {ETIQUETAS[p.tipo]}
                  </span>
                  <h2 className="font-serif-title text-[15.5px] font-semibold leading-snug text-[var(--tinta)] tracking-[-0.01em]">
                    {p.titulo}
                  </h2>
                  <p className="text-[12px] text-[var(--tinta-suave)] leading-relaxed flex-1">{p.extracto}</p>
                  <div className="flex items-center justify-between text-[10.5px] text-[var(--tinta-tenue)] border-t border-[var(--linea-suave)] pt-2.5 mt-1">
                    <span>{new Date(p.fecha_publicacion + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' })}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 stroke-[1.8]" aria-hidden="true" />{p.lectura_minutos} min
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {postAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal() }}
          role="dialog" aria-modal="true" aria-label={postAbierto.titulo}>
          <div className="bg-[var(--superficie)] w-full max-w-2xl rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,.22)] mb-10"
            style={{ animation: 'fadeUpModal .22s ease' }}>

            {/* Header modal */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex-1 min-w-0 pr-4">
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${COLORES_TIPO[postAbierto.tipo]?.texto || 'text-[var(--tinta-tenue)]'}`}>
                  {ETIQUETAS[postAbierto.tipo]}
                </span>
                <h2 className="font-serif-title text-[20px] sm:text-[24px] font-semibold leading-tight text-[var(--tinta)] tracking-[-0.02em] mt-1">
                  {postAbierto.titulo}
                </h2>
                <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-1.5 flex flex-wrap items-center gap-2">
                  <span>{new Date(postAbierto.fecha_publicacion + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' })}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 stroke-[1.8]" aria-hidden="true" />{postAbierto.lectura_minutos} min
                  </span>
                  <span className={`font-bold ${postAbierto.acceso === 'free' ? 'text-[var(--verde)]' : 'text-[var(--oro)]'}`}>
                    {postAbierto.acceso === 'free' ? 'Gratis' : 'Pro'}
                  </span>
                </p>
              </div>
              <button type="button" onClick={cerrarModal}
                className="shrink-0 w-9 h-9 rounded-full bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-center text-[var(--tinta-suave)] hover:bg-[var(--vino-suave)] hover:text-[var(--vino)] transition-colors cursor-pointer"
                aria-label="Cerrar">
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-5">
              {/* Imagen de portada si existe */}
              {postAbierto.imagen_url && (
                <img src={postAbierto.imagen_url} alt="" className="w-full h-48 object-cover rounded-[14px]" />
              )}

              {/* Bloqueado */}
              {!puedeVer(postAbierto) && (
                <>
                  <div className="relative max-h-[100px] overflow-hidden text-[14px] text-[var(--tinta-suave)] leading-relaxed select-none">
                    <p>{postAbierto.extracto}</p>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--superficie)]" />
                  </div>
                  <div className="bg-[var(--tinta)] rounded-[16px] p-6 text-center">
                    <Lock className="w-6 h-6 text-[var(--oro)] mx-auto mb-3 stroke-[1.5]" aria-hidden="true" />
                    <h3 className="font-serif-title text-[17px] font-semibold text-white mb-1.5">
                      Contenido exclusivo Plan Pro
                    </h3>
                    <p className="text-[13px] text-white/70 mb-4 max-w-xs mx-auto leading-relaxed">
                      Suscríbete y accede a todas las recetas, tips y videos de Eli sin límites.
                    </p>
                    <button type="button"
                      onClick={() => { cerrarModal(); onIrASuscripcion?.() }}
                      className="inline-flex items-center gap-2 bg-[var(--oro-fondo)] text-[var(--oro)] font-bold text-[13px] px-5 py-2.5 rounded-full hover:brightness-95 transition-all cursor-pointer">
                      <Sparkles className="w-4 h-4 stroke-[1.8]" aria-hidden="true" />
                      Conocer el Plan Pro
                    </button>
                  </div>
                </>
              )}

              {/* Contenido completo */}
              {puedeVer(postAbierto) && (
                <>
                  {/* Video */}
                  {postAbierto.tiene_video && postAbierto.video_url && youtubeEmbedUrl(postAbierto.video_url) ? (
                    <div className="rounded-[14px] overflow-hidden aspect-video">
                      <iframe
                        src={youtubeEmbedUrl(postAbierto.video_url)}
                        title={postAbierto.titulo}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : postAbierto.tiene_video ? (
                    <div className="bg-[var(--tinta)] rounded-[14px] aspect-video flex flex-col items-center justify-center gap-3 relative">
                      <div className="w-14 h-14 rounded-full border-2 border-white/40 bg-white/10 flex items-center justify-center">
                        <IconoPlay />
                      </div>
                      <p className="text-white/70 text-[13px]">Video próximamente</p>
                    </div>
                  ) : null}

                  {/* Texto */}
                  <div className="text-[14px] text-[var(--tinta)] leading-[1.75] space-y-3">
                    {postAbierto.contenido.split('\n\n').map((par, i) => (
                      <p key={i}>{par}</p>
                    ))}
                  </div>

                  {/* Tip de Eli */}
                  {postAbierto.tip_eli && (
                    <div className="rounded-[13px] p-4 px-5" style={{ background: '#FBF1F4', border: '1px solid #EAD7DC' }}>
                      <p className="font-serif-title italic text-[15px] font-semibold leading-snug text-[var(--vino-oscuro)]">
                        "{postAbierto.tip_eli}"
                      </p>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--tinta-tenue)] mt-2">
                        — Tip de Eli
                      </p>
                    </div>
                  )}

                  {/* Acción guardar */}
                  {postAbierto.tipo === 'receta' && user && (
                    <AccionReceta
                      guardada={tieneEvento(postAbierto.id, 'guardado')}
                      onToggle={() => toggleGuardado(postAbierto.id)}
                      feedbackVisible={feedbackVisible}
                    />
                  )}
                  {/* Acción útil */}
                  {['tip', 'curioso', 'negocio'].includes(postAbierto.tipo) && user && (
                    <AccionUtil
                      activa={tieneEvento(postAbierto.id, 'reaccion')}
                      onToggle={() => toggleReaccion(postAbierto.id)}
                      feedbackVisible={feedbackVisible}
                    />
                  )}
                  {/* Sin sesión */}
                  {!user && ['receta','tip','curioso','negocio'].includes(postAbierto.tipo) && (
                    <p className="text-center text-[12.5px] text-[var(--tinta-tenue)]">
                      Inicia sesión para guardar y reaccionar al contenido.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <style>{`@keyframes fadeUpModal{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
        </div>
      )}
    </div>
  )
}

/* ─── Acciones ──────────────────────────────────────────────── */
function AccionReceta({ guardada, onToggle, feedbackVisible }) {
  return (
    <div className="bg-[var(--fondo)] rounded-[13px] p-4 flex flex-col items-center gap-3 text-center border border-[var(--linea)]">
      <p className="text-[13px] text-[var(--tinta-suave)]">
        ¿Te gustó esta receta? Guárdala en <strong className="text-[var(--tinta)]">Mis Recetas</strong> para tenerla siempre a mano.
      </p>
      <button type="button" onClick={onToggle} aria-pressed={guardada}
        className={`inline-flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer ${guardada ? 'bg-[var(--verde-fondo)] text-[var(--verde)]' : 'bg-[var(--vino)] text-white shadow-[0_6px_16px_rgba(142,58,88,.25)] hover:brightness-110'}`}>
        {guardada
          ? <><BookmarkCheck className="w-4 h-4 stroke-[2]" aria-hidden="true" />Guardada en Mis Recetas</>
          : <><BookmarkPlus className="w-4 h-4 stroke-[2]" aria-hidden="true" />Guardar en Mis Recetas</>}
      </button>
      <p className={`text-[12px] font-semibold text-[var(--verde)] transition-all duration-300 ${feedbackVisible && guardada ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
        ¡Listo! La encuentras en "Mis Recetas"
      </p>
    </div>
  )
}

function AccionUtil({ activa, onToggle, feedbackVisible }) {
  return (
    <div className="bg-[var(--fondo)] rounded-[13px] p-4 flex flex-col items-center gap-3 text-center border border-[var(--linea)]">
      <p className="text-[13px] text-[var(--tinta-suave)]">¿Te sirvió este contenido?</p>
      <button type="button" onClick={onToggle} aria-pressed={activa}
        className={`inline-flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer ${activa ? 'bg-[var(--verde-fondo)] text-[var(--verde)]' : 'bg-[var(--vino-suave)] text-[var(--vino)] border border-[var(--vino-borde)] hover:bg-[var(--vino)] hover:text-white'}`}>
        <Heart className={`w-4 h-4 stroke-[2] ${activa ? 'fill-current' : ''}`} aria-hidden="true" />
        {activa ? 'Marcado como útil' : 'Me sirvió'}
      </button>
      <p className={`text-[12px] font-semibold text-[var(--verde)] transition-all duration-300 ${feedbackVisible && activa ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
        ¡Gracias por el feedback!
      </p>
    </div>
  )
}
