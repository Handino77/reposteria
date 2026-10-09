import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { convertirACantidadBase, CLP } from '../utils/conversores'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { TarjetaIndicador } from '../components/ui/TarjetaIndicador'
import { TipDeEli } from '../components/ui/TipDeEli'
import { Calculator, Plus, Trash2, Share2, RefreshCw, Loader2, Sparkles } from 'lucide-react'

export default function PrecioJusto({ recetaPrecargada }) {
  const [despensaItems, setDespensaItems] = useState([])
  const [recetasGuardadas, setRecetasGuardadas] = useState([])
  const [loading, setLoading] = useState(true)

  // Líneas de la calculadora { despensa_id, nombre, cant, unidad }
  const [lineas, setLineas] = useState([])

  // Atajo receta guardada
  const [selectedRecetaId, setSelectedRecetaId] = useState('')
  const [multiplicador, setMultiplicador] = useState(1)

  // Línea manual
  const [selDespensaId, setSelDespensaId] = useState('')
  const [manualCant, setManualCant] = useState('')
  const [manualUnidad, setManualUnidad] = useState('g')

  // Inputs editables
  const [horas, setHoras] = useState(1)
  const [valorHora, setValorHora] = useState(3500)
  const [otros, setOtros] = useState(1000)
  const [margen, setMargen] = useState(40)
  const [rinde, setRinde] = useState(1)

  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  useEffect(() => {
    fetchDatos()
  }, [])

  useEffect(() => {
    if (recetaPrecargada) {
      cargarRecetaDirecta(recetaPrecargada)
    }
  }, [recetaPrecargada])

  const fetchDatos = async () => {
    try {
      setLoading(true)
      const { data: despData, error: despError } = await supabase
        .from('despensa')
        .select('*')
      if (despError) throw despError
      setDespensaItems(despData || [])

      const { data: recData, error: recError } = await supabase
        .from('recetas')
        .select('*, receta_ingredientes(*)')
      if (recError) throw recError
      setRecetasGuardadas(recData || [])
    } catch (err) {
      console.error('Error al cargar datos en calculadora:', err)
      showToast('Error al cargar datos desde Supabase')
    } finally {
      setLoading(false)
    }
  }

  const cargarRecetaDirecta = (receta) => {
    setSelectedRecetaId(receta.id)
    setRinde(receta.rinde || 1)

    const nuevasLineas = (receta.receta_ingredientes || []).map((item) => {
      const matchDesp = despensaItems.find(
        (d) => d.id === item.despensa_id || d.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim()
      )
      return {
        despensa_id: matchDesp ? matchDesp.id : null,
        nombre: item.nombre,
        cant: item.cantidad,
        unidad: item.unidad,
        ing: matchDesp || null
      }
    })

    setLineas(nuevasLineas)
    showToast(`¡Receta ${receta.nombre} cargada en la calculadora! ✨`)
  }

  const handleCargarRecetaSelect = () => {
    if (!selectedRecetaId) {
      showToast('Selecciona una receta guardada de la lista')
      return
    }
    const rec = recetasGuardadas.find((r) => r.id === selectedRecetaId)
    if (rec) {
      const mult = Math.max(parseFloat(multiplicador) || 1, 0.01)
      setRinde(Math.round(rec.rinde * mult * 100) / 100)

      const nuevasLineas = (rec.receta_ingredientes || []).map((item) => {
        const matchDesp = despensaItems.find(
          (d) => d.id === item.despensa_id || d.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim()
        )
        return {
          despensa_id: matchDesp ? matchDesp.id : null,
          nombre: item.nombre,
          cant: item.cantidad * mult,
          unidad: item.unidad,
          ing: matchDesp || null
        }
      })

      setLineas(nuevasLineas)
      showToast(`¡Receta "${rec.nombre}" cargada a escala x${mult}! ✨`)
    }
  }

  const handleAddLineaManual = (e) => {
    e.preventDefault()
    if (!selDespensaId || !manualCant || parseFloat(manualCant) <= 0) {
      showToast('Selecciona un ingrediente de tu despensa y la cantidad usada')
      return
    }

    const ing = despensaItems.find((d) => d.id === selDespensaId)
    if (!ing) return

    setLineas([
      ...lineas,
      {
        despensa_id: ing.id,
        nombre: ing.nombre,
        cant: parseFloat(manualCant),
        unidad: ing.unidad_base,
        ing: ing
      }
    ])

    setManualCant('')
    showToast(`¡${ing.nombre} agregado a la masa! ✨`)
  }

  const handleRemoveLinea = (idx) => {
    setLineas(lineas.filter((_, i) => i !== idx))
  }

  const handleUpdateLineaCant = (idx, val) => {
    const cantNum = Math.max(0, parseFloat(val) || 0)
    const clone = [...lineas]
    if (clone[idx]) {
      clone[idx].cant = cantNum
      setLineas(clone)
    }
  }

  const handleLimpiarCalculadora = () => {
    setLineas([])
    setSelectedRecetaId('')
    setMultiplicador(1)
    setRinde(1)
    showToast('Calculadora limpia 🧹')
  }

  // CÁLCULOS EXACTOS SEGÚN FÓRMULA PEDIDA (se mantienen valores exactos internamente)
  const costoIngredientes = lineas.reduce((acc, item) => {
    const ing = item.ing || despensaItems.find((d) => d.id === item.despensa_id)
    if (!ing) return acc
    const cantConvertidaBase = convertirACantidadBase(item, ing, 1)
    return acc + ing.costo_base * cantConvertidaBase
  }, 0)

  const horasNum = parseFloat(horas) || 0
  const valorHoraNum = parseFloat(valorHora) || 0
  const otrosNum = parseFloat(otros) || 0
  const margenNum = parseFloat(margen) || 0
  const rindeNum = Math.max(parseFloat(rinde) || 1, 0.01)

  const costoManoObra = horasNum * valorHoraNum
  const costoTotal = costoIngredientes + costoManoObra + otrosNum
  const precioTotal = costoTotal * (1 + margenNum / 100)
  const gananciaTotal = precioTotal - costoTotal
  const costoUnidad = costoTotal / rindeNum
  const precioUnidad = precioTotal / rindeNum
  const gananciaUnidad = precioUnidad - costoUnidad

  // Redondeo de visualización en pesos al peso más cercano (0 decimales)
  const handleCopiarWhatsApp = () => {
    const recNombre = selectedRecetaId
      ? recetasGuardadas.find((r) => r.id === selectedRecetaId)?.nombre || 'Preparación dulce'
      : 'Preparación dulce'

    const texto =
      `¡Hola! 🍰 Aquí tienes el presupuesto para *${recNombre}*:\n\n` +
      `✨ *Rendimiento / Cantidad:* ${rindeNum} porciones/unidades\n` +
      `💰 *Precio por unidad:* ${CLP(precioUnidad, 0)}\n` +
      `📦 *Total a pagar:* ${CLP(precioTotal, 0)}\n\n` +
      `Hecho con ingredientes de primera calidad con todo el cariño de mi cocina. ¡Quedo atenta para agendar tu pedido! 💖`

    navigator.clipboard
      .writeText(texto)
      .then(() => showToast('¡Presupuesto copiado listo para enviar por WhatsApp! 📱'))
      .catch(() => showToast('No se pudo copiar automáticamente'))
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Precio justo"
        introduccion="Carga una receta o agrega ingredientes de tu despensa para saber exactamente cuánto cobrar."
      />

      {/* Atajo Receta Guardada */}
      <div className="bg-[var(--superficie)] p-5 rounded-[18px] border border-[var(--oro)]/30 bg-gradient-to-r from-[var(--oro-fondo)]/40 to-transparent space-y-3 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--oro)]">
          ⚡ Atajo: Cargar una receta guardada con ajuste de tandas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Select
              id="pj-receta-sel"
              value={selectedRecetaId}
              onChange={(e) => setSelectedRecetaId(e.target.value)}
            >
              <option value="">— Selecciona una receta guardada —</option>
              {recetasGuardadas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} (Rinde: {r.rinde})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="pj-mult"
              type="number"
              step="any"
              min="0.1"
              placeholder="Tandas (ej. 1)"
              className="num"
              value={multiplicador}
              onChange={(e) => setMultiplicador(e.target.value)}
            />
          </div>

          <div>
            <Boton variante="marca-secundario" className="w-full" onClick={handleCargarRecetaSelect}>
              📥 Cargar
            </Boton>
          </div>
        </div>
      </div>

      {/* Agregar Línea Manual */}
      <Panel
        titulo="Ingredientes en esta preparación"
        subtitulo="Selecciona los insumos que usaste en tu mezcla."
      >
        <form onSubmit={handleAddLineaManual} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Select
              id="pj-despensa-sel"
              value={selDespensaId}
              onChange={(e) => setSelDespensaId(e.target.value)}
            >
              <option value="">— Selecciona ingrediente de despensa —</option>
              {despensaItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({CLP(d.costo_base, 4)}/{d.unidad_base})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="pj-cant-manual"
              type="number"
              step="any"
              placeholder="Cantidad usada"
              className="num"
              value={manualCant}
              onChange={(e) => setManualCant(e.target.value)}
            />
          </div>

          <div>
            <Boton variante="principal" type="submit" className="w-full">
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>¡A la masa!</span>
            </Boton>
          </div>
        </form>
      </Panel>

      {/* Tabla de Insumos */}
      <Panel className="!p-0">
        {lineas.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--tinta-suave)]">
            ¿Ya elegiste tus ingredientes? Agrégalos arriba para calcular el costo total.
          </div>
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-[1fr_180px_140px_40px] gap-3 px-5 py-2.5 bg-[#FBF7F2] border-b border-[var(--linea)] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta-suave)]">
              <span>Ingrediente</span>
              <span>Cantidad Usada</span>
              <span>Costo Calculado</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-[var(--linea-suave)] p-3 md:p-0 space-y-2 md:space-y-0">
              {lineas.map((item, idx) => {
                const ing = item.ing || despensaItems.find((d) => d.id === item.despensa_id)
                const cantBase = ing ? convertirACantidadBase(item, ing, 1) : 0
                const costoLinea = ing ? ing.costo_base * cantBase : 0

                return (
                  <div
                    key={idx}
                    className="bg-[var(--superficie)] md:bg-transparent border border-[var(--linea)] md:border-0 rounded-[14px] md:rounded-none p-3.5 md:p-3 md:grid md:grid-cols-[1fr_180px_140px_40px] md:gap-3 md:items-center hover:bg-[var(--superficie-2)]/60 transition-colors"
                  >
                    <div className="font-semibold text-xs md:text-[13.5px] text-[var(--tinta)]">
                      {item.nombre}
                    </div>
                    <div className="flex items-center gap-2 mt-1 md:mt-0">
                      <Input
                        type="number"
                        step="any"
                        value={item.cant}
                        onChange={(e) => handleUpdateLineaCant(idx, e.target.value)}
                        className="w-24 h-8 text-xs font-semibold num !px-2"
                      />
                      <span className="text-xs font-semibold text-[var(--tinta-media)]">{item.unidad}</span>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <Pastilla variante="vino">
                        {CLP(costoLinea, 0)}
                      </Pastilla>
                    </div>
                    <div className="mt-2 md:mt-0 flex justify-end">
                      <Boton
                        variante="icono"
                        size="icono"
                        onClick={() => handleRemoveLinea(idx)}
                        ariaLabel={`Eliminar ${item.nombre}`}
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

      {/* Inputs Mano de Obra, Gastos y Margen */}
      <Panel
        titulo="Tu trabajo, gastos y margen"
        subtitulo="Ingresa las horas dedicadas, costo por hora, gastos fijos adicionales y margen deseado."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <Campo id="pj-horas" label="Horas Trabajo">
            <Input
              id="pj-horas"
              type="number"
              step="any"
              className="num"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </Campo>

          <Campo id="pj-vhora" label="Valor Hora (CLP)">
            <Input
              id="pj-vhora"
              type="number"
              step="any"
              className="num"
              value={valorHora}
              onChange={(e) => setValorHora(e.target.value)}
            />
          </Campo>

          <Campo id="pj-otros" label="Otros Gastos">
            <Input
              id="pj-otros"
              type="number"
              step="any"
              className="num"
              value={otros}
              onChange={(e) => setOtros(e.target.value)}
            />
          </Campo>

          <Campo id="pj-margen" label="Margen (%)">
            <Input
              id="pj-margen"
              type="number"
              step="any"
              className="num"
              value={margen}
              onChange={(e) => setMargen(e.target.value)}
            />
          </Campo>

          <Campo id="pj-rinde" label="Rendimiento (unid)">
            <Input
              id="pj-rinde"
              type="number"
              step="any"
              className="num"
              value={rinde}
              onChange={(e) => setRinde(e.target.value)}
            />
          </Campo>
        </div>
      </Panel>

      {/* RESULTADOS (6 CAJAS - MONTOS REDONDEADOS AL PESO MÁS CERCANO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <TarjetaIndicador
          etiqueta="Costo Total Lote"
          valor={CLP(costoTotal, 0)}
        />
        <TarjetaIndicador
          etiqueta="Precio Total (Lote)"
          valor={CLP(precioTotal, 0)}
          variante="destacada"
        />
        <TarjetaIndicador
          etiqueta="Ganancia Limpia Lote"
          valor={CLP(gananciaTotal, 0)}
          insignia="Limpio"
        />
        <TarjetaIndicador
          etiqueta="Costo por Unidad"
          valor={CLP(costoUnidad, 0)}
        />
        <TarjetaIndicador
          etiqueta="Precio Venta (Unidad)"
          valor={CLP(precioUnidad, 0)}
          variante="destacada"
        />
        <TarjetaIndicador
          etiqueta="Ganancia Limpia (Unidad)"
          valor={CLP(gananciaUnidad, 0)}
          insignia="Limpio"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center gap-3">
        <Boton variante="principal" onClick={handleCopiarWhatsApp}>
          <Share2 className="w-4 h-4 stroke-[2]" />
          <span>Copiar presupuesto para WhatsApp</span>
        </Boton>

        <Boton variante="secundario" onClick={handleLimpiarCalculadora}>
          <RefreshCw className="w-4 h-4 stroke-[2]" />
          <span>Limpiar calculadora</span>
        </Boton>
      </div>

      {/* Tip de Eli */}
      <TipDeEli>
        Asegúrate de cobrar el valor justo por tus horas de trabajo. No regales tu talento ni el tiempo que pasas horneando.
      </TipDeEli>
    </div>
  )
}
