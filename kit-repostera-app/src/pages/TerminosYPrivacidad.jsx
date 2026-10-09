import React from 'react'
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina'
import { Panel } from '../components/ui/Panel'
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react'
import { Boton } from '../components/ui/Boton'

export default function TerminosYPrivacidad({ volver }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {volver && (
        <Boton variante="secundario" tamano="sm" onClick={volver} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Boton>
      )}

      <EncabezadoPagina
        antetitulo="Información Legal y Cumplimiento"
        titulo="Política de Privacidad y Términos de Servicio"
        introduccion="Conoce cómo protegemos tus datos personales conforme a la Ley de Protección de Datos Personales en Chile (Ley N° 19.628 y Ley N° 21.719)."
      />

      <Panel titulo="1. Tratamiento y Protección de Datos Personales">
        <div className="text-sm text-[var(--tinta-media)] space-y-3">
          <p>
            En <strong>Kit de la Repostera</strong> (operado en Chile por Realtech SpA), valoramos y protegemos la privacidad de tu emprendimiento dulce.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>Datos recolectados:</strong> Tu nombre de contacto, correo electrónico, nombre de negocio, registro de ingredientes, recetas y pedidos.</li>
            <li><strong>Finalidad:</strong> Los datos son utilizados exclusivamente para prestarte el servicio de cálculo de costos, agenda de pedidos, conversor y cobro de suscripción.</li>
            <li><strong>No venta de datos:</strong> Jamás venderemos ni cederemos tus datos comerciales o personales a terceros con fines publicitarios.</li>
          </ul>
        </div>
      </Panel>

      <Panel titulo="2. Pagos y Datos Financieros">
        <div className="text-sm text-[var(--tinta-media)] space-y-3">
          <p>
            Los cobros recurrentes son procesados directamente por la pasarela de pagos segura <strong>Flow.cl</strong> (autorizada en Chile). <strong>Kit de la Repostera NO almacena</strong> números de tarjetas de crédito o débito en sus servidores.
          </p>
        </div>
      </Panel>

      <Panel titulo="3. Tus Derechos (Acceso, Rectificación y Supresión)">
        <div className="text-sm text-[var(--tinta-media)] space-y-3">
          <p>
            Conforme a la legislación chilena, tienes pleno derecho a:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Acceder a todos tus datos guardados en la plataforma.</li>
            <li>Solicitar la corrección o actualización de tu información.</li>
            <li><strong>Eliminar tu cuenta y purgar permanentemente todos tus datos</strong> de nuestros servidores en cualquier momento desde la sección de tu perfil/suscripción o solicitándolo a nuestro correo de soporte.</li>
          </ul>
        </div>
      </Panel>

      <Panel titulo="4. Contacto de Soporte y Privacidad">
        <div className="flex items-center gap-3 text-sm text-[var(--tinta)] p-3 bg-[var(--superficie-2)] rounded-xl border border-[var(--linea-suave)]">
          <Mail className="w-5 h-5 text-[var(--vino)] shrink-0" />
          <span>Para cualquier duda sobre tus datos o la plataforma, escríbenos a: <strong>contacto@kitrepostera.cl</strong></span>
        </div>
      </Panel>
    </div>
  )
}
