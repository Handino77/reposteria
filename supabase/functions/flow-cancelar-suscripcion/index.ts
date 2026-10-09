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
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtener datos de repostera
    const { data: repostera, error: repError } = await supabase
      .from('reposteras')
      .select('*')
      .eq('id', user.id)
      .single()

    if (repError || !repostera) {
      return new Response(JSON.stringify({ error: 'No se encontró la repostera' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (repostera.flow_subscription_id) {
      // Cancelar suscripción en Flow
      await callFlowApi(
        'subscription/cancel',
        {
          subscriptionId: repostera.flow_subscription_id,
          at_period_end: 0 // Inmediata
        },
        flowApiKey,
        flowSecretKey,
        'POST'
      ).catch((err) => console.log('Aviso al cancelar en Flow:', err))
    }

    // Actualizar estado en Supabase
    await supabase
      .from('reposteras')
      .update({ estado_suscripcion: 'cancelada' })
      .eq('id', user.id)

    return new Response(JSON.stringify({ success: true, estado: 'cancelada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error en flow-cancelar-suscripcion:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
