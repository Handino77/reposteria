import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { normalizarTextoFlex } from '../utils/conversores'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { BookOpen, Plus, Trash2, Edit2, Calculator, Search, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export default function Recetas({ user, onCostearReceta }) {
  const [recetas, setRecetas] = useState([])
  const [despensaItems, setDespensaItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Campos de formulario
  const [editId, setEditId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [rinde, setRinde] = useState('12')
  const [ingredientesLinea, setIngredientesLinea] = useState([])

  // Fila actual de ingrediente en edición
  const [ingNombre, setIngNombre] = useState('')
  const [ingCant, setIngCant] = useState('')
  const [ingUnidad, setIngUnidad] = useState('g')
  const [selectedDespensaId, setSelectedDespensaId] = useState(null)
  const [sugerenciaDespensa, setSugerenciaDespensa] = useState(null)

  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    fetchRecetasYDespensa()
  }, [user])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchRecetasYDespensa = async () => {
    try {
      setLoading(true)
      // Cargar recetas con sus líneas de receta_ingredientes
      const { data: recData, error: recError } = await supabase
        .from('recetas')
        .select(`
          *,
          receta_ingredientes (*)
        `)
        .order('creado_en', { ascending: false })

      if (recError) throw recError

      // Cargar ingredientes de la despensa para autocompletar
      const { data: despData, error: despError } = await supabase
        .from('despensa')
        .select('id, nombre, unidad_base')

      if (despError) throw despError
      const despList = despData || []
      setDespensaItems(despList)

      // Reparación automática segura de enlaces
      if (recData && recData.length > 0 && despList.length > 0) {
        let repairedCount = 0
        const updatesToRun = []

        for (const r of recData) {
          const ings = r.receta_ingredientes || []
          for (const ing of ings) {
            if (!ing.despensa_id) {
              const calces = despList.filter(
                (d) => normalizarTextoFlex(d.nombre) === normalizarTextoFlex(ing.nombre)
              )
              if (calces.length === 1) {
                const matchFlex = calces[0]
                ing.despensa_id = matchFlex.id
                updatesToRun.push(
                  supabase
                    .from('receta_ingredientes')
                    .update({ despensa_id: matchFlex.id })
                    .eq('id', ing.id)
                )
                repairedCount++
              } else if (calces.length > 1) {
                console.warn('Ambiguo, no se enlaza automáticamente:', ing.nombre, calces.map((c) => c.nombre))
              }
            }
          }
        }

        if (updatesToRun.length > 0) {
          await Promise.all(updatesToRun)
          showToast(`✨ Se enlazaron automáticamente ${repairedCount} ingredientes de tus recetas con tu despensa`)
        }
      }

      setRecetas(recData || [])
    } catch (err) {
      console.error('Error al cargar datos:', err)
      showToast('Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  // Handler al seleccionar o cambiar el nombre del ingrediente
  const handleIngNombreChange = (val) => {
    setIngNombre(val)
    if (!val.trim()) {
      setSelectedDespensaId(null)
      setSugerenciaDespensa(null)
      return
    }

    const exactMatch = despensaItems.find((d) => d.nombre === val)
    if (exactMatch) {
      setSelectedDespensaId(exactMatch.id)
      setSugerenciaDespensa(null)
      return
    }

    const flexMatch = despensaItems.find(
      (d) => normalizarTextoFlex(d.nombre) === normalizarTextoFlex(val)
    )
    if (flexMatch) {
      setSelectedDespensaId(flexMatch.id)
      setSugerenciaDespensa(flexMatch)
    } else {
      setSelectedDespensaId(null)
      setSugerenciaDespensa(null)
    }
  }

  const handleAddIngredienteLinea = (e) => {
    e.preventDefault()
    if (!ingNombre.trim() || !ingCant || parseFloat(ingCant) <= 0) {
      showToast('Escribe el ingrediente y una cantidad válida')
      return
    }

    let despId = selectedDespensaId
    let finalNombre = ingNombre.trim()

    if (!despId) {
      const matchExact = despensaItems.find(
        (d) => d.nombre.toLowerCase().trim() === ingNombre.toLowerCase().trim()
      )
      if (matchExact) {
        despId = matchExact.id
        finalNombre = matchExact.nombre
      } else {
        const matchFlex = despensaItems.find(
          (d) => normalizarTextoFlex(d.nombre) === normalizarTextoFlex(ingNombre)
        )
        if (matchFlex) {
          despId = matchFlex.id
        }
      }
    }

    setIngredientesLinea([
      ...ingredientesLinea,
      {
        nombre: finalNombre,
        cantidad: parseFloat(ingCant),
        unidad: ingUnidad,
        despensa_id: despId
      }
    ])

    setIngNombre('')
    setIngCant('')
    setSelectedDespensaId(null)
    setSugerenciaDespensa(null)
  }

  const handleRemoveIngredienteLinea = (idx) => {
    setIngredientesLinea(ingredientesLinea.filter((_, i) => i !== idx))
  }

  const handleSaveReceta = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !rinde || parseFloat(rinde) <= 0 || ingredientesLinea.length === 0) {
      showToast('Indica nombre, rendimiento y al menos un ingrediente')
      return
    }

    try {
      setSaving(true)
      const rindeNum = parseFloat(rinde)

      if (editId) {
        // Actualizar receta existente
        const { error: updateError } = await supabase
          .from('recetas')
          .update({
            nombre: nombre.trim(),
            rinde: rindeNum
          })
          .eq('id', editId)

        if (updateError) throw updateError

        // Borrar líneas antiguas y reinsertar
        const { error: deleteLinesError } = await supabase
          .from('receta_ingredientes')
          .delete()
          .eq('receta_id', editId)

        if (deleteLinesError) throw deleteLinesError

        // Insertar nuevas líneas
        const lineasPayload = ingredientesLinea.map((item, idx) => ({
          receta_id: editId,
          despensa_id: item.despensa_id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          unidad: item.unidad,
          orden: idx
        }))

        const { error: insertLinesError } = await supabase
          .from('receta_ingredientes')
          .insert(lineasPayload)

        if (insertLinesError) throw insertLinesError

        showToast(`¡Receta ${nombre} actualizada! 💾`)
      } else {
        // Crear receta nueva
        const { data: newReceta, error: recError } = await supabase
          .from('recetas')
          .insert([
            {
              repostera_id: user.id,
              nombre: nombre.trim(),
              rinde: rindeNum
            }
          ])
          .select()
          .single()

        if (recError) throw recError

        // Insertar líneas
        const lineasPayload = ingredientesLinea.map((item, idx) => ({
          receta_id: newReceta.id,
          despensa_id: item.despensa_id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          unidad: item.unidad,
          orden: idx
        }))

        const { error: lineasError } = await supabase
          .from('receta_ingredientes')
          .insert(lineasPayload)

        if (lineasError) throw lineasError

        showToast(`¡Receta ${nombre} guardada en tu recetario! 💾`)
      }

      cancelarEdicion()
      fetchRecetasYDespensa()
    } catch (err) {
      console.error('Error al guardar receta:', err)
      showToast('Error al guardar en Supabase: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (receta) => {
    setEditId(receta.id)
    setNombre(receta.nombre)
    setRinde(receta.rinde)
    setIngredientesLinea(
      (receta.receta_ingredientes || []).map((i) => ({
        nombre: i.nombre,
        cantidad: i.cantidad,
        unidad: i.unidad,
        despensa_id: i.despensa_id
      }))
    )
  }

  const cancelarEdicion = () => {
    setEditId(null)
    setNombre('')
    setRinde('12')
    setIngredientesLinea([])
    setIngNombre('')
    setIngCant('')
  }

  const handleDelete = async (id, nombreReceta) => {
    if (!confirm(`¿Eliminar la receta "${nombreReceta}"?`)) return

    try {
      const { error } = await supabase.from('recetas').delete().eq('id', id)
      if (error) throw error
      showToast(`Receta "${nombreReceta}" eliminada`)
      if (editId === id) cancelarEdicion()
      fetchRecetasYDespensa()
    } catch (err) {
      console.error('Error al eliminar receta:', err)
      showToast('Error al eliminar receta')
    }
  }

  const recetasFiltradas = recetas.filter((r) =>
    r.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--tinta)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Datalist despensa */}
      <datalist id="lista-despensa-autocompletado">
        {despensaItems.map((item) => (
          <option key={item.id} value={item.nombre} />
        ))}
      </datalist>

      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="Mis recetas"
        introduccion="Guarda tus recetas con sus ingredientes y rendimiento. Podrás costearlas en un clic."
      />

      {/* Buscador de recetas */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-[var(--tinta-tenue)] stroke-[1.8]" />
        <label htmlFor="rec-busca" className="sr-only">
          Buscar receta por nombre
        </label>
        <Input
          id="rec-busca"
          type="search"
          placeholder="Buscar receta por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Listado de Recetas */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="bg-[var(--superficie)] p-8 rounded-[18px] border border-[var(--linea)] text-center text-[var(--tinta-suave)] flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--vino)]" />
            <span className="text-xs">Cargando tus recetas...</span>
          </div>
        ) : recetasFiltradas.length === 0 ? (
          <div className="bg-[var(--superficie)] p-8 rounded-[18px] border border-[var(--linea)] text-center text-xs text-[var(--tinta-suave)]">
            {recetas.length === 0
              ? 'Aún no guardas ninguna receta. ¡Anota la primera abajo!'
              : `No se encontraron recetas para "${searchQuery}"`}
          </div>
        ) : (
          recetasFiltradas.map((r) => (
            <Panel
              key={r.id}
              titulo={r.nombre}
              subtitulo={`Rinde: ${r.rinde} porciones/unidades · ${(r.receta_ingredientes || []).length} ingredientes`}
              acciones={
                <div className="flex items-center gap-1.5">
                  <Boton
                    variante="marca-secundario"
                    size="sm"
                    onClick={() => onCostearReceta && onCostearReceta(r)}
                  >
                    <Calculator className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Costear</span>
                  </Boton>
                  <Boton
                    variante="icono"
                    size="icono"
                    onClick={() => handleEdit(r)}
                    ariaLabel={`Editar ${r.nombre}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Boton>
                  <Boton
                    variante="icono"
                    size="icono"
                    onClick={() => handleDelete(r.id, r.nombre)}
                    ariaLabel={`Eliminar ${r.nombre}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Boton>
                </div>
              }
            >
              {/* Lista de ingredientes de la receta */}
              <div className="flex flex-wrap gap-1.5 text-xs text-[var(--tinta-media)]">
                {(r.receta_ingredientes || []).map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-[var(--superficie-2)] border border-[var(--linea-suave)] px-2.5 py-1 rounded-[8px] num"
                  >
                    <strong className="text-[var(--tinta)]">{ing.nombre}:</strong>{' '}
                    {ing.cantidad} {ing.unidad}
                  </span>
                ))}
              </div>
            </Panel>
          ))
        )}
      </div>

      {/* Formulario Nueva / Editar Receta */}
      <Panel
        titulo={editId ? 'Editar receta' : 'Nueva receta'}
        subtitulo="Ingresa los datos generales y los ingredientes que componen esta mezcla."
      >
        <form onSubmit={handleSaveReceta} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <Campo id="rec-nombre" label="Nombre de la Receta">
                <Input
                  id="rec-nombre"
                  type="text"
                  required
                  placeholder="Ej: Alfajores de maicena"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </Campo>
            </div>

            <div>
              <Campo id="rec-rinde" label="Rendimiento (unidades)">
                <Input
                  id="rec-rinde"
                  type="number"
                  step="any"
                  required
                  placeholder="Ej: 12"
                  className="num font-semibold"
                  value={rinde}
                  onChange={(e) => setRinde(e.target.value)}
                />
              </Campo>
            </div>
          </div>

          {/* Añadir ingrediente a la lista temporal */}
          <div className="p-4 bg-[var(--superficie-2)] rounded-[14px] border border-[var(--linea-suave)] space-y-3">
            <label className="block text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta)]">
              Agregar Ingredientes
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Input
                  id="rec-ing-nombre"
                  type="text"
                  placeholder="Escribe o elige un ingrediente..."
                  list="lista-despensa-autocompletado"
                  value={ingNombre}
                  onChange={(e) => handleIngNombreChange(e.target.value)}
                />
              </div>

              <div>
                <Input
                  id="rec-ing-cant"
                  type="number"
                  step="any"
                  placeholder="Cantidad"
                  className="num"
                  value={ingCant}
                  onChange={(e) => setIngCant(e.target.value)}
                />
              </div>

              <div>
                <Select
                  id="rec-ing-unidad"
                  value={ingUnidad}
                  onChange={(e) => setIngUnidad(e.target.value)}
                >
                  <option value="g">g (gramos)</option>
                  <option value="kg">kg (kilos)</option>
                  <option value="ml">ml (mililitros)</option>
                  <option value="l">l (litros)</option>
                  <option value="cdta">cucharadita (cdta)</option>
                  <option value="cda">cucharada (cda)</option>
                  <option value="taza">taza</option>
                  <option value="unidad">unidad</option>
                  <option value="oz">oz (onzas)</option>
                  <option value="lb">lb (libras)</option>
                </Select>
              </div>
            </div>

            {/* Banner de sugerencia de enlace */}
            {sugerenciaDespensa && (
              <div className="bg-[var(--oro-fondo)] border border-[var(--oro)]/30 rounded-[11px] p-2.5 text-xs text-[var(--tinta)] flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--oro)] shrink-0" />
                  <span>¿Te refieres a <b>"{sugerenciaDespensa.nombre}"</b> de tu despensa?</span>
                </span>
                <Boton
                  variante="principal"
                  size="sm"
                  onClick={() => {
                    setIngNombre(sugerenciaDespensa.nombre)
                    setSelectedDespensaId(sugerenciaDespensa.id)
                    setSugerenciaDespensa(null)
                  }}
                  className="shrink-0"
                >
                  Usar de Despensa
                </Boton>
              </div>
            )}

            <Boton variante="secundario" size="sm" onClick={handleAddIngredienteLinea}>
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Agregar ingrediente a la mezcla</span>
            </Boton>
          </div>

          {/* Lista de ingredientes agregados */}
          <div className="space-y-2">
            <label className="block text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--tinta-media)]">
              Ingredientes en esta receta ({ingredientesLinea.length})
            </label>
            {ingredientesLinea.length === 0 ? (
              <div className="p-4 border border-dashed border-[var(--linea)] rounded-[12px] text-center text-xs text-[var(--tinta-suave)]">
                Aún no agregas ingredientes a esta receta
              </div>
            ) : (
              <div className="divide-y divide-[var(--linea-suave)] border border-[var(--linea)] rounded-[12px] overflow-hidden">
                {ingredientesLinea.map((item, idx) => {
                  const estaEnlazado = !!item.despensa_id
                  return (
                    <div key={idx} className="p-3 bg-[var(--superficie)] flex justify-between items-center text-xs md:text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--tinta)]">{item.nombre}</span>
                        <span className="text-[var(--tinta-suave)] num">
                          ({item.cantidad} {item.unidad})
                        </span>
                        {estaEnlazado ? (
                          <Pastilla variante="verde">
                            <CheckCircle2 className="w-3 h-3 stroke-[2]" /> Enlazado
                          </Pastilla>
                        ) : (
                          <Pastilla variante="neutral">
                            Libre
                          </Pastilla>
                        )}
                      </div>
                      <Boton
                        variante="icono"
                        size="icono"
                        onClick={() => handleRemoveIngredienteLinea(idx)}
                        ariaLabel={`Eliminar ${item.nombre}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Boton>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            {editId && (
              <Boton variante="secundario" onClick={cancelarEdicion}>
                Cancelar
              </Boton>
            )}
            <Boton variante="principal" type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4 stroke-[2]" />
              )}
              <span>{editId ? 'Guardar Cambios' : 'Guardar receta'}</span>
            </Boton>
          </div>
        </form>
      </Panel>
    </div>
  )
}
