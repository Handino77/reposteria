import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callFlowApi } from '../_shared/flow.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const flowApiKey = Deno.env.get('FLOW_API_KEY') || ''
    const flowSecretKey = Deno.env.get('FLOW_SECRET_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let token = ''
    let subscriptionId = ''
    let customerIdParam = ''
    let userIdParam = ''

    const contentType = req.headers.get('content-type') || ''

    if (req.method === 'POST') {
      if (contentType.includes('application/json')) {
        const body = await req.json().catch(() => ({}))
        token = body.token || ''
        subscriptionId = body.subscriptionId || ''
        customerIdParam = body.customerId || ''
        userIdParam = body.userId || ''
      } else {
        const formData = await req.formData().catch(() => null)
        if (formData) {
          token = formData.get('token')?.toString() || ''
          subscriptionId = formData.get('subscriptionId')?.toString() || ''
          customerIdParam = formData.get('customerId')?.toString() || ''
          userIdParam = formData.get('userId')?.toString() || ''
        }
      }
    }

    if (!token && !subscriptionId && !customerIdParam && !userIdParam) {
      const url = new URL(req.url)
      token = url.searchParams.get('token') || ''
      subscriptionId = url.searchParams.get('subscriptionId') || ''
      customerIdParam = url.searchParams.get('customerId') || ''
      userIdParam = url.searchParams.get('userId') || ''
    }

    // Si no hay token pero sí userId, buscar el token guardado en la DB
    if (!token && userIdParam) {
      console.log('No hay token en body, buscando flow_register_token en DB para userId:', userIdParam)
      const { data: repData } = await supabase
        .from('reposteras')
        .select('flow_register_token')
        .eq('id', userIdParam)
        .maybeSingle()

      if (repData?.flow_register_token) {
        token = repData.flow_register_token
        console.log('✅ Token recuperado de DB:', token.substring(0, 8) + '...')
      } else {
        return new Response(JSON.stringify({ error: 'No hay registro de tarjeta pendiente para este usuario' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (!token && !subscriptionId && !customerIdParam) {
      return new Response(JSON.stringify({ error: 'Token, SubscriptionId, CustomerId o UserId no provisto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Webhook recibido -> token:', token ? token.substring(0, 8) + '...' : '(vacío)', 'subscriptionId:', subscriptionId, 'customerId:', customerIdParam, 'userId:', userIdParam)


    // CASO 1: Verificación de Registro de Tarjeta (customer/getRegisterStatus)
    let registerStatus: any = null
    if (token) {
      try {
        registerStatus = await callFlowApi(
          'customer/getRegisterStatus',
          { token },
          flowApiKey,
          flowSecretKey,
          'GET'
        )
        console.log('[DIAG] getRegisterStatus crudo:', JSON.stringify(registerStatus))
      } catch (e) {
        console.error('[DIAG] Error llamando a customer/getRegisterStatus:', e)
      }
    }

    // Flow devuelve status como STRING ("1"), no number — usar Number() para no fallar con ===
    const regStatusNum = Number(registerStatus?.status)
    if (registerStatus && regStatusNum === 1 && registerStatus.customerId) {
      console.log('✅ Verificado registro de tarjeta exitoso para customerId:', registerStatus.customerId)
      const customerId = registerStatus.customerId

      const { data: repostera } = await supabase
        .from('reposteras')
        .select('*')
        .eq('flow_customer_id', customerId)
        .maybeSingle()

      if (repostera) {
        // ARREGLO 2: Verificar si la repostera ya tiene una suscripción activa antes de crear otra
        if (repostera.flow_subscription_id && repostera.estado_suscripcion === 'activa') {
          const existente = await callFlowApi(
            'subscription/get',
            { subscriptionId: repostera.flow_subscription_id },
            flowApiKey,
            flowSecretKey,
            'GET'
          ).catch(() => null)

          if (existente && Number(existente.status) === 1) {
            console.log('La repostera ya tiene una suscripción activa, no se crea otra:', repostera.flow_subscription_id)
            return new Response(JSON.stringify({
              status: 'sin_cambios',
              message: 'Ya existe una suscripción activa'
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
        }

        // ARREGLO 1: Consumir el token de forma atómica (Ticket de un solo uso)
        const { data: claimed, error: claimErr } = await supabase
          .from('reposteras')
          .update({ flow_register_token: null })
          .eq('id', repostera.id)
          .eq('flow_register_token', token)
          .select('id')

        if (claimErr || !claimed || claimed.length === 0) {
          console.log('Token ya consumido por otra invocación concurrente, no se crea suscripción')
          return new Response(JSON.stringify({
            status: 'sin_cambios',
            message: 'Este registro ya fue procesado'
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const planId = 'plan_kit_repostera_3000'

        // Crear suscripción activa en Flow
        const subRes = await callFlowApi(
          'subscription/create',
          { planId, customerId },
          flowApiKey,
          flowSecretKey,
          'POST'
        ).catch((err) => {
          console.error('Error al crear suscripción en Flow:', err)
          return null
        })

        if (!subRes || !subRes.subscriptionId) {
          throw new Error('No se pudo crear la suscripción en Flow: ' + JSON.stringify(subRes))
        }

        const subId = subRes.subscriptionId
        let nextInvoiceDate = subRes?.next_invoice_date ? subRes.next_invoice_date.split(' ')[0] : null

        if (!nextInvoiceDate) {
          const subInfo = await callFlowApi(
            'subscription/get',
            { subscriptionId: subId },
            flowApiKey,
            flowSecretKey,
            'GET'
          ).catch((e) => {
            console.error('[DIAG] No se pudo obtener next_invoice_date desde subscription/get:', e)
            return null
          })
          console.log('[DIAG] subscription/get para fecha de cobro:', JSON.stringify(subInfo))
          if (subInfo?.next_invoice_date) {
            nextInvoiceDate = subInfo.next_invoice_date.split(' ')[0]
          }
        }

        const proximoCobro = nextInvoiceDate || (() => {
          const d = new Date()
          d.setDate(d.getDate() + 30)
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
          }).format(d)
        })()

        // REEMPLAZAR SIEMPRE con el nuevo subscriptionId y estado 'activa'
        await supabase
          .from('reposteras')
          .update({
            estado_suscripcion: 'activa',
            flow_subscription_id: subId,
            fecha_proximo_cobro: proximoCobro
          })
          .eq('id', repostera.id)

        // Registrar pago inicial en pagos_suscripcion (protegido por índice único)
        try {
          await supabase.from('pagos_suscripcion').insert([
            {
              repostera_id: repostera.id,
              flow_token: token,
              flow_charge_id: subRes?.invoices?.[0]?.id ? String(subRes.invoices[0].id) : subId,
              monto: 3000,
              estado: 'pagado'
            }
          ])
        } catch (insertErr) {
          console.warn('Advertencia/duplicado al insertar en pagos_suscripcion:', insertErr)
        }

        return new Response(JSON.stringify({ status: 'ok', type: 'card_registered_and_subscribed', customerId, subscriptionId: subId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // CASO 2: Notificación de Pago / Cobro Recurrente (payment/getStatus)
    let paymentStatus: any = null
    if (token) {
      try {
        paymentStatus = await callFlowApi(
          'payment/getStatus',
          { token },
          flowApiKey,
          flowSecretKey,
          'GET'
        )
      } catch (_e) {
        // Ignorar si el token no corresponde a un pago
      }
    }

    if (paymentStatus && paymentStatus.status) {
      console.log('✅ Verificado estado de pago recurrente (payment/getStatus):', paymentStatus)

      const customerId = paymentStatus.payer || paymentStatus.customerId
      const monto = paymentStatus.amount || 3000

      let { data: repostera } = await supabase
        .from('reposteras')
        .select('*')
        .eq('flow_customer_id', customerId)
        .maybeSingle()

      if (!repostera && paymentStatus.payer) {
        const { data: repEmail } = await supabase
          .from('reposteras')
          .select('*')
          .eq('email', paymentStatus.payer)
          .maybeSingle()
        repostera = repEmail
      }

      if (repostera) {
        const payStatusNum = Number(paymentStatus.status)
        if (payStatusNum === 2) {
          // Status 2 = Pago exitoso (Cobro recurrente al día)
          // Si tenemos subscriptionId, intentar obtener next_invoice_date desde Flow
          let nextInvoiceDate: string | null = null
          if (repostera.flow_subscription_id) {
            const subInfo = await callFlowApi(
              'subscription/get',
              { subscriptionId: repostera.flow_subscription_id },
              flowApiKey,
              flowSecretKey,
              'GET'
            ).catch(() => null)
            if (subInfo?.next_invoice_date) {
              nextInvoiceDate = subInfo.next_invoice_date.split(' ')[0]
            }
          }

          const proximoCobro = nextInvoiceDate || (() => {
            const d = new Date()
            d.setDate(d.getDate() + 30)
            return new Intl.DateTimeFormat('en-CA', {
              timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(d)
          })()

          await supabase
            .from('reposteras')
            .update({
              estado_suscripcion: 'activa',
              fecha_proximo_cobro: proximoCobro
            })
            .eq('id', repostera.id)

          await supabase.from('pagos_suscripcion').insert([
            {
              repostera_id: repostera.id,
              flow_token: token,
              flow_charge_id: String(paymentStatus.flowOrder || ''),
              monto: monto,
              estado: 'pagado'
            }
          ])
        } else if (payStatusNum === 3 || payStatusNum === 4) {
          // Status 3 o 4 = Rechazado / Fallido
          await supabase
            .from('reposteras')
            .update({ estado_suscripcion: 'vencida' })
            .eq('id', repostera.id)

          await supabase.from('pagos_suscripcion').insert([
            {
              repostera_id: repostera.id,
              flow_token: token,
              flow_charge_id: String(paymentStatus.flowOrder || ''),
              monto: monto,
              estado: 'fallido'
            }
          ])
        }
      }

      return new Response(JSON.stringify({ status: 'ok', type: 'payment_status_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // CASO 3: Estado de Suscripción (subscription/get) - Permite búsqueda por subscriptionId O customerId
    if (subscriptionId || customerIdParam) {
      const subToFetch = subscriptionId || ''
      let subStatus: any = null

      if (subToFetch) {
        subStatus = await callFlowApi(
          'subscription/get',
          { subscriptionId: subToFetch },
          flowApiKey,
          flowSecretKey,
          'GET'
        ).catch(() => null)
      }

      if (subStatus && subStatus.status !== undefined && subStatus.status !== null) {
        const subStatusNum = Number(subStatus.status)
        const estadoStr =
          subStatusNum === 1 ? 'activa' :
          subStatusNum === 0 ? 'pendiente' :
          subStatusNum === 4 ? 'cancelada' :
          'pendiente'
        const customerId = subStatus.customerId
        const nextInvoiceDate = subStatus.next_invoice_date ? subStatus.next_invoice_date.split(' ')[0] : null

        let { data: repostera } = await supabase
          .from('reposteras')
          .select('*')
          .or(`flow_subscription_id.eq.${subscriptionId},flow_customer_id.eq.${customerId}`)
          .maybeSingle()

        if (repostera) {
          await supabase
            .from('reposteras')
            .update({
              estado_suscripcion: estadoStr,
              flow_subscription_id: subStatus.subscriptionId || subscriptionId,
              ...(nextInvoiceDate ? { fecha_proximo_cobro: nextInvoiceDate } : {})
            })
            .eq('id', repostera.id)

          return new Response(JSON.stringify({ status: 'ok', type: 'subscription_updated', estado: estadoStr, customerId, subscriptionId: subStatus.subscriptionId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    }

    return new Response(JSON.stringify({
      status: 'sin_cambios',
      message: 'La notificación se procesó pero no correspondía a ninguna acción'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error en flow-webhook-suscripcion:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
