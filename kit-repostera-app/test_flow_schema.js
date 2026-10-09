import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhkezswzxhfxwjxmgrta.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoa2V6c3d6eGhmeHdqeG1ncnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjAxMzAsImV4cCI6MjEwNTY5NjEzMH0.inyv3sh3Jocja3b9yyg_C6TaOt-c9Wqbse8sOmRnlaI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectSchema() {
  console.log('--- Insponando reposteras ---')
  const { data: rData, error: rError } = await supabase
    .from('reposteras')
    .select('id, flow_customer_id, flow_subscription_id, fecha_proximo_cobro, estado_suscripcion')
    .limit(1)

  console.log('reposteras select:', { rData, rError })

  console.log('--- Inspeccionando pagos_suscripcion ---')
  const { data: pData, error: pError } = await supabase
    .from('pagos_suscripcion')
    .select('id, repostera_id, flow_order_id, flow_token, flow_charge_id, monto, estado, fecha, creado_en')
    .limit(1)

  console.log('pagos_suscripcion select:', { pData, pError })
}

inspectSchema()
