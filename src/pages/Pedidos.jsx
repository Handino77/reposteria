import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { convertirACantidadBase, CLP } from '../utils/conversores'
import ListaComprasModal from '../components/ListaComprasModal'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { TipDeEli } from '../components/ui/TipDeEli'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Share2,
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  Loader2,
  DollarSign,
  ShoppingBag
} from 'lucide-react'

export default function Pedidos({ user }) {
  const [pedidosList, setPedidosList] = useState([])
  const [recetasGuardadas, setRecetasGuardadas] = useState([])
  const [despensaItems, setDespensaItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComprasModal, setShowComprasModal] = useState(false)

  // Mes en vista (Date object)
  const [calActual, setCalActual] = useState(new Date())

  // Modal Día
  const [modalFecha, setModalFecha] = useState(null) // 'YYYY-MM-DD'
  const [filtroEstadoModal, setFiltroEstadoModal] = useState('todos')

  // Formulario Nuevo Pedido
  const [ordCliente, setOrdCliente] = useState('')
  const [ordEstado, setOrdEstado] = useState('pendiente')
  const [ordEstadoPago, setOrdEstadoPago] = useState('no_pagado')

  // Items borrador del nuevo pedido
  const [itemsBorrador, setItemsBorrador] = useState([])
  const [itemProducto, setItemProducto] = useState('')
  const [itemCantidad, setItemCantidad] = useState('1')
  const [itemPrecio, setItemPrecio] = useState('')

  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  useEffect(() => {
    fetchDatos()
  }, [user])

  const fetchDatos = async () => {
    try {
      setLoading(true)
      // 1. Cargar pedidos con sus pedido_items
      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .select('*, pedido_items(*)')
        .order('fecha', { ascending: true })

      if (pedError) throw pedError
      setPedidosList(pedData || [])

      // 2. Cargar recetas para autocompletado y cálculo de precio sugerido
      const { data: recData, error: recError } = await supabase
        .from('recetas')
        .select('*, receta_ingredientes(*)')

      if (recError) throw recError
      setRecetasGuardadas(recData || [])

      // 3. Cargar despensa para cálculo de costo de ingredientes
      const { data: despData, error: despError } = await supabase
        .from('despensa')
        .select('*')

      if (despError) throw despError
      setDespensaItems(despData || [])
    } catch (err) {
      console.error('Error al cargar datos en Pedidos:', err)
      showToast('Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  // Navegación de mes
  const cambiarMes = (delta) => {
    const nuevo = new Date(calActual)
    nuevo.setMonth(nuevo.getMonth() + delta)
    setCalActual(nuevo)
  }

  // Helpers de fecha YYYY-MM-DD
  const fmtFecha = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // AUTOCOMPLETADO DE PRECIO SUGERIDO
  const handleProductoChange = (valorNombre) => {
    setItemProducto(valorNombre)

    const normNombre = valorNombre.trim().toLowerCase()
    const receta = recetasGuardadas.find(
      (r) => r.nombre.trim().toLowerCase() === normNombre
    )

    if (receta && receta.receta_ingredientes && receta.rinde > 0) {
      // Calcular costo total de ingredientes
      let costoIngredientes = 0
      receta.receta_ingredientes.forEach((linea) => {
        const ingDespensa = despensaItems.find(
          (d) => d.id === linea.despensa_id || d.nombre.trim().toLowerCase() === linea.nombre.trim().toLowerCase()
        )
        if (ingDespensa) {
          const cantConvertidaBase = convertirACantidadBase(linea, ingDespensa, 1)
          costoIngredientes += ingDespensa.costo_base * cantConvertidaBase
        }
      })

      if (costoIngredientes > 0) {
        const costoUnidad = costoIngredientes / receta.rinde
        const precioSugerido = Math.round(costoUnidad * 1.4) // 40% margen sugerido
        setItemPrecio(precioSugerido.toString())
        showToast(`💡 Precio sugerido para ${receta.nombre}: ${CLP(precioSugerido, 0)}`)
      }
    }
  }

  // AGREGAR ITEM AL BORRADOR
  const handleAddItemBorrador = (e) => {
    e.preventDefault()
    if (!itemProducto.trim() || !itemCantidad || parseFloat(itemCantidad) <= 0) {
      showToast('Ingresa el producto y una cantidad válida')
      return
    }

    const cantNum = parseFloat(itemCantidad)
    const precioNum = parseFloat(itemPrecio) || 0

    // Buscar receta_id si coincide
    const normNombre = itemProducto.trim().toLowerCase()
    const receta = recetasGuardadas.find(
      (r) => r.nombre.trim().toLowerCase() === normNombre
    )

    setItemsBorrador([
      ...itemsBorrador,
      {
        producto: itemProducto.trim(),
        cantidad: cantNum,
        precio_unitario: precioNum,
        receta_id: receta ? receta.id : null
      }
    ])

    setItemProducto('')
    setItemCantidad('1')
    setItemPrecio('')
  }

  const handleRemoveItemBorrador = (idx) => {
    setItemsBorrador(itemsBorrador.filter((_, i) => i !== idx))
  }

  // GUARDAR PEDIDO EN SUPABASE (100% IDÉNTICO A ORIGINAL 3ee2647~1)
  const handleCrearPedido = async (e) => {
    e.preventDefault()
    if (!ordCliente.trim()) {
      showToast('Escribe el nombre del cliente')
      return
    }
    if (itemsBorrador.length === 0) {
      showToast('Agrega al menos un producto a la orden')
      return
    }

    const totalCalculado = itemsBorrador.reduce(
      (acc, item) => acc + item.cantidad * item.precio_unitario,
      0
    )

    try {
      setSaving(true)

      // 1. Insertar en tabla pedidos (nombres de columna exactos de Supabase)
      const { data: newPedido, error: pedError } = await supabase
        .from('pedidos')
        .insert([
          {
            repostera_id: user.id,
            fecha: modalFecha,
            cliente: ordCliente.trim(),
            estado: ordEstado,
            estado_pago_cliente: ordEstadoPago,
            total: totalCalculado
          }
        ])
        .select()
        .single()

      if (pedError) throw pedError

      // 2. Insertar en tabla pedido_items (nombres de columna exactos de Supabase)
      const itemsPayload = itemsBorrador.map((item, idx) => ({
        pedido_id: newPedido.id,
        receta_id: item.receta_id,
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        orden: idx
      }))

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsPayload)

      if (itemsError) throw itemsError

      showToast('¡Pedido guardado con éxito en tu agenda! 📝')

      // Limpiar borrador
      setOrdCliente('')
      setOrdEstado('pendiente')
      setOrdEstadoPago('no_pagado')
      setItemsBorrador([])

      fetchDatos()
    } catch (err) {
      console.error('Error al agendar pedido:', err)
      showToast('Error al guardar en Supabase: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // CAMBIAR ESTADO PEDIDO
  const handleActualizarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId)

      if (error) throw error
      showToast(`Estado de preparación: ${nuevoEstado}`)
      fetchDatos()
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      showToast('Error al actualizar estado')
    }
  }

  // CAMBIAR ESTADO PAGO (100% IDÉNTICO A ORIGINAL: columna estado_pago_cliente)
  const handleActualizarPago = async (pedidoId, nuevoPago) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado_pago_cliente: nuevoPago })
        .eq('id', pedidoId)

      if (error) throw error
      showToast('Estado de pago actualizado 💰')
      fetchDatos()
    } catch (err) {
      console.error('Error al actualizar pago:', err)
      showToast('Error al actualizar pago')
    }
  }

  // ELIMINAR PEDIDO
  const handleEliminarPedido = async (pedidoId, cliente) => {
    if (!confirm(`¿Eliminar el pedido de ${cliente || 'este cliente'}?`)) return
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoId)

      if (error) throw error
      showToast('Pedido eliminado')
      fetchDatos()
    } catch (err) {
      console.error('Error al eliminar pedido:', err)
      showToast('Error al eliminar pedido')
    }
  }

  // -----------------------------------------------------------------
  // GENERACIÓN DE DÍAS DEL CALENDARIO (MES COMPLETO + RELLENO)
  // -----------------------------------------------------------------
  const anoVista = calActual.getFullYear()
  const mesVista = calActual.getMonth() // 0-indexed

  const primerDiaMes = new Date(anoVista, mesVista, 1)
  const ultimoDiaMes = new Date(anoVista, mesVista + 1, 0)

  // Ajuste Lunes=0, Domingo=6
  let primerDiaSemana = primerDiaMes.getDay() - 1
  if (primerDiaSemana === -1) primerDiaSemana = 6

  const diasMatriz = []
  // Días vacíos previos
  for (let i = 0; i < primerDiaSemana; i++) {
    diasMatriz.push(null)
  }
  // Días del mes
  for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
    diasMatriz.push(new Date(anoVista, mesVista, d))
  }

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const hoyFmt = fmtFecha(new Date())

  // Pedidos del día seleccionado en el modal
  const pedidosDelDia = modalFecha
    ? pedidosList.filter((p) => p.fecha === modalFecha)
    : []

  const pedidosDelDiaFiltrados = pedidosDelDia.filter((p) => {
    if (filtroEstadoModal === 'todos') return true
    return p.estado === filtroEstadoModal
  })

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Datalist recetas para autocompletar */}
      <datalist id="lista-recetas-pedidos">
        {recetasGuardadas.map((r) => (
          <option key={r.id} value={r.nombre} />
        ))}
      </datalist>

      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Mis pedidos"
        introduccion="Agenda tus encargos en el calendario y genera automáticamente tu lista de compras semanal."
        acciones={
          <Boton variante="principal" onClick={() => setShowComprasModal(true)}>
            <ShoppingBag className="w-4 h-4 stroke-[2]" />
            <span>Generar Lista de Compras</span>
          </Boton>
        }
      />

      {/* Navegación y Controles del Calendario */}
      <Panel className="!p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boton variante="secundario" size="icono" onClick={() => cambiarMes(-1)} ariaLabel="Mes anterior">
              <ChevronLeft className="w-4 h-4" />
            </Boton>
            <h3 className="font-serif-title font-semibold text-lg md:text-xl text-[var(--tinta)] px-2">
              {nombresMeses[mesVista]} {anoVista}
            </h3>
            <Boton variante="secundario" size="icono" onClick={() => cambiarMes(1)} ariaLabel="Mes siguiente">
              <ChevronRight className="w-4 h-4" />
            </Boton>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Boton variante="secundario" size="sm" onClick={() => setCalActual(new Date())}>
              Hoy
            </Boton>
            <Boton variante="secundario" size="sm" onClick={() => setShowComprasModal(true)}>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Lista de Compras</span>
            </Boton>
          </div>
        </div>
      </Panel>

      {/* Rejilla del Calendario (Desktop & Mobile) */}
      <Panel className="!p-0">
        {/* Cabecera Días de la semana */}
        <div className="grid grid-cols-7 bg-[#FBF7F2] border-b border-[var(--linea)] text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta-suave)] py-2.5">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--tinta-suave)] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--vino)]" />
            <span>Cargando tu calendario...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--linea-suave)]">
            {diasMatriz.map((fechaObj, idx) => {
              if (!fechaObj) {
                return <div key={`empty-${idx}`} className="bg-[var(--superficie-2)]/40 min-h-[90px] md:min-h-[120px]" />
              }

              const fechaStr = fmtFecha(fechaObj)
              const esHoy = fechaStr === hoyFmt
              const pedidosDelFecha = pedidosList.filter((p) => p.fecha === fechaStr)

              return (
                <div
                  key={fechaStr}
                  onClick={() => setModalFecha(fechaStr)}
                  className={`min-h-[90px] md:min-h-[120px] p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-[var(--superficie-2)] ${
                    esHoy ? 'bg-[var(--vino-suave)]/30' : 'bg-[var(--superficie)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-bold num flex items-center justify-center w-6 h-6 rounded-full ${
                        esHoy ? 'bg-[var(--vino)] text-white' : 'text-[var(--tinta)]'
                      }`}
                    >
                      {fechaObj.getDate()}
                    </span>
                    {pedidosDelFecha.length > 0 && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--vino-suave)] text-[var(--vino-oscuro)] num">
                        {pedidosDelFecha.length} {pedidosDelFecha.length === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    )}
                  </div>

                  {/* Badges de pedidos en el día */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {pedidosDelFecha.slice(0, 3).map((p) => {
                      let badgeStyle = 'bg-amber-100 text-amber-900 border-amber-200'
                      if (p.estado === 'en_preparacion') badgeStyle = 'bg-blue-100 text-blue-900 border-blue-200'
                      if (p.estado === 'entregado') badgeStyle = 'bg-[var(--verde-fondo)] text-[var(--verde)] border-emerald-200'

                      return (
                        <div
                          key={p.id}
                          className={`text-[10px] p-1 rounded-[6px] border truncate font-medium ${badgeStyle}`}
                        >
                          <span className="font-bold">{p.cliente}:</span>{' '}
                          {(p.pedido_items || []).map((i) => i.producto).join(', ')}
                        </div>
                      )
                    })}
                    {pedidosDelFecha.length > 3 && (
                      <span className="text-[9.5px] text-[var(--tinta-tenue)] font-semibold block">
                        +{pedidosDelFecha.length - 3} más...
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {/* Tip de Eli */}
      <TipDeEli>
        Revisa tu lista de compras al inicio de la semana para tener todos los ingredientes en tu despensa antes de comenzar a hornear.
      </TipDeEli>

      {/* ========================================== */}
      {/* MODAL DETALLE / CREAR PEDIDOS DEL DÍA     */}
      {/* ========================================== */}
      {modalFecha && (
        <div className="fixed inset-0 z-50 bg-[#140C08]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-[20px] p-6 max-w-2xl w-full shadow-[var(--sombra-panel)] space-y-5 max-h-[90vh] flex flex-col">
            {/* Cabecera Modal */}
            <div className="flex justify-between items-start shrink-0">
              <div>
                <span className="text-[10.5px] uppercase tracking-[0.1em] font-extrabold text-[var(--vino)]">
                  Agenda de encargos
                </span>
                <h3 className="font-serif-title text-xl font-semibold text-[var(--tinta)]">
                  Pedidos del {modalFecha.split('-').reverse().join('/')}
                </h3>
              </div>
              <Boton variante="icono" size="icono" onClick={() => setModalFecha(null)} ariaLabel="Cerrar modal">
                <X className="w-5 h-5" />
              </Boton>
            </div>

            {/* Formulario Crear Pedido */}
            <form onSubmit={handleCrearPedido} className="bg-[var(--superficie-2)] border border-[var(--linea-suave)] p-4 rounded-[14px] space-y-3.5 shrink-0">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--tinta)] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[var(--vino)] stroke-[2.2]" />
                <span>Nuevo encargo para este día</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Campo id="ord-cli" label="Cliente / Nombre">
                  <Input
                    id="ord-cli"
                    type="text"
                    placeholder="Ej: Javiera Morales"
                    value={ordCliente}
                    onChange={(e) => setOrdCliente(e.target.value)}
                  />
                </Campo>

                <Campo id="ord-est" label="Estado Pedido">
                  <Select
                    id="ord-est"
                    value={ordEstado}
                    onChange={(e) => setOrdEstado(e.target.value)}
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="en_preparacion">👩‍🍳 En preparación</option>
                    <option value="entregado">✅ Entregado</option>
                  </Select>
                </Campo>

                <Campo id="ord-pago" label="Estado Pago">
                  <Select
                    id="ord-pago"
                    value={ordEstadoPago}
                    onChange={(e) => setOrdEstadoPago(e.target.value)}
                  >
                    <option value="no_pagado">🔴 Pendiente de Pago</option>
                    <option value="abonado">🟡 Abonado</option>
                    <option value="pagado">🟢 Pagado Completo</option>
                  </Select>
                </Campo>
              </div>

              {/* Agregar producto al borrador */}
              <div className="p-3 bg-[var(--superficie)] border border-[var(--linea)] rounded-[11px] space-y-2">
                <label className="block text-[11px] font-bold text-[var(--tinta-media)] uppercase">
                  Agregar producto al encargo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <Input
                      type="text"
                      placeholder="Producto (ej: Torta Amor)"
                      list="lista-recetas-pedidos"
                      value={itemProducto}
                      onChange={(e) => handleProductoChange(e.target.value)}
                      className="!h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Cant"
                      className="!h-9 text-xs num"
                      value={itemCantidad}
                      onChange={(e) => setItemCantidad(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Precio un."
                      className="!h-9 text-xs num"
                      value={itemPrecio}
                      onChange={(e) => setItemPrecio(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Boton variante="secundario" size="sm" onClick={handleAddItemBorrador}>
                    <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Añadir a la orden</span>
                  </Boton>
                </div>
              </div>

              {/* Borrador items */}
              {itemsBorrador.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[var(--tinta-media)] uppercase">
                    Productos en la orden ({itemsBorrador.length}):
                  </label>
                  <div className="divide-y divide-[var(--linea-suave)] border border-[var(--linea)] rounded-[10px] bg-white overflow-hidden text-xs">
                    {itemsBorrador.map((it, idx) => (
                      <div key={idx} className="p-2 px-3 flex justify-between items-center">
                        <div>
                          <b>{it.producto}</b> (x{it.cantidad}) · <span className="num">{CLP(it.precio_unitario, 0)}/un</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--vino)] num">
                            {CLP(it.cantidad * it.precio_unitario, 0)}
                          </span>
                          <Boton variante="icono" size="icono" onClick={() => handleRemoveItemBorrador(idx)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Boton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Boton variante="principal" type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                <span>Guardar Pedido</span>
              </Boton>
            </form>

            {/* Listado de Pedidos Existentes del Día */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 min-h-[150px]">
              <div className="flex items-center justify-between border-b border-[var(--linea-suave)] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--tinta-media)]">
                  Pedidos agendados ({pedidosDelDiaFiltrados.length})
                </h4>
                <Select
                  value={filtroEstadoModal}
                  onChange={(e) => setFiltroEstadoModal(e.target.value)}
                  className="!h-8 !text-xs !w-auto"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_preparacion">En preparación</option>
                  <option value="entregado">Entregados</option>
                </Select>
              </div>

              {pedidosDelDiaFiltrados.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--tinta-suave)] border border-dashed border-[var(--linea)] rounded-[12px]">
                  No hay pedidos guardados para este día.
                </div>
              ) : (
                pedidosDelDiaFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-[14px] bg-[var(--superficie-2)] border border-[var(--linea-suave)] space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--linea-suave)] pb-2">
                      <div>
                        <div className="font-bold text-sm text-[var(--tinta)]">
                          {p.cliente}
                        </div>
                        <div className="text-xs font-bold text-[var(--vino)] num mt-0.5">
                          Total: {CLP(p.total, 0)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Selector Estado */}
                        <Select
                          value={p.estado}
                          onChange={(e) => handleActualizarEstado(p.id, e.target.value)}
                          className="!h-8 !text-xs !w-auto"
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="en_preparacion">👩‍🍳 En preparación</option>
                          <option value="entregado">✅ Entregado</option>
                        </Select>

                        {/* Selector Pago */}
                        <Select
                          value={p.estado_pago_cliente || 'no_pagado'}
                          onChange={(e) => handleActualizarPago(p.id, e.target.value)}
                          className="!h-8 !text-xs !w-auto"
                        >
                          <option value="no_pagado">🔴 No pagado</option>
                          <option value="abonado">🟡 Abonado</option>
                          <option value="pagado">🟢 Pagado</option>
                        </Select>

                        <Boton
                          variante="icono"
                          size="icono"
                          onClick={() => handleEliminarPedido(p.id, p.cliente)}
                          ariaLabel="Eliminar pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Boton>
                      </div>
                    </div>

                    {/* Items del pedido */}
                    <div className="space-y-1">
                      {(p.pedido_items || []).map((it, i) => (
                        <div key={i} className="text-xs text-[var(--tinta-media)] flex justify-between">
                          <span>
                            • <b>{it.producto}</b> (x{it.cantidad})
                          </span>
                          <span className="num font-semibold text-[var(--tinta)]">
                            {CLP(it.cantidad * it.precio_unitario, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lista de Compras */}
      <ListaComprasModal
        isOpen={showComprasModal}
        onClose={() => setShowComprasModal(false)}
        pedidosList={pedidosList}
        recetasGuardadas={recetasGuardadas}
        despensaItems={despensaItems}
      />
    </div>
  )
}
