import React from 'react'

export function TarjetaIndicador({ etiqueta, valor, nota, insignia, variante = 'normal' }) {
  const esDestacada = variante === 'destacada'
  return (
    <div
      className={`bg-[var(--superficie)] border rounded-[18px] p-4 md:p-[18px] shadow-[var(--sombra-indicador)] transition-all ${
        esDestacada
          ? 'border-[var(--vino-borde)] bg-[var(--vino-suave)]/30'
          : 'border-[var(--linea)]'
      }`}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--tinta-suave)]">
        {etiqueta}
      </div>
      <div className="flex items-baseline justify-between gap-3 mt-2">
        <span className="num font-sans text-2xl md:text-[31px] font-semibold text-[var(--tinta)] leading-none truncate">
          {valor}
        </span>
        {insignia && (
          <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-[var(--verde-fondo)] text-[var(--verde)] shrink-0">
            {insignia}
          </span>
        )}
        {nota && !insignia && (
          <span className="num text-xs text-[var(--tinta-suave)] truncate shrink-0">
            {nota}
          </span>
        )}
      </div>
    </div>
  )
}
