import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://jhkezswzxhfxwjxmgrta.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoa2V6c3d6eGhmeHdqeG1ncnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjAxMzAsImV4cCI6MjEwNTY5NjEzMH0.inyv3sh3Jocja3b9yyg_C6TaOt-c9Wqbse8sOmRnlaI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
