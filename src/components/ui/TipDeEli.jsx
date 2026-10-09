import React from 'react'

export function TipDeEli({ children, className = '' }) {
  return (
    <div
      className={`p-3.5 md:p-4 rounded-[12px] bg-[var(--rosa-aviso)] border border-[var(--rosa-aviso-borde)] text-xs md:text-[12.5px] leading-relaxed text-[var(--tinta-media)] ${className}`}
    >
      <span className="font-serif-title italic font-semibold text-[var(--vino)] text-sm mr-1.5">
        Tip de Eli:
      </span>
      {children}
    </div>
  )
}
