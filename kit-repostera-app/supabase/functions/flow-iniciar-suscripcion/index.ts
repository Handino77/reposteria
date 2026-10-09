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

    // Leer el body PRIMERO (el stream solo puede leerse una vez)
    const body = await req.json().catch(() => ({}))
    console.log('[DIAG] body recibido:', JSON.stringify(body))
    console.log('[DIAG] Content-Type:', req.headers.get('content-type'))

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta encabezado de autorización' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validar JWT de usuario
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado en Supabase: ' + (userError?.message || '') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtener fila en reposteras o crearla si aún no existe
    let { data: repostera } = await supabase
      .from('reposteras')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!repostera) {
      console.log('Fila en reposteras no encontrada, creando registro automático para user:', user.id)
      const nombreContacto = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Repostera'
      const nombreNegocio = user.user_metadata?.nombre_negocio || 'Mi Repostería'

      const { data: newRep, error: createError } = await supabase
        .from('reposteras')
        .insert([
          {
            id: user.id,
            nombre_contacto: nombreContacto,
            nombre_negocio: nombreNegocio,
            estado_suscripcion: 'pendiente'
          }
        ])
        .select('*')
        .single()

      if (createError) {
        throw new Error('Error al crear fila de repostera: ' + createError.message)
      }
      repostera = newRep
    }

    // Función auxiliar para crear cliente en Flow manejando externalId duplicado
    async function createCustomerInFlow(name: string, email: string, userId: string) {
      let res = await callFlowApi(
        'customer/create',
        { name, email, externalId: userId },
        flowApiKey,
        flowSecretKey,
        'POST'
      )

      if (!res.customerId && (res.code === 501 || String(res.message).includes('externalId'))) {
        console.warn('externalId ya existe en Flow, creando cliente con externalId con marca de tiempo...')
        res = await callFlowApi(
          'customer/create',
          { name, email, externalId: `${userId}_${Date.now()}` },
          flowApiKey,
          flowSecretKey,
          'POST'
        )
      }

      return res
    }

    let customerId = repostera.flow_customer_id

    // 1. Crear cliente en Flow si aún no existe en reposteras
    if (!customerId) {
      const customerName = repostera.nombre_contacto || repostera.nombre_negocio || 'Repostera'
      const customerEmail = user.email || `${user.id}@repostera.app`

      const createCustomerRes = await createCustomerInFlow(customerName, customerEmail, user.id)

      if (!createCustomerRes.customerId) {
        throw new Error('Error al crear cliente en Flow: ' + JSON.stringify(createCustomerRes))
      }

      customerId = createCustomerRes.customerId

      // Guardar flow_customer_id en la base de datos
      await supabase
        .from('reposteras')
        .update({ flow_customer_id: customerId })
        .eq('id', user.id)
    }

    const returnUrl = body.urlReturn || 'http://localhost:5173/'
    console.log('[DIAG] returnUrl que se enviará a Flow:', returnUrl)

    // 2. Registrar tarjeta en Flow (usa url_return)
    let registerRes = await callFlowApi(
      'customer/register',
      {
        customerId: customerId,
        url_return: returnUrl
      },
      flowApiKey,
      flowSecretKey,
      'POST'
    )

    // Si la llamada falló porque el customerId era inválido/obsoleto, reintentar generando un nuevo cliente en Flow
    if (!registerRes.url || !registerRes.token) {
      console.warn('El customerId existente falló en customer/register, generando nuevo cliente en Flow...')
      const customerName = repostera.nombre_contacto || repostera.nombre_negocio || 'Repostera'
      const customerEmail = user.email || `${user.id}@repostera.app`

      const freshCustomer = await createCustomerInFlow(customerName, customerEmail, user.id)

      if (freshCustomer.customerId) {
        customerId = freshCustomer.customerId
        await supabase
          .from('reposteras')
          .update({ flow_customer_id: customerId })
          .eq('id', user.id)

        registerRes = await callFlowApi(
          'customer/register',
          {
            customerId: customerId,
            url_return: returnUrl
          },
          flowApiKey,
          flowSecretKey,
          'POST'
        )
      }
    }

    if (!registerRes.url || !registerRes.token) {
      throw new Error('Error al iniciar registro de tarjeta en Flow: ' + JSON.stringify(registerRes))
    }

    // Guardar el token de registro en la DB — así sobrevive recargas y no dependemos del navegador
    await supabase
      .from('reposteras')
      .update({ flow_register_token: registerRes.token })
      .eq('id', user.id)
    console.log('[DIAG] flow_register_token guardado en DB para user:', user.id)

    const redirectUrl = `${registerRes.url}?token=${registerRes.token}`

    return new Response(JSON.stringify({ redirectUrl, token: registerRes.token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error en flow-iniciar-suscripcion:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
