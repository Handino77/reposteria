import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, BarChart2,
  ArrowLeft, Save, Upload, X, CheckCircle, AlertCircle,
  Clock, BookOpen, Lightbulb, TrendingUp, MessageCircle
} from 'lucide-react'

const TIPOS = [
  { id: 'receta',  label: 'Receta' },
  { id: 'tip',     label: 'Tip de cocina' },
  { id: 'negocio', label: 'Negocio repostero' },
  { id: 'curioso', label: 'Dato curioso' },
  { id: 'saludo',  label: 'Saludo' },
]

const POST_VACIO = {
  tipo: 'tip', acceso: 'free', titulo: '', extracto: '',
  contenido: '', tip_eli: '', fecha_publicacion: new Date().toISOString().split('T')[0],
  lectura_minutos: 3, tiene_video: false, video_url: '', imagen_url: '', publicado: false, orden: 0,
}

const COLORES_TIPO = {
  receta:  'bg-[var(--vino-suave)] text-[var(--vino)]',
  tip:     'bg-[var(--verde-fondo)] text-[var(--verde)]',
  negocio: 'bg-[var(--oro-fondo)] text-[var(--oro)]',
  curioso: 'bg-[var(--oro-fondo)] text-[var(--oro)]',
  saludo:  'bg-[var(--superficie-2)] text-[var(--tinta-media)]',
}

/* ── helpers ── */
function youtubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function Alerta({ tipo, mensaje, onClose }) {
  if (!mensaje) return null
  const esito = tipo === 'ok'
  return (
    <div className={`flex items-center gap-3 rounded-[11px] px-4 py-3 text-[13px] font-medium mb-4 ${esito ? 'bg-[var(--verde-fondo)] text-[var(--verde)]' : 'bg-red-50 text-red-700'}`}>
      {esito ? <CheckCircle className="w-4 h-4 shrink-0 stroke-[2]" /> : <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />}
      <span className="flex-1">{mensaje}</span>
      <button type="button" onClick={onClose} className="cursor-pointer"><X className="w-3.5 h-3.5 stroke-[2]" /></button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function RinconAdmin({ onVolver }) {
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)   // null = lista, 'nuevo' | post = formulario
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' })
  const [metricas, setMetricas] = useState(null)

  const cerrarAlerta = () => setAlerta({ tipo: '', mensaje: '' })
  const ok = (m) => setAlerta({ tipo: 'ok', mensaje: m })
  const err = (m) => setAlerta({ tipo: 'error', mensaje: m })

  /* ── Cargar posts ── */
  async function cargarPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rincon_posts')
      .select('*')
      .order('orden', { ascending: true })
      .order('creado_en', { ascending: false })
    if (error) { err('Error al cargar posts: ' + error.message); setLoading(false); return }
    setPosts(data || [])
    setLoading(false)
  }

  /* ── Cargar métricas ── */
  async function cargarMetricas() {
    const { data, error } = await supabase
      .from('rincon_eventos')
      .select('post_id, tipo, rincon_posts(titulo, tipo)')
    if (error) { err('Error al cargar métricas: ' + error.message); return }
    setMetricas(data || [])
  }

  useEffect(() => { cargarPosts() }, [])
  useEffect(() => { if (tab === 'metricas') cargarMetricas() }, [tab])

  /* ── Publicar / despublicar ── */
  async function togglePublicado(post) {
    const { error } = await supabase
      .from('rincon_posts')
      .update({ publicado: !post.publicado })
      .eq('id', post.id)
    if (error) { err('Error: ' + error.message); return }
    ok(post.publicado ? 'Post ocultado.' : 'Post publicado.')
    cargarPosts()
  }

  /* ── Eliminar ── */
  async function eliminar(post) {
    if (!window.confirm(`¿Eliminar "${post.titulo}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('rincon_posts').delete().eq('id', post.id)
    if (error) { err('Error al eliminar: ' + error.message); return }
    ok('Post eliminado.')
    cargarPosts()
  }

  /* ── Guardar (crear / actualizar) ── */
  async function guardarPost(datos, imagenFile) {
    let imagen_url = datos.imagen_url

    // Subir imagen si hay archivo nuevo
    if (imagenFile) {
      const ext = imagenFile.name.split('.').pop()
      const nombre = `${Date.now()}.${ext}`
      const { error: upError } = await supabase.storage
        .from('rincon-imagenes')
        .upload(nombre, imagenFile, { upsert: true })
      if (upError) { err('Error al subir imagen: ' + upError.message); return }
      const { data: urlData } = supabase.storage.from('rincon-imagenes').getPublicUrl(nombre)
      imagen_url = urlData.publicUrl
    }

    const payload = { ...datos, imagen_url, video_url: datos.video_url || null, tip_eli: datos.tip_eli || null }
    delete payload.id

    let error
    if (editando === 'nuevo') {
      ;({ error } = await supabase.from('rincon_posts').insert(payload))
    } else {
      ;({ error } = await supabase.from('rincon_posts').update(payload).eq('id', editando.id))
    }
    if (error) { err('Error al guardar: ' + error.message); return }
    ok(editando === 'nuevo' ? 'Post creado.' : 'Post actualizado.')
    setEditando(null)
    cargarPosts()
  }

  /* ── Vista ── */
  if (editando !== null) {
    return (
      <FormPost
        post={editando === 'nuevo' ? POST_VACIO : editando}
        onGuardar={guardarPost}
        onCancelar={() => setEditando(null)}
        alerta={alerta}
        cerrarAlerta={cerrarAlerta}
      />
    )
  }

  return (
    <div className="pb-16">
      {/* Header admin */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--vino)] mb-0.5">
            Panel de administración
          </p>
          <h1 className="font-serif-title text-[24px] font-semibold text-[var(--tinta)] tracking-[-0.02em]">
            El Rincón de Eli
          </h1>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--tinta-suave)] hover:text-[var(--tinta)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
          Volver al Rincón
        </button>
      </div>

      <Alerta {...alerta} onClose={cerrarAlerta} />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'posts', label: 'Posts', icon: BookOpen }, { id: 'metricas', label: 'Métricas', icon: BarChart2 }].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--vino)] text-white shadow-[0_4px_12px_rgba(142,58,88,.25)]'
                  : 'bg-[var(--superficie)] border border-[var(--linea)] text-[var(--tinta-media)] hover:text-[var(--tinta)]'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[1.8]" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Posts ── */}
      {tab === 'posts' && (
        <>
          <button
            type="button"
            onClick={() => setEditando('nuevo')}
            className="inline-flex items-center gap-2 bg-[var(--vino)] text-white text-[12.5px] font-bold px-4 py-2.5 rounded-[11px] shadow-[0_4px_12px_rgba(142,58,88,.25)] hover:brightness-110 transition-all cursor-pointer mb-5"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            Nuevo post
          </button>

          {loading && (
            <p className="text-[13px] text-[var(--tinta-suave)]">Cargando posts...</p>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-14 text-[var(--tinta-suave)]">
              <p className="font-serif-title text-[18px] mb-2">Sin posts aún</p>
              <p className="text-[13px]">Crea el primero con el botón de arriba.</p>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="flex flex-col gap-2">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[14px] p-4 flex items-center gap-4"
                >
                  {/* Estado publicado */}
                  <button
                    type="button"
                    onClick={() => togglePublicado(p)}
                    title={p.publicado ? 'Ocultar' : 'Publicar'}
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      p.publicado
                        ? 'bg-[var(--verde-fondo)] text-[var(--verde)] hover:brightness-95'
                        : 'bg-[var(--superficie-2)] border border-[var(--linea)] text-[var(--tinta-tenue)] hover:bg-[var(--verde-fondo)] hover:text-[var(--verde)]'
                    }`}
                  >
                    {p.publicado
                      ? <Eye className="w-4 h-4 stroke-[1.8]" />
                      : <EyeOff className="w-4 h-4 stroke-[1.8]" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${COLORES_TIPO[p.tipo]}`}>
                        {p.tipo}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.acceso === 'free' ? 'bg-[var(--verde-fondo)] text-[var(--verde)]' : 'bg-[var(--oro-fondo)] text-[var(--oro)]'}`}>
                        {p.acceso === 'free' ? 'Gratis' : 'Pro'}
                      </span>
                      {!p.publicado && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--superficie-2)] text-[var(--tinta-tenue)] border border-[var(--linea)]">
                          Borrador
                        </span>
                      )}
                    </div>
                    <p className="text-[13.5px] font-semibold text-[var(--tinta)] truncate">
                      {p.titulo}
                    </p>
                    <p className="text-[11.5px] text-[var(--tinta-tenue)]">
                      {p.fecha_publicacion} · {p.lectura_minutos} min
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditando(p)}
                      title="Editar"
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[var(--tinta-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[1.8]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(p)}
                      title="Eliminar"
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[var(--tinta-suave)] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab Métricas ── */}
      {tab === 'metricas' && <TabMetricas metricas={metricas} posts={posts} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
/* Formulario de post                                          */
/* ═══════════════════════════════════════════════════════════ */
function FormPost({ post, onGuardar, onCancelar, alerta, cerrarAlerta }) {
  const [datos, setDatos] = useState({ ...post })
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(post.imagen_url || null)
  const [guardando, setGuardando] = useState(false)
  const fileRef = useRef()

  const set = (k, v) => setDatos((d) => ({ ...d, [k]: v }))

  const handleImagen = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImagenFile(f)
    setImagenPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!datos.titulo.trim()) return
    setGuardando(true)
    await onGuardar(datos, imagenFile)
    setGuardando(false)
  }

  const campoClass = "w-full bg-[var(--superficie-2)] border border-[var(--linea)] rounded-[11px] px-3.5 py-2.5 text-[13.5px] text-[var(--tinta)] placeholder:text-[var(--tinta-tenue)] outline-none focus:border-[#BD8197] focus:shadow-[0_0_0_3px_rgba(142,58,88,.08)] transition-all"
  const labelClass = "block text-[11.5px] font-semibold text-[var(--tinta-media)] mb-1.5"

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--vino)] mb-0.5">
            Panel de administración
          </p>
          <h1 className="font-serif-title text-[22px] font-semibold text-[var(--tinta)]">
            {post.id ? 'Editar post' : 'Nuevo post'}
          </h1>
        </div>
        <button type="button" onClick={onCancelar} className="text-[12.5px] font-semibold text-[var(--tinta-suave)] hover:text-[var(--tinta)] flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[1.8]" /> Cancelar
        </button>
      </div>

      <Alerta {...alerta} onClose={cerrarAlerta} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* Tipo */}
        <div>
          <label className={labelClass}>Tipo</label>
          <select className={campoClass} value={datos.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Acceso */}
        <div>
          <label className={labelClass}>Acceso</label>
          <select className={campoClass} value={datos.acceso} onChange={(e) => set('acceso', e.target.value)}>
            <option value="free">Gratis (todas)</option>
            <option value="pro">Solo Pro</option>
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className={labelClass}>Fecha de publicación</label>
          <input type="date" className={campoClass} value={datos.fecha_publicacion}
            onChange={(e) => set('fecha_publicacion', e.target.value)} />
        </div>

        {/* Tiempo */}
        <div>
          <label className={labelClass}>Tiempo de lectura (minutos)</label>
          <input type="number" min={1} max={30} className={campoClass} value={datos.lectura_minutos}
            onChange={(e) => set('lectura_minutos', Number(e.target.value))} />
        </div>
      </div>

      {/* Título */}
      <div className="mb-4">
        <label className={labelClass}>Título <span className="text-red-500">*</span></label>
        <input type="text" required className={campoClass} placeholder="Título del post..."
          value={datos.titulo} onChange={(e) => set('titulo', e.target.value)} />
      </div>

      {/* Extracto */}
      <div className="mb-4">
        <label className={labelClass}>Extracto (resumen corto para la tarjeta)</label>
        <textarea rows={2} className={campoClass} placeholder="Una o dos líneas que aparecen en la tarjeta..."
          value={datos.extracto} onChange={(e) => set('extracto', e.target.value)} />
      </div>

      {/* Contenido */}
      <div className="mb-4">
        <label className={labelClass}>Contenido completo</label>
        <textarea rows={8} className={campoClass} placeholder="El texto completo del post. Separa párrafos con una línea en blanco."
          value={datos.contenido} onChange={(e) => set('contenido', e.target.value)} />
        <p className="text-[11px] text-[var(--tinta-tenue)] mt-1">Separa párrafos con una línea en blanco (Enter dos veces).</p>
      </div>

      {/* Tip de Eli */}
      <div className="mb-5">
        <label className={labelClass}>Tip de Eli (aparece en el bloque rosado)</label>
        <textarea rows={2} className={campoClass} placeholder="El consejo especial de Eli para este post..."
          value={datos.tip_eli || ''} onChange={(e) => set('tip_eli', e.target.value)} />
      </div>

      {/* Imagen */}
      <div className="mb-5">
        <label className={labelClass}>Imagen de portada</label>
        <div className="flex items-start gap-4">
          {imagenPreview && (
            <div className="relative shrink-0">
              <img src={imagenPreview} alt="Preview" className="w-24 h-24 object-cover rounded-[12px] border border-[var(--linea)]" />
              <button type="button" onClick={() => { setImagenFile(null); setImagenPreview(null); set('imagen_url', '') }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full border border-[var(--linea)] flex items-center justify-center text-[var(--tinta-suave)] hover:text-red-600 cursor-pointer">
                <X className="w-3 h-3 stroke-[2]" />
              </button>
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-[var(--superficie-2)] border border-[var(--linea)] border-dashed text-[12.5px] font-semibold text-[var(--tinta-media)] px-4 py-3 rounded-[11px] hover:border-[var(--vino-borde)] hover:text-[var(--tinta)] transition-all cursor-pointer">
            <Upload className="w-4 h-4 stroke-[1.8]" />
            {imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
        </div>
      </div>

      {/* Video */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="tiene_video" checked={datos.tiene_video}
            onChange={(e) => set('tiene_video', e.target.checked)}
            className="w-4 h-4 accent-[var(--vino)] cursor-pointer" />
          <label htmlFor="tiene_video" className="text-[13px] font-semibold text-[var(--tinta)] cursor-pointer">
            Este post tiene video
          </label>
        </div>
        {datos.tiene_video && (
          <div>
            <label className={labelClass}>URL de YouTube</label>
            <input type="url" className={campoClass} placeholder="https://www.youtube.com/watch?v=..."
              value={datos.video_url || ''} onChange={(e) => set('video_url', e.target.value)} />
            {datos.video_url && youtubeEmbedUrl(datos.video_url) && (
              <p className="text-[11px] text-[var(--verde)] mt-1 font-medium">URL válida de YouTube ✓</p>
            )}
          </div>
        )}
      </div>

      {/* Publicado */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-[var(--superficie-2)] rounded-[12px] border border-[var(--linea)]">
        <input type="checkbox" id="publicado" checked={datos.publicado}
          onChange={(e) => set('publicado', e.target.checked)}
          className="w-4 h-4 accent-[var(--vino)] cursor-pointer" />
        <label htmlFor="publicado" className="text-[13px] font-semibold text-[var(--tinta)] cursor-pointer">
          Publicar ahora
        </label>
        <span className="text-[12px] text-[var(--tinta-tenue)]">
          {datos.publicado ? '— visible para las reposteras' : '— guardado como borrador'}
        </span>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={guardando || !datos.titulo.trim()}
          className="inline-flex items-center gap-2 bg-[var(--vino)] text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px] shadow-[0_4px_12px_rgba(142,58,88,.25)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Save className="w-4 h-4 stroke-[2]" />
          {guardando ? 'Guardando...' : 'Guardar post'}
        </button>
        <button type="button" onClick={onCancelar}
          className="text-[13px] font-semibold text-[var(--tinta-suave)] hover:text-[var(--tinta)] px-4 cursor-pointer transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════ */
/* Tab de métricas                                             */
/* ═══════════════════════════════════════════════════════════ */
function TabMetricas({ metricas, posts }) {
  if (!metricas) {
    return <p className="text-[13px] text-[var(--tinta-suave)]">Cargando métricas...</p>
  }

  const total = (tipo) => metricas.filter((e) => e.tipo === tipo).length

  const porPost = posts.map((p) => {
    const ev = metricas.filter((e) => e.post_id === p.id)
    const lecturas = ev.filter((e) => e.tipo === 'lectura').length
    const guardados = ev.filter((e) => e.tipo === 'guardado').length
    const reacciones = ev.filter((e) => e.tipo === 'reaccion').length
    return { ...p, lecturas, guardados, reacciones, tasa: lecturas ? Math.round(((guardados + reacciones) / lecturas) * 100) : 0 }
  }).filter((p) => p.lecturas > 0).sort((a, b) => b.lecturas - a.lecturas)

  const maxLecturas = Math.max(1, ...porPost.map((p) => p.lecturas))

  const KPI = ({ n, label, color }) => (
    <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[14px] p-4 text-center">
      <p className={`font-serif-title text-[28px] font-semibold ${color}`}>{n}</p>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--tinta-tenue)] mt-1">{label}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI n={total('lectura')} label="Lecturas" color="text-[var(--tinta)]" />
        <KPI n={total('guardado')} label="Guardados" color="text-[var(--vino)]" />
        <KPI n={total('reaccion')} label="Reacciones" color="text-[var(--verde)]" />
        <KPI
          n={total('lectura') ? Math.round(((total('guardado') + total('reaccion')) / total('lectura')) * 100) + '%' : '—'}
          label="Tasa interacción"
          color="text-[var(--oro)]"
        />
      </div>

      {/* Ranking por post */}
      {porPost.length === 0 ? (
        <div className="text-center py-12 text-[var(--tinta-suave)]">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30 stroke-[1.5]" />
          <p className="text-[14px]">Aún no hay interacciones registradas.</p>
          <p className="text-[12px] mt-1">Aparecerán aquí cuando las reposteras lean los posts.</p>
        </div>
      ) : (
        <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[16px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--linea)]">
            <h2 className="text-[14px] font-bold text-[var(--tinta)]">Posts por interacción</h2>
          </div>
          <div className="divide-y divide-[var(--linea-suave)]">
            {porPost.map((p) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center gap-4">
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${COLORES_TIPO[p.tipo]}`}>
                  {p.tipo}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--tinta)] truncate">{p.titulo}</p>
                  <div className="mt-1.5 h-1.5 bg-[var(--linea)] rounded-full overflow-hidden w-full max-w-[200px]">
                    <div
                      className="h-full bg-[var(--vino)] rounded-full transition-all"
                      style={{ width: `${Math.round((p.lecturas / maxLecturas) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 grid grid-cols-3 gap-3 text-center">
                  {[
                    { v: p.lecturas, l: 'Lecturas', i: Eye },
                    { v: p.guardados, l: 'Guard.', i: BookOpen },
                    { v: p.reacciones, l: 'React.', i: MessageCircle },
                  ].map(({ v, l, i: Icon }) => (
                    <div key={l}>
                      <p className="text-[14px] font-bold text-[var(--tinta)]">{v}</p>
                      <p className="text-[10px] text-[var(--tinta-tenue)]">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-bold text-[var(--oro)]">{p.tasa}%</p>
                  <p className="text-[10px] text-[var(--tinta-tenue)]">Tasa</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11.5px] text-[var(--tinta-tenue)] italic">
        La tasa de interacción = (guardados + reacciones) ÷ lecturas. Mide qué tan valioso es el contenido para quien lo lee.
      </p>
    </div>
  )
}
