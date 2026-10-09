import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { callFlowApi } from '../_shared/flow.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

// Edge Function temporal para cancelar suscripciones de Flow desde el servidor
// (tiene acceso a las API keys reales de Flow desde Deno.env)
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const flowApiKey = Deno.env.get('FLOW_API_KEY') || ''
  const flowSecretKey = Deno.env.get('FLOW_SECRET_KEY') || ''

  const body = await req.json().catch(() => ({}))
  const { subscriptionId, action } = body

  if (!subscriptionId) {
    return new Response(JSON.stringify({ error: 'Falta subscriptionId' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (action === 'cancel') {
    const res = await callFlowApi('subscription/cancel', { subscriptionId }, flowApiKey, flowSecretKey, 'POST')
    return new Response(JSON.stringify({ action: 'cancel', subscriptionId, result: res }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Default: get status
  const res = await callFlowApi('subscription/get', { subscriptionId }, flowApiKey, flowSecretKey, 'GET')
  return new Response(JSON.stringify({ action: 'get', subscriptionId, result: res }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
