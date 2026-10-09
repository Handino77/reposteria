import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { TipDeEli } from '../components/ui/TipDeEli'
import { Scale, Trash2, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

// Función auxiliar para redondear ÚNICAMENTE el resultado mostrado a medidas prácticas de repostería
function formatearCantidadPractica(valor, unidad) {
  if (isNaN(valor) || valor === null || valor === undefined) return '0'
  const u = (unidad || '').toLowerCase().trim()

  // 1. Gramos (g) y Mililitros (ml): al entero más cercano
  if (u === 'g' || u === 'ml') {
    const v = Math.round(valor)
    return v.toLocaleString('es-CL')
  }

  // 2. Kilos (kg) y Litros (l): a 3 decimales (equivale a 1 g / 1 ml)
  if (u === 'kg' || u === 'l') {
    const v = Math.round(valor * 1000) / 1000
    return v.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  }

  // 3. Unidades (ej. huevos): a la 1/2 (0.5) más cercana
  if (u === 'unidad' || u === 'unidades' || u === 'un') {
    const v = Math.round(valor * 2) / 2
    return v.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
  }

  // 4. Cucharadas, cucharaditas y tazas: al 1/4 (0.25) más cercano
  if (
    u === 'cucharada' ||
    u === 'cucharadas' ||
    u === 'cucharadita' ||
    u === 'cucharaditas' ||
    u === 'taza' ||
    u === 'tazas'
  ) {
    const v = Math.round(valor * 4) / 4
    return v.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  // Por defecto (oz, lb, u otras): 2 decimales
  const v = Math.round(valor * 100) / 100
  return v.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function Escalador({ user }) {
  const [recetasGuardadas, setRecetasGuardadas] = useState([])
  const [recetaSeleccionada, setRecetaSeleccionada] = useState('')
  const [basePorciones, setBasePorciones] = useState(12)
  const [destinoPorciones, setDestinoPorciones] = useState(24)

  const [nombreIng, setNombreIng] = useState('')
  const [cantIng, setCantIng] = useState('')
  const [unidadIng, setUnidadIng] = useState('g')

  const [lineas, setLineas] = useState([])
  const [toastMsg, setToastMsg] = useState('')
  const [guiaOpen, setGuiaOpen] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  useEffect(() => {
    if (user) {
      fetchRecetasGuardadas()
    }
  }, [user])

  const fetchRecetasGuardadas = async () => {
    try {
      const { data, error } = await supabase
        .from('recetas')
        .select(`
          *,
          receta_ingredientes (*)
        `)
        .eq('repostera_id', user.id)
        .order('nombre', { ascending: true })

      if (!error && data) {
        setRecetasGuardadas(data)
      }
    } catch (err) {
      console.error('Error al cargar recetas guardadas:', err)
    }
  }

  const handleCargarReceta = (recetaId) => {
    setRecetaSeleccionada(recetaId)
    if (!recetaId) return

    const r = recetasGuardadas.find((item) => item.id === recetaId)
    if (!r) return

    if (r.rinde) {
      setBasePorciones(r.rinde)
    }

    const ingredientes = Array.isArray(r.receta_ingredientes) ? r.receta_ingredientes : []

    if (ingredientes.length === 0) {
      showToast('Esa receta no tiene ingredientes guardados')
      return
    }

    const novs = [...ingredientes]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((i) => ({
        nombre: i.nombre,
        cant: parseFloat(i.cantidad) || 0,
        unidad: i.unidad || 'g'
      }))

    setLineas(novs)
    showToast(`¡${r.nombre} cargada en el escalador! ⚖️`)
  }

  const handleAddLinea = (e) => {
    e.preventDefault()
    if (!nombreIng.trim() || !cantIng || isNaN(parseFloat(cantIng))) {
      showToast('Ingresa el ingrediente y su cantidad base ⚖️')
      return
    }

    setLineas([
      ...lineas,
      {
        nombre: nombreIng.trim(),
        cant: parseFloat(cantIng),
        unidad: unidadIng
      }
    ])

    setNombreIng('')
    setCantIng('')
    setUnidadIng('g')
    showToast(`¡${nombreIng.trim()} agregado al escalador! ⚖️`)
  }

  const handleDelLinea = (idx) => {
    const nov = lineas.filter((_, i) => i !== idx)
    setLineas(nov)
  }

  const handleLimpiar = () => {
    setLineas([])
    showToast('Lista limpiada')
  }

  const factor = (parseFloat(basePorciones) || 1) > 0 ? (parseFloat(destinoPorciones) || 1) / (parseFloat(basePorciones) || 1) : 1

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Ajusta tu receta (Escalador)"
        introduccion="¿Tu receta rinde para 12 y necesitas 24? Pon los números y nosotros recalculamos cada gramo."
      />

      {/* Mini-Guía desplegable */}
      <div className="bg-[var(--superficie)] border border-[var(--linea)] border-l-4 border-l-[var(--oro)] rounded-[14px] p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setGuiaOpen(!guiaOpen)}
          className="w-full flex items-center justify-between text-left font-bold text-xs md:text-sm text-[var(--tinta)] cursor-pointer"
        >
          <span>💡 ¿Cómo escalar las porciones de tu Receta? (Guía rápida)</span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--oro)] bg-[var(--oro-fondo)] px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2">
            {guiaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {guiaOpen ? 'Ocultar guía' : 'Ver mini-guía'}
          </span>
        </button>

        {guiaOpen && (
          <div className="mt-3 pt-3 border-t border-dashed border-[var(--linea-suave)] text-xs text-[var(--tinta-suave)] space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="bg-[var(--oro-fondo)] text-[var(--oro)] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[11px]">1</span>
              <div><b>Carga tu receta:</b> Elige una receta guardada de la lista o agrega manualmente los ingredientes de tu mezcla original abajo.</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-[var(--oro-fondo)] text-[var(--oro)] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[11px]">2</span>
              <div><b>Indica el cambio de porciones:</b> Ingresa para cuántas porciones rinde tu receta base (ej. 12) y cuántas porciones necesitas hoy (ej. 30).</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-[var(--oro-fondo)] text-[var(--oro)] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[11px]">3</span>
              <div><b>Receta recalculada:</b> La herramienta calcula las proporciones exactas en gramos o mililitros para que tu pastel o mezcla conserve el mismo sabor y textura.</div>
            </div>
          </div>
        )}
      </div>

      {/* Configuración de Porciones e Ingredientes */}
      <Panel
        titulo="Configura las porciones de tu receta"
        subtitulo="Carga una receta o ajusta las porciones para recalcular las cantidades."
      >
        <div className="space-y-4">
          {/* Usar receta guardada */}
          <Campo id="esc-receta-sel" label="Usar una receta guardada (opcional)">
            <Select
              id="esc-receta-sel"
              value={recetaSeleccionada}
              onChange={(e) => handleCargarReceta(e.target.value)}
            >
              <option value="">— escribe tu receta manualmente abajo, o elige una guardada —</option>
              {recetasGuardadas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} (Rinde: {r.rinde})
                </option>
              ))}
            </Select>
          </Campo>

          {/* Porciones base vs destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <Campo id="esc-base-porc" label="Tu receta actual rinde">
              <Input
                id="esc-base-porc"
                type="number"
                step="any"
                className="num font-semibold"
                value={basePorciones}
                onChange={(e) => setBasePorciones(e.target.value)}
              />
            </Campo>

            <Campo id="esc-dest-porc" label="Necesitas que tu receta rinda">
              <Input
                id="esc-dest-porc"
                type="number"
                step="any"
                className="num font-semibold"
                value={destinoPorciones}
                onChange={(e) => setDestinoPorciones(e.target.value)}
              />
            </Campo>
          </div>

          {/* Agregar ingrediente manual */}
          <form onSubmit={handleAddLinea} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="sm:col-span-2">
              <Campo id="esc-ing-nom" label="Ingrediente">
                <Input
                  id="esc-ing-nom"
                  type="text"
                  placeholder="Ej: Huevos / Harina"
                  value={nombreIng}
                  onChange={(e) => setNombreIng(e.target.value)}
                />
              </Campo>
            </div>
            <div>
              <Campo id="esc-ing-cant" label="Cant. Receta Base">
                <Input
                  id="esc-ing-cant"
                  type="number"
                  step="any"
                  placeholder="0"
                  className="num"
                  value={cantIng}
                  onChange={(e) => setCantIng(e.target.value)}
                />
              </Campo>
            </div>
            <div>
              <Campo id="esc-ing-uni" label="Unidad">
                <div className="flex gap-2">
                  <Select
                    id="esc-ing-uni"
                    value={unidadIng}
                    onChange={(e) => setUnidadIng(e.target.value)}
                  >
                    <option value="g">g (gramos)</option>
                    <option value="kg">kg (kilos)</option>
                    <option value="ml">ml (mililitros)</option>
                    <option value="l">l (litros)</option>
                    <option value="cucharadita">cucharadita</option>
                    <option value="cucharada">cucharada</option>
                    <option value="taza">taza</option>
                    <option value="unidad">unidad</option>
                    <option value="oz">oz (onzas)</option>
                    <option value="lb">lb (libras)</option>
                  </Select>
                  <Boton variante="principal" type="submit" size="icono" ariaLabel="Agregar ingrediente al escalador">
                    <Plus className="w-4 h-4 stroke-[2.2]" />
                  </Boton>
                </div>
              </Campo>
            </div>
          </form>
        </div>
      </Panel>

      {/* Tabla Receta Ajustada */}
      <Panel
        titulo="Receta ajustada a tu medida"
        subtitulo={
          lineas.length > 0
            ? `Factor de ajuste: ${factor.toLocaleString('es-CL', { maximumFractionDigits: 2 })}x`
            : undefined
        }
        acciones={
          lineas.length > 0 && (
            <Boton variante="secundario" size="sm" onClick={handleLimpiar}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar lista</span>
            </Boton>
          )
        }
      >
        {lineas.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--tinta-suave)] border border-dashed border-[var(--linea)] rounded-[12px]">
            Agrega los ingredientes de tu receta base arriba para escalarlos.
          </div>
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-[1fr_160px_40px] gap-3 px-4 py-2.5 bg-[#FBF7F2] border-b border-[var(--linea)] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta-suave)] rounded-t-[10px]">
              <span>Ingrediente</span>
              <span>Necesitas</span>
              <span className="text-right">Acción</span>
            </div>

            <div className="divide-y divide-[var(--linea-suave)] space-y-2 md:space-y-0">
              {lineas.map((l, idx) => {
                const valorEscalado = l.cant * factor
                const formateado = formatearCantidadPractica(valorEscalado, l.unidad)
                return (
                  <div
                    key={idx}
                    className="bg-[var(--superficie)] md:bg-transparent border border-[var(--linea)] md:border-0 rounded-[14px] md:rounded-none p-3.5 md:p-3 md:grid md:grid-cols-[1fr_160px_40px] md:gap-3 md:items-center hover:bg-[var(--superficie-2)]/60 transition-colors"
                  >
                    <div className="font-semibold text-xs md:text-[13.5px] text-[var(--tinta)]">
                      {l.nombre}
                    </div>
                    <div className="mt-1 md:mt-0">
                      <Pastilla variante="vino">
                        {formateado} {l.unidad}
                      </Pastilla>
                    </div>
                    <div className="mt-2 md:mt-0 flex justify-end">
                      <Boton
                        variante="icono"
                        size="icono"
                        onClick={() => handleDelLinea(idx)}
                        ariaLabel={`Eliminar ${l.nombre}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Boton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Panel>

      {/* Tip de Eli */}
      <TipDeEli>
        Siempre prueba la mezcla antes de hornear... a veces los hornos son traicioneros. ¡Pero tú puedes con todo!
      </TipDeEli>
    </div>
  )
}
