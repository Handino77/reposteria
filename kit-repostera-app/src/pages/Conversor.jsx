import React, { useState } from 'react'
import { RefreshCw, Scale, PieChart, Egg, Bandage, Flame, Table, ChevronDown, ChevronUp } from 'lucide-react'
import {
  densidadTazas
} from '../utils/conversores'
import {
  cucharasGramos,
  unidadesConv,
  recetasSustitutos,
  tablaMoldesFija
} from '../utils/tablasConversion'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { Campo, Input, Select } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { Pastilla } from '../components/ui/Pastilla'
import { TipDeEli } from '../components/ui/TipDeEli'

export default function Conversor() {
  const [activeSubtab, setActiveSubtab] = useState('tazas')
  const [guiaOpen, setGuiaOpen] = useState(false)

  // Subtab 1: Tazas & Cucharas
  const [tazaIng, setTazaIng] = useState('Harina de trigo')
  const [tazaCant, setTazaCant] = useState(1)

  const [cucharaTipo, setCucharaTipo] = useState('tbsp')
  const [cucharaIng, setCucharaIng] = useState('Harina')
  const [cucharaCant, setCucharaCant] = useState(1)

  // Subtab 2: Peso & Volumen
  const [convValor, setConvValor] = useState(1)
  const [convDe, setConvDe] = useState('kg')
  const [convA, setConvA] = useState('g')
  const [convDensidad, setConvDensidad] = useState(1)

  // Subtab 3: Moldes
  const [moldeIn, setMoldeIn] = useState(8)
  const [moldeCm, setMoldeCm] = useState(20)

  const [moldeBaseTipo, setMoldeBaseTipo] = useState('redondo')
  const [moldeBaseDiametro, setMoldeBaseDiametro] = useState(20)
  const [moldeBaseW, setMoldeBaseW] = useState(20)
  const [moldeBaseL, setMoldeBaseL] = useState(20)

  const [moldeNuevoTipo, setMoldeNuevoTipo] = useState('redondo')
  const [moldeNuevoDiametro, setMoldeNuevoDiametro] = useState(26)
  const [moldeNuevoW, setMoldeNuevoW] = useState(20)
  const [moldeNuevoL, setMoldeNuevoL] = useState(30)

  // Subtab 4: Huevos
  const [huevoTamano, setHuevoTamano] = useState(63)
  const [huevoCant, setHuevoCant] = useState(3)

  // Subtab 5: Sustitutos
  const [sustitutoSel, setSustitutoSel] = useState('buttermilk')

  // Subtab 6: Temperatura
  const [tempC, setTempC] = useState(175)
  const [tempF, setTempF] = useState(350)

  // Subtab 7: Tablas maestras
  const [filtroTablaTazas, setFiltroTablaTazas] = useState('')

  // ------------------------------------------------
  // CÁLCULOS B1: Tazas & Cucharas
  // ------------------------------------------------
  const listaDensidadKeys = Object.keys(densidadTazas).sort((a, b) => a.localeCompare(b, 'es'))
  const denVal = densidadTazas[tazaIng] || 125
  const tazaGramosRes = (denVal * (parseFloat(tazaCant) || 0)).toLocaleString('es-CL', { maximumFractionDigits: 1 })
  const tazaVolRes = Math.round((parseFloat(tazaCant) || 0) * 240)

  const listaCucharaKeys = cucharasGramos[cucharaTipo] ? Object.keys(cucharasGramos[cucharaTipo]) : []
  const cucharaBasePeso = (cucharasGramos[cucharaTipo] && cucharasGramos[cucharaTipo][cucharaIng]) || 10
  const cucharaGramosRes = (cucharaBasePeso * (parseFloat(cucharaCant) || 0)).toLocaleString('es-CL', { maximumFractionDigits: 1 })

  // ------------------------------------------------
  // CÁLCULOS B2: Peso & Volumen
  // ------------------------------------------------
  const uDe = unidadesConv[convDe]
  const uA = unidadesConv[convA]
  let convResultadoStr = ''
  let esCruzado = false

  if (uDe && uA) {
    const val = parseFloat(convValor) || 0
    let res = 0
    if (uDe.grupo === uA.grupo) {
      const enBase = val * uDe.factor
      res = enBase / uA.factor
    } else {
      esCruzado = true
      const den = parseFloat(convDensidad) || 1
      if (uDe.grupo === 'volumen' && uA.grupo === 'peso') {
        const ml = val * uDe.factor
        const g = ml * den
        res = g / uA.factor
      } else {
        const g = val * uDe.factor
        const ml = g / den
        res = ml / uA.factor
      }
    }
    convResultadoStr = `${val.toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${uDe.nombre} = ${res.toLocaleString('es-CL', { maximumFractionDigits: 3 })} ${uA.nombre}`
  }

  // ------------------------------------------------
  // CÁLCULOS B3: Moldes
  // ------------------------------------------------
  const handleMoldeInChange = (val) => {
    setMoldeIn(val)
    const valNum = parseFloat(val) || 0
    const cm = tablaMoldesFija[Math.round(valNum)] || Math.round(valNum * 2.54)
    setMoldeCm(cm)
  }

  const handleMoldeCmChange = (val) => {
    setMoldeCm(val)
    const valNum = parseFloat(val) || 0
    let foundIn = null
    for (const [k, v] of Object.entries(tablaMoldesFija)) {
      if (Math.abs(v - valNum) < 1.5) {
        foundIn = k
        break
      }
    }
    const valIn = foundIn ? parseFloat(foundIn) : Math.round((valNum / 2.54) * 10) / 10
    setMoldeIn(valIn)
  }

  let areaBase = 1
  if (moldeBaseTipo === 'redondo') {
    const d = parseFloat(moldeBaseDiametro) || 20
    areaBase = Math.PI * (d / 2) * (d / 2)
  } else {
    areaBase = (parseFloat(moldeBaseW) || 20) * (parseFloat(moldeBaseL) || 20)
  }

  let areaNueva = 1
  if (moldeNuevoTipo === 'redondo') {
    const d = parseFloat(moldeNuevoDiametro) || 26
    areaNueva = Math.PI * (d / 2) * (d / 2)
  } else {
    areaNueva = (parseFloat(moldeNuevoW) || 20) * (parseFloat(moldeNuevoL) || 30)
  }

  const factorMolde = Math.max(0.1, Math.round((areaNueva / areaBase) * 100) / 100)

  // ------------------------------------------------
  // CÁLCULOS B4: Huevos
  // ------------------------------------------------
  const pesoHuevoTotalNeto = Math.round((parseFloat(huevoTamano) || 63) * 0.88 * (parseFloat(huevoCant) || 1))
  const clarasGramos = Math.round(pesoHuevoTotalNeto * 0.64)
  const yemasGramos = Math.round(pesoHuevoTotalNeto * 0.36)

  // ------------------------------------------------
  // CÁLCULOS B6: Horno °C / °F
  // ------------------------------------------------
  const handleTempCChange = (val) => {
    setTempC(val)
    const num = parseFloat(val) || 0
    setTempF(Math.round(num * 1.8 + 32))
  }

  const handleTempFChange = (val) => {
    setTempF(val)
    const num = parseFloat(val) || 0
    setTempC(Math.round((num - 32) / 1.8))
  }

  const cNum = parseFloat(tempC) || 0
  let tempGuiaStr = 'Fuego medio (Queques, bizcochos clásicos)'
  if (cNum <= 125) tempGuiaStr = 'Fuego muy bajo (Merengues, suspiros, secado)'
  else if (cNum <= 155) tempGuiaStr = 'Fuego bajo (Flanes, cheesecakes a baño maría)'
  else if (cNum <= 170) tempGuiaStr = 'Fuego medio-bajo (Tartas delicadas, macarons)'
  else if (cNum <= 185) tempGuiaStr = 'Fuego medio (Queques, bizcochos, cupcakes estándar)'
  else if (cNum <= 210) tempGuiaStr = 'Fuego medio-alto (Galletas crujientes, masa de hojaldre)'
  else if (cNum <= 235) tempGuiaStr = 'Fuego alto (Muffins con cúpula alta, scones, panes)'
  else tempGuiaStr = 'Fuego muy alto (Pizzas, focaccias, gratinado)'

  // Subtab 7: Filtro tabla tazas
  const tablaTazasFiltrada = listaDensidadKeys.filter((k) =>
    k.toLowerCase().includes(filtroTablaTazas.toLowerCase())
  )

  const subtabsList = [
    { id: 'tazas', icon: Scale, label: '🥣 Tazas & Cucharas' },
    { id: 'peso-vol', icon: RefreshCw, label: '⚖️ Peso & Volumen' },
    { id: 'moldes', icon: PieChart, label: '🎂 Adaptador de Moldes' },
    { id: 'huevos', icon: Egg, label: '🥚 Huevos & Medidas' },
    { id: 'sustitutos', icon: Bandage, label: '🩹 Sustitutos Express' },
    { id: 'temperatura', icon: Flame, label: '🌡️ Horno (°C / °F)' },
    { id: 'tablas', icon: Table, label: '📋 Tablas Maestras' }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <EncabezadoPagina
        antetitulo="Hecho con cariño por Eli 💖"
        titulo="De tazas a gramos (Conversor)"
        introduccion="Guía y calculadora completa de equivalencias reposteras: tazas, cucharas, peso, volumen, moldes, huevos, sustitutos y horno."
      />

      {/* Mini-Guía desplegable */}
      <div className="bg-[var(--superficie)] border border-[var(--linea)] border-l-4 border-l-[var(--oro)] rounded-[14px] p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setGuiaOpen(!guiaOpen)}
          className="w-full flex items-center justify-between text-left font-bold text-xs md:text-sm text-[var(--tinta)] cursor-pointer"
        >
          <span>💡 Guía de herramientas reposteras de conversión</span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--oro)] bg-[var(--oro-fondo)] px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2">
            {guiaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {guiaOpen ? 'Ocultar guía' : 'Ver mini-guía'}
          </span>
        </button>

        {guiaOpen && (
          <div className="mt-3 pt-3 border-t border-dashed border-[var(--linea-suave)] text-xs text-[var(--tinta-suave)] space-y-1.5 leading-relaxed">
            <p>• <b>🥣 Tazas & Cucharas:</b> Conversión exacta a gramos según la densidad real del ingrediente.</p>
            <p>• <b>⚖️ Peso & Volumen:</b> Conversión métrica directa entre Kilos, Gramos, Libras, Onzas, Litros y Mililitros.</p>
            <p>• <b>🎂 Adaptador de Moldes:</b> Calcula por cuánto multiplicar tu masa al cambiar de molde manteniendo la misma altura.</p>
            <p>• <b>🥚 Huevos & Medidas:</b> Pesos netos de claras y yemas por calibre.</p>
            <p>• <b>🩹 Sustitutos Express:</b> Alternativas de emergencia cuando te falta un insumo.</p>
            <p>• <b>🌡️ Horno & Tablas:</b> Grados °C / °F y tablas de consulta rápida.</p>
          </div>
        )}
      </div>

      {/* Subtabs Navegación (7 subtabs) */}
      <div className="flex flex-wrap gap-1.5 bg-[var(--superficie-2)] border border-[var(--linea-suave)] p-1.5 rounded-[14px]">
        {subtabsList.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveSubtab(st.id)}
            className={`flex-1 min-w-[120px] py-2 px-3 text-center rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
              activeSubtab === st.id
                ? 'bg-white text-[var(--vino)] shadow-sm font-extrabold'
                : 'text-[var(--tinta-suave)] hover:text-[var(--tinta)]'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* B1. Tazas & Cucharas */}
      {/* ========================================================= */}
      {activeSubtab === 'tazas' && (
        <div className="space-y-6">
          <Panel titulo="🥣 Tazas a gramos (240 ml estándar americana)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Campo label="Ingrediente">
                <Select
                  value={tazaIng}
                  onChange={(e) => setTazaIng(e.target.value)}
                >
                  {listaDensidadKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </Campo>

              <Campo label="Cantidad de Tazas">
                <Input
                  type="number"
                  step="any"
                  value={tazaCant}
                  onChange={(e) => setTazaCant(e.target.value)}
                />
              </Campo>
            </div>

            {/* Atajos de fracciones */}
            <div className="mb-4">
              <span className="block text-xs font-bold text-[var(--tinta-suave)] mb-1.5 uppercase tracking-wider">
                Atajos rápidos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(0.25)}>
                  1/4 taza (60 ml)
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(0.333)}>
                  1/3 taza (80 ml)
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(0.5)}>
                  1/2 taza (120 ml)
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(0.666)}>
                  2/3 taza (160 ml)
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(0.75)}>
                  3/4 taza (180 ml)
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setTazaCant(1)}>
                  1 taza (240 ml)
                </Boton>
              </div>
            </div>

            <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[var(--vino)] block">
                  Resultado en Gramos:
                </span>
                <span className="text-2xl font-mono font-bold text-[var(--vino)]">
                  {tazaGramosRes} g
                </span>
              </div>
              <span className="text-xs font-semibold text-[var(--tinta-suave)]">
                Equivalente en volumen líquido: <b>{tazaVolRes} ml</b>
              </span>
            </div>
          </Panel>

          <Panel titulo="🥄 Cucharadas y Cucharaditas a gramos">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Campo label="Tipo de medida">
                <Select
                  value={cucharaTipo}
                  onChange={(e) => {
                    setCucharaTipo(e.target.value)
                    const nKeys = cucharasGramos[e.target.value] ? Object.keys(cucharasGramos[e.target.value]) : []
                    if (nKeys.length > 0 && !nKeys.includes(cucharaIng)) {
                      setCucharaIng(nKeys[0])
                    }
                  }}
                >
                  <option value="tbsp">Cucharada sopera (tbsp / cda) - 15 ml</option>
                  <option value="tsp">Cucharadita de té (tsp / cdta) - 5 ml</option>
                </Select>
              </Campo>

              <Campo label="Ingrediente">
                <Select
                  value={cucharaIng}
                  onChange={(e) => setCucharaIng(e.target.value)}
                >
                  {listaCucharaKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </Campo>

              <Campo label="Cantidad">
                <Input
                  type="number"
                  step="any"
                  value={cucharaCant}
                  onChange={(e) => setCucharaCant(e.target.value)}
                />
              </Campo>
            </div>

            <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)]">
              <span className="text-xs uppercase tracking-wider font-bold text-[var(--vino)] block">
                Peso total estimado:
              </span>
              <span className="text-2xl font-mono font-bold text-[var(--vino)]">
                {cucharaGramosRes} g
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================= */}
      {/* B2. Peso & Volumen */}
      {/* ========================================================= */}
      {activeSubtab === 'peso-vol' && (
        <Panel titulo="⚖️ Conversor de Peso & Volumen Métrico">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Campo label="Cantidad a convertir">
              <Input
                type="number"
                step="any"
                value={convValor}
                onChange={(e) => setConvValor(e.target.value)}
              />
            </Campo>

            <Campo label="De (Unidad origen)">
              <Select
                value={convDe}
                onChange={(e) => setConvDe(e.target.value)}
              >
                <optgroup label="Unidades de Peso">
                  <option value="kg">Kilos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="lb">Libras (lb)</option>
                  <option value="oz">Onzas (oz)</option>
                  <option value="mg">Miligramos (mg)</option>
                </optgroup>
                <optgroup label="Unidades de Volumen">
                  <option value="l">Litros (l)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="oz-fl">Onzas líquidas (fl oz)</option>
                  <option value="taza-vol">Tazas (240 ml)</option>
                  <option value="cda-vol">Cucharadas (15 ml)</option>
                  <option value="cdta-vol">Cucharaditas (5 ml)</option>
                </optgroup>
              </Select>
            </Campo>

            <Campo label="A (Unidad destino)">
              <Select
                value={convA}
                onChange={(e) => setConvA(e.target.value)}
              >
                <optgroup label="Unidades de Peso">
                  <option value="kg">Kilos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="lb">Libras (lb)</option>
                  <option value="oz">Onzas (oz)</option>
                  <option value="mg">Miligramos (mg)</option>
                </optgroup>
                <optgroup label="Unidades de Volumen">
                  <option value="l">Litros (l)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="oz-fl">Onzas líquidas (fl oz)</option>
                  <option value="taza-vol">Tazas (240 ml)</option>
                  <option value="cda-vol">Cucharadas (15 ml)</option>
                  <option value="cdta-vol">Cucharaditas (5 ml)</option>
                </optgroup>
              </Select>
            </Campo>
          </div>

          {esCruzado && (
            <div className="p-3 bg-[var(--oro-fondo)] rounded-xl border border-[var(--oro)]/30 space-y-1 mb-4">
              <label className="block text-xs font-bold text-[var(--tinta)]">
                💡 Conversión entre Peso y Volumen: Ingresa la densidad del ingrediente (g/ml)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  value={convDensidad}
                  onChange={(e) => setConvDensidad(e.target.value)}
                  className="w-32"
                />
                <span className="text-xs text-[var(--tinta-suave)]">
                  g/ml (Ej: Agua/Leche = 1.0, Aceite = 0.92, Miel = 1.42, Harina = 0.52)
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)]">
            <span className="text-xs uppercase tracking-wider font-bold text-[var(--vino)] block">
              Resultado equivalente:
            </span>
            <span className="text-xl font-mono font-bold text-[var(--vino)]">
              {convResultadoStr}
            </span>
          </div>
        </Panel>
      )}

      {/* ========================================================= */}
      {/* B3. Adaptador de Moldes */}
      {/* ========================================================= */}
      {activeSubtab === 'moldes' && (
        <div className="space-y-6">
          <Panel titulo="📐 Equivalencia Pulgadas ↔ Centímetros (Moldes)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Diámetro / Ancho en Pulgadas (in / &quot;)">
                <Input
                  type="number"
                  step="any"
                  value={moldeIn}
                  onChange={(e) => handleMoldeInChange(e.target.value)}
                />
              </Campo>

              <Campo label="Equivalente en Centímetros (cm)">
                <Input
                  type="number"
                  step="any"
                  value={moldeCm}
                  onChange={(e) => handleMoldeCmChange(e.target.value)}
                />
              </Campo>
            </div>
          </Panel>

          <Panel titulo="🎂 Calculadora de Factor de Escala para Moldes">
            <p className="text-xs text-[var(--tinta-suave)] mb-4">
              Compara el área del molde original de tu receta con el nuevo molde que vas a usar para multiplicar todos tus ingredientes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
              {/* Molde Base */}
              <div className="p-4 bg-[var(--superficie-2)] rounded-xl border border-[var(--linea-suave)] space-y-3">
                <span className="text-xs uppercase font-bold text-[var(--vino)] block">
                  1. Molde Original (de tu receta)
                </span>
                <Campo label="Forma">
                  <Select
                    value={moldeBaseTipo}
                    onChange={(e) => setMoldeBaseTipo(e.target.value)}
                  >
                    <option value="redondo">Redondo</option>
                    <option value="rectangular">Rectangular / Cuadrado</option>
                  </Select>
                </Campo>

                {moldeBaseTipo === 'redondo' ? (
                  <Campo label="Diámetro (cm)">
                    <Input
                      type="number"
                      step="any"
                      value={moldeBaseDiametro}
                      onChange={(e) => setMoldeBaseDiametro(e.target.value)}
                    />
                  </Campo>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Ancho (cm)">
                      <Input
                        type="number"
                        step="any"
                        value={moldeBaseW}
                        onChange={(e) => setMoldeBaseW(e.target.value)}
                      />
                    </Campo>
                    <Campo label="Largo (cm)">
                      <Input
                        type="number"
                        step="any"
                        value={moldeBaseL}
                        onChange={(e) => setMoldeBaseL(e.target.value)}
                      />
                    </Campo>
                  </div>
                )}
              </div>

              {/* Molde Nuevo */}
              <div className="p-4 bg-[var(--superficie-2)] rounded-xl border border-[var(--linea-suave)] space-y-3">
                <span className="text-xs uppercase font-bold text-[var(--vino)] block">
                  2. Molde Nuevo (donde vas a hornear)
                </span>
                <Campo label="Forma">
                  <Select
                    value={moldeNuevoTipo}
                    onChange={(e) => setMoldeNuevoTipo(e.target.value)}
                  >
                    <option value="redondo">Redondo</option>
                    <option value="rectangular">Rectangular / Cuadrado</option>
                  </Select>
                </Campo>

                {moldeNuevoTipo === 'redondo' ? (
                  <Campo label="Diámetro (cm)">
                    <Input
                      type="number"
                      step="any"
                      value={moldeNuevoDiametro}
                      onChange={(e) => setMoldeNuevoDiametro(e.target.value)}
                    />
                  </Campo>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Ancho (cm)">
                      <Input
                        type="number"
                        step="any"
                        value={moldeNuevoW}
                        onChange={(e) => setMoldeNuevoW(e.target.value)}
                      />
                    </Campo>
                    <Campo label="Largo (cm)">
                      <Input
                        type="number"
                        step="any"
                        value={moldeNuevoL}
                        onChange={(e) => setMoldeNuevoL(e.target.value)}
                      />
                    </Campo>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[var(--vino)] block">
                  Multiplica cada ingrediente de tu receta por:
                </span>
                <span className="text-3xl font-mono font-bold text-[var(--vino)]">
                  {factorMolde.toLocaleString('es-CL')}x
                </span>
              </div>
              <span className="text-xs font-semibold text-[var(--tinta-suave)] max-w-xs leading-tight">
                Ejemplo: Si tu receta llevaba 500g de harina, para el nuevo molde necesitas <b>{(500 * factorMolde).toLocaleString('es-CL')}g</b>.
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================= */}
      {/* B4. Huevos & Medidas */}
      {/* ========================================================= */}
      {activeSubtab === 'huevos' && (
        <Panel titulo="🥚 Calculadora de Peso de Huevos (Sin cáscara)">
          <p className="text-xs text-[var(--tinta-suave)] mb-4">
            Calcula el peso neto aproximado de claras y yemas (se descuenta el 12% correspondiente a la cáscara).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Campo label="Tamaño / Calibre del Huevo">
              <Select
                value={huevoTamano}
                onChange={(e) => setHuevoTamano(e.target.value)}
              >
                <option value="50">Chico / S (~50g con cáscara)</option>
                <option value="57">Mediano / M (~57g con cáscara)</option>
                <option value="63">Grande / L (~63g con cáscara - estándar)</option>
                <option value="70">Extra Grande / XL (~70g con cáscara)</option>
                <option value="78">Jumbo / XXL (~78g con cáscara)</option>
              </Select>
            </Campo>

            <Campo label="Cantidad de Huevos">
              <Input
                type="number"
                step="any"
                value={huevoCant}
                onChange={(e) => setHuevoCant(e.target.value)}
              />
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--superficie-2)] rounded-xl border border-[var(--linea-suave)]">
              <span className="text-xs uppercase font-bold text-[var(--tinta-suave)] block">
                Peso Neto Total (Sin cáscara)
              </span>
              <span className="text-2xl font-mono font-bold text-[var(--tinta)]">
                {pesoHuevoTotalNeto} g
              </span>
            </div>

            <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)]">
              <span className="text-xs uppercase font-bold text-[var(--vino)] block">
                Claras (~64% del neto)
              </span>
              <span className="text-2xl font-mono font-bold text-[var(--vino)]">
                {clarasGramos} g
              </span>
            </div>

            <div className="p-4 bg-[var(--oro-fondo)] rounded-xl border border-[var(--oro)]/30">
              <span className="text-xs uppercase font-bold text-[var(--oro)] block">
                Yemas (~36% del neto)
              </span>
              <span className="text-2xl font-mono font-bold text-[var(--oro)]">
                {yemasGramos} g
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* ========================================================= */}
      {/* B5. Sustitutos Express */}
      {/* ========================================================= */}
      {activeSubtab === 'sustitutos' && (
        <Panel titulo="🩹 Guía de Sustitutos Reposteros Express">
          <div className="mb-4">
            <Campo label="¿Qué ingrediente te falta hoy?">
              <Select
                value={sustitutoSel}
                onChange={(e) => setSustitutoSel(e.target.value)}
              >
                <option value="buttermilk">Leche cortada / Buttermilk</option>
                <option value="polvos">Polvos de hornear</option>
                <option value="azucarflor">Azúcar flor / impalpable</option>
                <option value="harinaleudante">Harina con polvos (leudante)</option>
                <option value="huevo">1 Huevo (reemplazos veganos / humedad)</option>
                <option value="chocolate">Chocolate cobertura amargo</option>
                <option value="miel">Miel de abejas / Miel de palma</option>
                <option value="crema">Crema ácida / Sour cream</option>
                <option value="manjar">Manjar / Dulce de leche fluido</option>
                <option value="vanilla">Esencia de vainilla</option>
              </Select>
            </Campo>
          </div>

          {recetasSustitutos[sustitutoSel] && (
            <div
              className="p-4 bg-[var(--oro-fondo)] rounded-xl border border-[var(--oro)]/30 text-sm text-[var(--tinta)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: recetasSustitutos[sustitutoSel] }}
            />
          )}
        </Panel>
      )}

      {/* ========================================================= */}
      {/* B6. Horno °C / °F */}
      {/* ========================================================= */}
      {activeSubtab === 'temperatura' && (
        <Panel titulo="🌡️ Temperatura del Horno (°C ↔ °F)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Campo label="Grados Celsius (°C)">
              <Input
                type="number"
                step="any"
                value={tempC}
                onChange={(e) => handleTempCChange(e.target.value)}
              />
            </Campo>

            <Campo label="Grados Fahrenheit (°F)">
              <Input
                type="number"
                step="any"
                value={tempF}
                onChange={(e) => handleTempFChange(e.target.value)}
              />
            </Campo>
          </div>

          <div className="p-4 bg-[var(--rosa-suave)] rounded-xl border border-[var(--rosa-claro)]">
            <span className="text-xs uppercase tracking-wider font-bold text-[var(--vino)] block">
              Nivel de fuego equivalente:
            </span>
            <span className="text-lg font-bold text-[var(--vino)]">
              {tempGuiaStr}
            </span>
          </div>
        </Panel>
      )}

      {/* ========================================================= */}
      {/* B7. Tablas Maestras */}
      {/* ========================================================= */}
      {activeSubtab === 'tablas' && (
        <Panel titulo="📋 Tabla Maestra de Pesos por Taza (1 taza = 240 ml)">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="🔎 Buscar ingrediente en la tabla..."
              value={filtroTablaTazas}
              onChange={(e) => setFiltroTablaTazas(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto max-h-96 border border-[var(--linea)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--superficie-2)] border-b border-[var(--linea)] font-bold text-[var(--tinta-suave)] sticky top-0">
                <tr>
                  <th className="p-3">Ingrediente</th>
                  <th className="p-3">1 Taza (240 ml)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--linea-suave)]">
                {tablaTazasFiltrada.map((k) => (
                  <tr key={k} className="hover:bg-[var(--superficie-2)]">
                    <td className="p-3 font-semibold text-[var(--tinta)]">{k}</td>
                    <td className="p-3 font-mono font-bold text-[var(--vino)]">
                      {densidadTazas[k]} g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Tip de Eli */}
      <TipDeEli>
        Utiliza siempre tazas y cucharas medidoras niveladas con la parte posterior de un cuchillo para evitar variaciones en tus recetas.
      </TipDeEli>
    </div>
  )
}
