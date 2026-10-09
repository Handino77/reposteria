import React, { useState, useEffect } from 'react'
import {
  convertirACantidadBase,
  factorBase,
  unidadBaseDe,
  normalizarTextoFlex
} from '../utils/conversores'
import { Input } from './ui/Campo'
import { Boton } from './ui/Boton'
import { Pastilla } from './ui/Pastilla'
import { ShoppingBag, Share2, X, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function ListaComprasModal({ isOpen, onClose, pedidosList, recetasGuardadas, despensaItems }) {
  const fmtFecha = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [checklistState, setChecklistState] = useState({})
  const [toastMsg, setToastMsg] = useState('')
  const [copiedTextModal, setCopiedTextModal] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Clave de localStorage para checklist persistente por rango de fechas
  const localStorageKey = `compras_${fechaDesde}_${fechaHasta}`

  useEffect(() => {
    if (isOpen) {
      const hoy = new Date()
      const enUnaSemana = new Date()
      enUnaSemana.setDate(hoy.getDate() + 7)

      if (!fechaDesde) setFechaDesde(fmtFecha(hoy))
      if (!fechaHasta) setFechaHasta(fmtFecha(enUnaSemana))
    }
  }, [isOpen])

  // Cargar checklistState desde localStorage al cambiar rango de fechas
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      try {
        const saved = localStorage.getItem(localStorageKey)
        if (saved) {
          setChecklistState(JSON.parse(saved))
        } else {
          setChecklistState({})
        }
      } catch (e) {
        console.warn('Error al leer checklist de localStorage:', e)
        setChecklistState({})
      }
    }
  }, [fechaDesde, fechaHasta])

  if (!isOpen) return null

  // Normalizador de texto
  const normalizarTexto = (txt) =>
    (txt || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  // Buscar ingrediente en la despensa (despensa_id primero -> normalización flexible)
  const buscarIngredienteEnDespensa = (item) => {
    if (!item) return null
    if (item.despensa_id) {
      const porId = despensaItems.find((d) => d.id === item.despensa_id)
      if (porId) return porId
    }
    const normFlex = normalizarTextoFlex(item.nombre)
    return despensaItems.find((d) => normalizarTextoFlex(d.nombre) === normFlex) || null
  }

  // -----------------------------------------------------------------
  // CÁLCULO DE LA LISTA DE COMPRAS
  // -----------------------------------------------------------------
  let insumosMap = {}
  let totalPedidosContados = 0
  let productosSinRecetaMap = {}

  if (fechaDesde && fechaHasta) {
    pedidosList.forEach((p) => {
      if (p.fecha >= fechaDesde && p.fecha <= fechaHasta) {
        totalPedidosContados++
        const items = Array.isArray(p.pedido_items) ? p.pedido_items : []

        items.forEach((item) => {
          const cantPedida = parseFloat(item.cantidad) || 1
          let rec = null

          // Vía 1: receta_id directo
          if (item.receta_id) {
            rec = recetasGuardadas.find((r) => r.id === item.receta_id)
          }

          // Vía 2: Coincidencia por nombre normalizado como respaldo
          if (!rec && item.producto) {
            const prodNorm = normalizarTextoFlex(item.producto)
            rec = recetasGuardadas.find((r) => normalizarTextoFlex(r.nombre) === prodNorm)
          }

          const ingsReceta = rec && Array.isArray(rec.receta_ingredientes) ? rec.receta_ingredientes : []
          const rindeReceta = rec ? parseFloat(rec.rinde) || 0 : 0

          if (rec && ingsReceta.length > 0 && rindeReceta > 0) {
            const mult = cantPedida / rindeReceta

            ingsReceta.forEach((ingItem) => {
              const ingDespensa = buscarIngredienteEnDespensa(ingItem)
              const keyNorm = normalizarTextoFlex(ingItem.nombre)

              let cantBase = 0
              let uBase = 'g'
              let stockDespensaBase = 0
              let existeEnDespensa = false

              if (ingDespensa) {
                cantBase = convertirACantidadBase(ingItem, ingDespensa, mult)
                uBase = ingDespensa.unidad_base || unidadBaseDe(ingDespensa.unidad_compra)
                stockDespensaBase = (parseFloat(ingDespensa.cantidad) || 0) * factorBase(ingDespensa.unidad_compra)
                existeEnDespensa = true
              } else {
                const u = (ingItem.unidad || '').toLowerCase().trim()
                const cantIng = parseFloat(ingItem.cantidad) || 0
                if (u === 'kg') {
                  cantBase = cantIng * mult * 1000
                  uBase = 'g'
                } else if (u === 'l') {
                  cantBase = cantIng * mult * 1000
                  uBase = 'ml'
                } else if (u === 'ml') {
                  cantBase = cantIng * mult
                  uBase = 'ml'
                } else if (u === 'unidad') {
                  cantBase = cantIng * mult
                  uBase = 'unidad'
                } else {
                  cantBase = cantIng * mult
                  uBase = u || 'g'
                }
              }

              if (!insumosMap[keyNorm]) {
                insumosMap[keyNorm] = {
                  nombre: ingDespensa ? ingDespensa.nombre : ingItem.nombre,
                  cantBase: 0,
                  unidadBase: uBase,
                  stockDespensaBase: stockDespensaBase,
                  existeEnDespensa: existeEnDespensa
                }
              }
              insumosMap[keyNorm].cantBase += cantBase
            })
          } else {
            // Producto sin receta asociada
            const prodNorm = normalizarTexto(item.producto)
            if (!productosSinRecetaMap[prodNorm]) {
              productosSinRecetaMap[prodNorm] = {
                nombre: item.producto,
                cantidadTotal: 0
              }
            }
            productosSinRecetaMap[prodNorm].cantidadTotal += cantPedida
          }
        })
      }
    })
  }

  // Formateador uniforme para toda la fila
  const formatearValoresFila = (cantReq, cantStock, cantFalta, unidadBase) => {
    let usaMallaMayor = false
    if ((unidadBase === 'g' || unidadBase === 'ml') && Math.max(cantReq, cantStock) >= 1000) {
      usaMallaMayor = true
    }

    if (unidadBase === 'g') {
      if (usaMallaMayor) {
        const u = 'kg'
        const reqStr = (cantReq / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        const stockStr = (cantStock / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        const faltaStr = (cantFalta / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        return { reqStr, stockStr, faltaStr }
      }
      const u = 'g'
      const reqStr = cantReq.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      const stockStr = cantStock.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      const faltaStr = cantFalta.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      return { reqStr, stockStr, faltaStr }
    } else if (unidadBase === 'ml') {
      if (usaMallaMayor) {
        const u = 'l'
        const reqStr = (cantReq / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        const stockStr = (cantStock / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        const faltaStr = (cantFalta / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 }) + ' ' + u
        return { reqStr, stockStr, faltaStr }
      }
      const u = 'ml'
      const reqStr = cantReq.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      const stockStr = cantStock.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      const faltaStr = cantFalta.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' ' + u
      return { reqStr, stockStr, faltaStr }
    }

    const u = unidadBase
    const reqStr = cantReq.toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' ' + u
    const stockStr = cantStock.toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' ' + u
    const faltaStr = cantFalta.toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' ' + u
    return { reqStr, stockStr, faltaStr }
  }

  const comprasCalculadas = Object.keys(insumosMap)
    .map((k) => {
      const item = insumosMap[k]
      const faltaBase = Math.max(0, item.cantBase - item.stockDespensaBase)

      const { reqStr, stockStr, faltaStr } = formatearValoresFila(
        item.cantBase,
        item.stockDespensaBase,
        faltaBase,
        item.unidadBase
      )

      return {
        nombre: item.nombre,
        cantBase: item.cantBase,
        unidadBase: item.unidadBase,
        stockDespensaBase: item.stockDespensaBase,
        faltaBase: faltaBase,
        existeEnDespensa: item.existeEnDespensa,
        cantFormateada: reqStr,
        despensaFormateada: stockStr,
        faltaFormateada: faltaStr
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const productosSinReceta = Object.values(productosSinRecetaMap)

  let marcadosCount = 0
  comprasCalculadas.forEach((i) => {
    if (checklistState[i.nombre]) marcadosCount++
  })

  // Handlers checklist
  const toggleCheckCompra = (nombreKey) => {
    const nextState = {
      ...checklistState,
      [nombreKey]: !checklistState[nombreKey]
    }
    setChecklistState(nextState)
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(nextState))
    } catch (e) {
      console.warn('Error al guardar checklist en localStorage:', e)
    }
  }

  const handleDesmarcarTodos = () => {
    setChecklistState({})
    try {
      localStorage.setItem(localStorageKey, JSON.stringify({}))
    } catch (e) {}
    showToast('Se desmarcaron todos los insumos 🧹')
  }

  // Exportar a WhatsApp
  const handleCopiarWhatsApp = () => {
    if (comprasCalculadas.length === 0) {
      showToast('No hay insumos para exportar en el rango seleccionado 🧁')
      return
    }

    let fechaFmt = ''
    if (fechaDesde && fechaHasta) {
      const [y1, m1, d1] = fechaDesde.split('-')
      const [y2, m2, d2] = fechaHasta.split('-')
      fechaFmt = ` (${d1}/${m1}/${y1} al ${d2}/${m2}/${y2})`
    }

    let texto = `🛒 *Lista de Compras de Cifu Repostera*${fechaFmt}\n` +
      `Hecha con todo el cariño para preparar tus pedidos 💖🧁\n\n`

    let compradosCount = 0

    comprasCalculadas.forEach((item) => {
      const isChecked = !!checklistState[item.nombre]
      if (isChecked) compradosCount++

      const checkIcon = isChecked ? '✅' : '⬜'
      const estadoTxt = isChecked ? '*[LISTO]*' : '*[COMPRAR]*'

      let infoCant = `${item.cantFormateada}`
      if (item.faltaBase > 0 && !isChecked) {
        infoCant += ` (Falta: ${item.faltaFormateada})`
      } else if (isChecked) {
        infoCant += ` (Comprado/En stock)`
      }

      texto += `${checkIcon} ${estadoTxt} *${item.nombre}:* ${infoCant}\n`
    })

    texto += `\n📊 *Resumen:* ${compradosCount} de ${comprasCalculadas.length} insumos listos.\n`

    texto += `\n✨ *Sígueme en redes sociales para más tips de repostería:*` +
      `\n🎵 TikTok: https://www.tiktok.com/@cifu_pasticceria` +
      `\n📷 Instagram: https://www.instagram.com/cifu_pasticceria/` +
      `\n\n_Hecho con cariño con el Kit de la Repostera de @cifu_pasticceria_ 🥰🍰_`

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto)
        .then(() => showToast('¡Lista de compras copiada para WhatsApp! 📱'))
        .catch(() => setCopiedTextModal(texto))
    } else {
      setCopiedTextModal(texto)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#140C08]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-60 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Fallback modal si navigator.clipboard falla */}
      {copiedTextModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[20px] p-5 max-w-lg w-full space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-[var(--tinta)]">Copia el texto manualmente para WhatsApp</h4>
              <Boton variante="icono" size="icono" onClick={() => setCopiedTextModal(null)}>
                <X className="w-5 h-5" />
              </Boton>
            </div>
            <textarea
              readOnly
              value={copiedTextModal}
              className="w-full h-60 p-3 bg-[var(--superficie-2)] border border-[var(--linea)] rounded-[11px] text-xs font-mono text-[var(--tinta)] focus:outline-none"
              onClick={(e) => e.target.select()}
            />
            <Boton
              variante="principal"
              onClick={() => {
                navigator.clipboard?.writeText(copiedTextModal)
                setCopiedTextModal(null)
                showToast('¡Texto copiado!')
              }}
              className="w-full"
            >
              Seleccionar y Cerrar
            </Boton>
          </div>
        </div>
      )}

      <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[20px] p-6 max-w-2xl w-full shadow-[var(--sombra-panel)] space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start shrink-0">
          <div>
            <span className="text-[10.5px] uppercase tracking-[0.1em] font-extrabold text-[var(--vino)]">
              cifu_pasticceria · Organiza tu cocina 💖
            </span>
            <h3 className="font-serif-title text-xl font-semibold text-[var(--tinta)] flex items-center gap-2 mt-0.5">
              <ShoppingBag className="w-5 h-5 text-[var(--oro)]" />
              🛒 Lista de Compras de Cifu Repostera
            </h3>
          </div>
          <Boton variante="icono" size="icono" onClick={onClose} ariaLabel="Cerrar modal">
            <X className="w-5 h-5" />
          </Boton>
        </div>

        {/* Filtro Rango Fechas */}
        <div className="bg-[var(--superficie-2)] border border-[var(--linea-suave)] rounded-[14px] p-3.5 shrink-0 space-y-2">
          <label className="block text-[11px] font-bold text-[var(--tinta-media)] uppercase tracking-[0.08em]">
            📅 Selecciona el rango de fechas de tus pedidos:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[var(--tinta-suave)] mb-0.5">Desde</label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="!h-9 text-xs num"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--tinta-suave)] mb-0.5">Hasta</label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="!h-9 text-xs num"
              />
            </div>
            <div className="flex items-end">
              <Boton
                variante="principal"
                size="sm"
                onClick={() => showToast('Lista actualizada para el rango')}
                className="w-full !h-9 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Calcular</span>
              </Boton>
            </div>
          </div>
        </div>

        {/* Resumen Boxes (3 recuadros) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          <div className="bg-[var(--superficie-2)] border border-[var(--linea-suave)] p-3 rounded-[12px]">
            <span className="block text-[10px] font-bold uppercase text-[var(--tinta-suave)]">Pedidos en rango</span>
            <span className="num font-serif-title text-xl font-bold text-[var(--tinta)]">{totalPedidosContados}</span>
          </div>
          <div className="bg-[var(--vino-suave)] p-3 rounded-[12px]">
            <span className="block text-[10px] font-bold uppercase text-[var(--vino-oscuro)]">Insumos totales</span>
            <span className="num font-serif-title text-xl font-bold text-[var(--vino-oscuro)]">{comprasCalculadas.length}</span>
          </div>
          <div className="bg-[var(--verde-fondo)] p-3 rounded-[12px]">
            <span className="block text-[10px] font-bold uppercase text-[var(--verde)]">Listos / Marcados</span>
            <span className="num font-serif-title text-xl font-bold text-[var(--verde)]">
              {marcadosCount} / {comprasCalculadas.length}
            </span>
          </div>
        </div>

        {/* Advertencia Productos sin Receta */}
        {productosSinReceta.length > 0 && (
          <div className="bg-[var(--oro-fondo)] border border-[var(--oro)]/30 rounded-[12px] p-3 text-xs text-[var(--tinta-media)] shrink-0">
            ⚠️ <b>Nota de Eli:</b> Hay productos agendados sin receta guardada ({' '}
            {productosSinReceta.map((s, idx) => (
              <span key={idx}>
                <b>{s.nombre}</b> (x{s.cantidadTotal})
                {idx < productosSinReceta.length - 1 ? ', ' : ''}
              </span>
            ))}
            ). Para incluir sus insumos en la lista, agrégalos en <b>📖 Mis recetas</b>.
          </div>
        )}

        {/* Contenedor de Items (Scrollable) */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[200px]">
          {comprasCalculadas.length === 0 ? (
            <div className="text-center py-10 text-xs text-[var(--tinta-suave)] border border-dashed border-[var(--linea)] rounded-[14px]">
              {totalPedidosContados === 0
                ? 'No hay pedidos agendados en el rango de fechas seleccionado. ¡Agrega pedidos en el calendario para calcular tu lista!'
                : 'Los productos agendados en este rango no tienen recetas vinculadas.'}
            </div>
          ) : (
            comprasCalculadas.map((item, idx) => {
              const isChecked = !!checklistState[item.nombre]
              const tieneFalta = item.faltaBase > 0

              return (
                <div
                  key={idx}
                  onClick={() => toggleCheckCompra(item.nombre)}
                  className={`p-3 rounded-[12px] border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[var(--verde-fondo)] border-[var(--verde)] opacity-85'
                      : 'bg-[var(--superficie-2)] border-[var(--linea-suave)] hover:border-[var(--vino-borde)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-[8px] border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isChecked
                          ? 'bg-[var(--verde)] border-[var(--verde)] text-white'
                          : 'bg-white border-[var(--linea)] text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs md:text-sm font-bold ${isChecked ? 'line-through text-[var(--tinta-suave)]' : 'text-[var(--tinta)]'}`}>
                        {item.nombre}
                      </p>
                      <p className="text-[11.5px] text-[var(--tinta-suave)] num">
                        Requerido: <b>{item.cantFormateada}</b> · En despensa:{' '}
                        {item.existeEnDespensa ? (
                          item.despensaFormateada
                        ) : (
                          <span className="text-[var(--oro)] font-medium">no está en la despensa</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {tieneFalta ? (
                      <Pastilla variante="vino">
                        Falta: {item.faltaFormateada}
                      </Pastilla>
                    ) : (
                      <Pastilla variante="verde">
                        ✓ En despensa
                      </Pastilla>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Acciones */}
        <div className="pt-3 border-t border-[var(--linea-suave)] flex flex-wrap gap-2.5 shrink-0">
          <Boton
            variante="principal"
            onClick={handleCopiarWhatsApp}
            className="flex-1 min-w-[180px]"
          >
            <Share2 className="w-4 h-4 stroke-[2]" />
            <span>Copiar para WhatsApp</span>
          </Boton>

          <Boton
            variante="secundario"
            onClick={handleDesmarcarTodos}
          >
            🧹 Desmarcar todos
          </Boton>

          <Boton
            variante="secundario"
            onClick={onClose}
          >
            Cerrar
          </Boton>
        </div>
      </div>
    </div>
  )
}
