// Supabase Edge Function — se dispara cuando un job cambia a 'approved'
// Envía WhatsApp automático al técnico via Twilio

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_SID    = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM   = Deno.env.get('TWILIO_WHATSAPP_FROM')! // whatsapp:+14155238886

serve(async (req) => {
  try {
    const payload = await req.json()
    const job = payload.record  // job recién actualizado

    // Solo procesar si cambió a 'approved'
    if (job.status !== 'approved') {
      return new Response('Not approved', { status: 200 })
    }

    // Obtener el número de WhatsApp del técnico desde la tabla users
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: user } = await sb
      .from('users')
      .select('whatsapp_phone, name')
      .eq('id', job.user_id)
      .single()

    if (!user?.whatsapp_phone) {
      console.log('No WhatsApp phone for user:', job.user_id)
      return new Response('No phone', { status: 200 })
    }

    // Formatear el mensaje
    const clientName  = job.approved_by_name || job.client_name || 'Your client'
    const jobDesc     = job.service_description || 'the job'
    const amount      = job.total_amount ? `$${Number(job.total_amount).toLocaleString('en-US')}` : ''
    const link        = `https://jobjefe.com/q/${job.public_token}`

    const message = `✅ *${clientName} approved your quote!*\n\n` +
      `📋 ${jobDesc}${amount ? `\n💰 ${amount}` : ''}\n\n` +
      `View details: ${link}\n\n` +
      `_Collect payment as usual — Zelle, Venmo or cash. 0% commission._`

    // Enviar WhatsApp via Twilio
    const phone = user.whatsapp_phone.replace(/[^+\d]/g, '')
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`

    const form = new URLSearchParams({
      From: TWILIO_FROM,
      To: `whatsapp:${phone}`,
      Body: message,
    })

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })

    const twilioData = await twilioRes.json()

    if (twilioData.error_code) {
      console.error('Twilio error:', twilioData)
      return new Response(`Twilio error: ${twilioData.message}`, { status: 500 })
    }

    console.log('WhatsApp sent to:', phone, '| SID:', twilioData.sid)
    return new Response(JSON.stringify({ ok: true, sid: twilioData.sid }), { status: 200 })

  } catch (e) {
    console.error('Edge function error:', e)
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
})
