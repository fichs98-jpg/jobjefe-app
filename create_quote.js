import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://ktpoekyelqnryuaiuwfd.supabase.co',
  'sb_publishable_EGHCZDknB7tleXT1btAmZQ_VC4MGSXe'
)

// Login como Fabio (el técnico)
const { data: { session }, error: authErr } = await sb.auth.signInWithPassword({
  email: 'fichs98@gmail.com',
  password: 'jobjefe2024'
})

if (authErr) {
  console.log('Auth error:', authErr.message)
  process.exit(1)
}

console.log('Logged in as:', session.user.email, '| user_id:', session.user.id)

// Crear la cotización — HVAC, AC not cooling
const { data: job, error: jobErr } = await sb.from('jobs').insert({
  service_description: 'AC not cooling — diagnostic + repair',
  client_name: 'Robert Davis',
  client_phone: '+17135550192',
  client_address: '2847 Westheimer Rd, Houston TX 77098',
  scheduled_date: '2026-06-19',
  scheduled_time: '10:00',
  status: 'sent',
  user_id: session.user.id,
}).select().single()

if (jobErr) { console.log('Job error:', jobErr.message); process.exit(1) }
console.log('Job created:', job.id, '| token:', job.public_token)

// Insertar 3 opciones
const { error: optsErr } = await sb.from('job_options').insert([
  { job_id: job.id, sort_order: 1, label: 'Basic', description: 'Full diagnostic + refrigerant top-off. Best if unit is < 8 years old.', amount: 280, is_selected: false },
  { job_id: job.id, sort_order: 2, label: 'Recommended', description: 'Diagnostic + replace capacitor + refrigerant charge + coil clean. Covers 95% of AC failures.', amount: 520, is_selected: true },
  { job_id: job.id, sort_order: 3, label: 'Premium', description: 'Full tune-up + capacitor + refrigerant + coil clean + 1-year parts warranty.', amount: 850, is_selected: false },
])

if (optsErr) { console.log('Options error:', optsErr.message); process.exit(1) }

console.log('\n✅ Quote created successfully!')
console.log('Client link: https://jobjefe.com/q/' + job.public_token)
