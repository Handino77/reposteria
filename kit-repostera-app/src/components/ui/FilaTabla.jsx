import React from 'react'

export function FilaTabla({ children, className = '' }) {
  return (
    <div
      className={`bg-[var(--superficie)] border border-[var(--linea)] md:border-0 md:border-b md:border-[var(--linea-suave)] rounded-[14px] md:rounded-none p-3.5 md:p-4 shadow-[var(--sombra-tarjeta-mobile)] md:shadow-none ${className}`}
    >
      {children}
    </div>
  )
}
