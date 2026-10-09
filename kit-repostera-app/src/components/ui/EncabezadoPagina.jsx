import React from 'react'

export function EncabezadoPagina({ antetitulo, titulo, introduccion, acciones }) {
  return (
    <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {antetitulo && (
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--vino)] mb-2">
            {antetitulo}
          </div>
        )}
        <h1 className="font-serif-title text-3xl md:text-[42px] leading-tight md:leading-[1.08] tracking-[-0.025em] font-semibold text-[var(--tinta)]">
          {titulo}
        </h1>
        {introduccion && (
          <p className="mt-2 text-xs md:text-sm text-[var(--tinta-suave)] max-w-2xl leading-relaxed">
            {introduccion}
          </p>
        )}
      </div>
      {acciones && (
        <div className="flex items-center gap-2.5 shrink-0">
          {acciones}
        </div>
      )}
    </header>
  )
}
