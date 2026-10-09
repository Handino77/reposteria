import React from 'react'

export function Panel({ titulo, subtitulo, acciones, children, className = '' }) {
  return (
    <div className={`bg-[var(--superficie)] border border-[var(--linea)] rounded-[20px] shadow-[var(--sombra-panel)] overflow-hidden ${className}`}>
      {(titulo || subtitulo || acciones) && (
        <div className="p-5 md:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--linea-suave)]">
          <div>
            {titulo && (
              <h2 className="text-base md:text-[17px] font-bold text-[var(--tinta)]">
                {titulo}
              </h2>
            )}
            {subtitulo && (
              <p className="text-xs text-[var(--tinta-suave)] mt-1">
                {subtitulo}
              </p>
            )}
          </div>
          {acciones && <div className="flex items-center gap-2 shrink-0">{acciones}</div>}
        </div>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </div>
  )
}
