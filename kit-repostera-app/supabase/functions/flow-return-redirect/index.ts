import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  let token = ''

  // Manejar POST (form-data o json) o GET query string
  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      token = body.token || ''
    } else {
      const formData = await req.formData().catch(() => null)
      if (formData) {
        token = formData.get('token')?.toString() || ''
      }
    }
  }

  if (!token) {
    const url = new URL(req.url)
    token = url.searchParams.get('token') || ''
  }

  // Obtener URL de retorno base desde el query param 'returnTo' o default a localhost:5174
  const urlObj = new URL(req.url)
  const returnTo = urlObj.searchParams.get('returnTo') || 'http://localhost:5174'
  
  // Construir la URL final hacia la SPA React con los parámetros de la pestaña y token
  const redirectTarget = new URL(returnTo)
  redirectTarget.searchParams.set('tab', 'suscripcion')
  if (token) {
    redirectTarget.searchParams.set('token', token)
  }

  console.log(`flow-return-redirect -> Redirigiendo (${req.method}) hacia: ${redirectTarget.toString()}`)

  // Responder con un Redirect HTTP 302 hacia la app frontend en el navegador
  return Response.redirect(redirectTarget.toString(), 302)
})
