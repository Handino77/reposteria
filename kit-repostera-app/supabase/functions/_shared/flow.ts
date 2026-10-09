// Flow.cl Helper for Supabase Edge Functions (Deno)

const FLOW_BASE_URL = 'https://sandbox.flow.cl/api'

export async function signFlow(
  params: Record<string, string | number>,
  secretKey: string
): Promise<string> {
  const keys = Object.keys(params).sort()
  let toSign = ''
  for (const k of keys) {
    toSign += k + params[k]
  }
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secretKey)
  const messageData = encoder.encode(toSign)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function callFlowApi(
  endpoint: string,
  params: Record<string, string | number>,
  apiKey: string,
  secretKey: string,
  method = 'POST'
) {
  const fullParams = { apiKey, ...params }
  const s = await signFlow(fullParams, secretKey)
  const bodyParams = new URLSearchParams()

  for (const [k, v] of Object.entries(fullParams)) {
    bodyParams.append(k, String(v))
  }
  bodyParams.append('s', s)

  let url = `${FLOW_BASE_URL}/${endpoint}`
  let init: RequestInit = {}

  if (method === 'GET') {
    url += `?${bodyParams.toString()}`
    init = { method: 'GET' }
  } else {
    init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    }
  }

  const res = await fetch(url, init)
  const json = await res.json()
  return json
}
