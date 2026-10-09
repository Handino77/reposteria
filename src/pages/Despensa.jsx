import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { factorBase, unidadBaseDe, CLP } from '../utils/conversores'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { TarjetaIndicador } from '../components/ui/TarjetaIndicador'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { TipDeEli } from '../components/ui/TipDeEli'
import { Plus, Search, Edit2, Trash2, Loader2, Check } from 'lucide-react'
import { ModalUpsell } from '../components/ModalUpsell'

export default function Despensa({ user, isPro = false, onIrALogin, onIrASuscripcion }) {
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Estado Modal Upsell
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellModo, setUpsellModo] = useState('login')

  // Campos del formulario
  const [editId, setEditId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [precio, setPrecio] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    fetchDespensa()
  }, [user])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchDespensa = async () => {
    if (!user) {
      setIngredientes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('despensa')
        .select('*')
        .order('creado_en', { ascending: false })

      if (error) throw error
      setIngredientes(data || [])
    } catch (err) {
      console.error('Error al obtener despensa:', err)
      showToast('Error al cargar la despensa desde Supabase')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !cantidad || isNaN(parseFloat(precio))) {
      showToast('Por favor completa todos los campos correctamente')
      return
    }

    // 1. Si no hay usuario logueado -> Pedir Login/Registro
    if (!user) {
      setUpsellModo('login')
      setShowUpsell(true)
      return
    }

    // 2. Si es usuario Gratis y va a crear un ingrediente nuevo -> Verificar límite de 5
    if (!isPro && !editId && ingredientes.length >= 5) {
      setUpsellModo('limit_despensa')
      setShowUpsell(true)
      return
    }

    const cantNum = parseFloat(cantidad)
    const precioNum = parseFloat(precio)
    const fBase = factorBase(unidad)
    const costoBaseCalculado = precioNum / (cantNum * fBase)
    const uBase = unidadBaseDe(unidad)

    try {
      setSaving(true)
      if (editId) {
        // Actualizar ingrediente
        const { error } = await supabase
          .from('despensa')
          .update({
            nombre: nombre.trim(),
            cantidad: cantNum,
            precio: precioNum,
            costo_base: costoBaseCalculado,
            unidad_base: uBase,
            unidad_compra: unidad
          })
          .eq('id', editId)

        if (error) throw error
        showToast(`¡${nombre} actualizado en tu despensa! ✏️`)
      } else {
        // Crear ingrediente nuevo
        const { error } = await supabase
          .from('despensa')
          .insert([
            {
              repostera_id: user.id,
              nombre: nombre.trim(),
              cantidad: cantNum,
              precio: precioNum,
              costo_base: costoBaseCalculado,
              unidad_base: uBase,
              unidad_compra: unidad
            }
          ])

        if (error) throw error
        showToast(`¡${nombre} sumado a tu despensa! 🧁`)
      }

      cancelarEdicion()
      fetchDespensa()
    } catch (err) {
      console.error('Error al guardar ingrediente:', err)
      showToast('Error al guardar en Supabase: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ing) => {
    setEditId(ing.id)
    setNombre(ing.nombre)
    setCantidad(ing.cantidad)
    setUnidad(ing.unidad_compra || 'kg')
    setPrecio(ing.precio)
  }

  const cancelarEdicion = () => {
    setEditId(null)
    setNombre('')
    setCantidad('')
    setUnidad('kg')
    setPrecio('')
  }

  const handleDelete = async (id, nombreIng) => {
    if (!confirm(`¿Eliminar ${nombreIng} de tu despensa?`)) return

    try {
      const { error } = await supabase
        .from('despensa')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast(`Ingrediente ${nombreIng} eliminado`)
      if (editId === id) cancelarEdicion()
      fetchDespensa()
    } catch (err) {
      console.error('Error al eliminar ingrediente:', err)
      showToast('Error al eliminar ingrediente')
    }
  }

  const ingredientesFiltrados = ingredientes.filter((i) =>
    i.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  // Encontrar el ingrediente con mayor costo base por unidad para el indicador
  const masCaro = ingredientes.length > 0
    ? [...ingredientes].sort((a, b) => (b.costo_base || 0) - (a.costo_base || 0))[0]
    : null

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Mi despensa"
        introduccion="Ten a mano tus costos reales y deja de adivinar cuánto te cuesta cada ingrediente. Lo demás lo calculamos nosotras."
      />

      {/* Tarjetas de Indicadores */}
      <section aria-label="Resumen de tu despensa" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <TarjetaIndicador
          etiqueta="Ingredientes registrados"
          valor={ingredientes.length}
          nota="en tu despensa"
        />
        <TarjetaIndicador
          etiqueta="Estado del registro"
          valor={ingredientes.length > 0 ? "Al día" : "Vacía"}
          insignia={ingredientes.length > 0 ? "Al día" : undefined}
          nota={ingredientes.length === 0 ? "Sin datos" : undefined}
        />
        <TarjetaIndicador
          etiqueta="Ingrediente más valioso"
          valor={masCaro ? masCaro.nombre : "—"}
          nota={masCaro ? `${CLP(masCaro.costo_base, 2)} / ${masCaro.unidad_base}` : "—"}
        />
      </section>

      {/* Panel Formulario: Agregar / Editar ingrediente */}
      <Panel
        titulo={editId ? 'Editar ingrediente' : 'Agregar un ingrediente'}
        subtitulo="Anota el formato que realmente compras y calculamos solas su costo base."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <Campo id="g-nom" label="Ingrediente">
              <Input
                id="g-nom"
                required
                placeholder="Ej. Chocolate cobertura 55%"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Campo>

            <Campo id="g-cant" label="Cantidad">
              <Input
                id="g-cant"
                type="number"
                step="any"
                required
                placeholder="1"
                className="num"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </Campo>

            <Campo id="g-uni" label="Unidad">
              <Select
                id="g-uni"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
              >
                <option value="kg">kg (kilos)</option>
                <option value="g">g (gramos)</option>
                <option value="l">l (litros)</option>
                <option value="ml">ml (mililitros)</option>
                <option value="unidad">unidad</option>
              </Select>
            </Campo>

            <Campo id="g-pre" label="Precio pagado (CLP)">
              <div className="relative">
                <span className="absolute left-3 top-3 text-[var(--tinta-suave)] text-[13.5px]">
                  $
                </span>
                <Input
                  id="g-pre"
                  type="number"
                  step="any"
                  required
                  placeholder="1200"
                  className="num pl-7"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
            </Campo>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            {editId && (
              <Boton variante="secundario" onClick={cancelarEdicion}>
                Cancelar
              </Boton>
            )}
            <Boton variante="principal" type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>{editId ? 'Guardar cambios' : 'Guardar ingrediente'}</span>
            </Boton>
          </div>
        </form>
      </Panel>

      {/* Lista / Tabla de Ingredientes */}
      <Panel className="!p-0">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--linea-suave)]">
          <div>
            <h2 className="text-base md:text-[17px] font-bold text-[var(--tinta)]">
              En tu despensa
            </h2>
            <p className="num text-xs text-[var(--tinta-suave)] mt-0.5">
              {ingredientesFiltrados.length} ingredientes · costos actualizados
            </p>
          </div>

          {/* Buscador de Ingredientes */}
          <div className="relative w-full sm:w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--tinta-tenue)] stroke-[1.8]" />
            <label htmlFor="g-busca" className="sr-only">
              Buscar ingrediente
            </label>
            <input
              id="g-busca"
              type="search"
              placeholder="Buscar ingrediente"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 border border-[var(--linea)] rounded-[10px] bg-white pl-8 pr-3 font-sans text-xs text-[var(--tinta)] outline-none focus:border-[var(--vino-borde)] focus:ring-2 focus:ring-[var(--vino)]/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[var(--tinta-suave)] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--vino)]" />
            <span className="text-xs">Cargando tu despensa...</span>
          </div>
        ) : ingredientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-[var(--tinta-suave)] text-xs">
            {ingredientes.length === 0
              ? '¡Tu cocina está vacía! Agrega tus ingredientes en el formulario de arriba.'
              : `No se encontraron ingredientes para "${searchQuery}"`}
          </div>
        ) : (
          <div>
            {/* Encabezado de tabla (Solo Desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_180px_140px_40px] gap-3 px-5 py-2.5 bg-[#FBF7F2] border-b border-[var(--linea)] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta-suave)]">
              <span>Ingrediente</span>
              <span>Formato comprado</span>
              <span>Costo base</span>
              <span className="text-right">Acciones</span>
            </div>

            {/* Filas */}
            <div className="divide-y divide-[var(--linea-suave)] p-3 md:p-0 space-y-2 md:space-y-0">
              {ingredientesFiltrados.map((ing) => (
                <div
                  key={ing.id}
                  className="bg-[var(--superficie)] md:bg-transparent border border-[var(--linea)] md:border-0 rounded-[14px] md:rounded-none p-3.5 md:p-[14px]_5 md:grid md:grid-cols-[1fr_180px_140px_40px] md:gap-3 md:items-center hover:bg-[var(--superficie-2)]/60 transition-colors"
                >
                  {/* Nombre y tipo */}
                  <div className="flex items-center justify-between md:block">
                    <div className="font-bold text-[13.5px] text-[var(--tinta)]">
                      {ing.nombre}
                    </div>
                    {/* Acciones en mobile */}
                    <div className="flex md:hidden items-center gap-1">
                      <Boton
                        variante="icono"
                        size="icono"
                        onClick={() => handleEdit(ing)}
                        ariaLabel={`Editar ${ing.nombre}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Boton>
                      <Boton
                        variante="icono"
                        size="icono"
                        onClick={() => handleDelete(ing.id, ing.nombre)}
                        ariaLabel={`Eliminar ${ing.nombre}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Boton>
                    </div>
                  </div>

                  {/* Formato comprado */}
                  <div className="num text-xs text-[var(--tinta-media)] mt-1 md:mt-0">
                    {ing.cantidad} {ing.unidad_compra || ing.unidad_base} · {CLP(ing.precio)}
                  </div>

                  {/* Costo base badge */}
                  <div className="mt-2 md:mt-0">
                    <Pastilla variante="vino">
                      {CLP(ing.costo_base, 2)} / {ing.unidad_base}
                    </Pastilla>
                  </div>

                  {/* Acciones en desktop */}
                  <div className="hidden md:flex justify-end items-center gap-1">
                    <Boton
                      variante="icono"
                      size="icono"
                      onClick={() => handleEdit(ing)}
                      ariaLabel={`Editar ${ing.nombre}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Boton>
                    <Boton
                      variante="icono"
                      size="icono"
                      onClick={() => handleDelete(ing.id, ing.nombre)}
                      ariaLabel={`Eliminar ${ing.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* Tip de Eli */}
      <TipDeEli>
        anota incluso los ingredientes que usas «un poquito». Cuando sumas todo, esos costos chicos también cuentan y te ayudan a poner un precio justo.
      </TipDeEli>

      {/* Modal Upsell / Promoción PRO */}
      <ModalUpsell
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        modo={upsellModo}
        onIrALogin={onIrALogin}
        onIrASuscripcion={onIrASuscripcion}
      />
    </div>
  )
}
