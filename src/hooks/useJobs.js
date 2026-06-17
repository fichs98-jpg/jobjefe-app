import { useCallback } from 'react'
import { sb } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useJobs() {
  const { setJobs, showToast } = useStore()

  const loadJobs = useCallback(async () => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const { data: jobs, error } = await sb
      .from('jobs')
      .select('id,service_description,status,public_token,created_at,client_name,client_phone,client_address,approved_by_name,approved_at,total_amount,scheduled_date,scheduled_time')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error(error); return }

    if (jobs?.length) {
      const ids = jobs.map(j => j.id)
      const { data: opts } = await sb
        .from('job_options')
        .select('job_id,id,label,amount,is_selected,sort_order,description')
        .in('job_id', ids)
        .order('sort_order', { ascending: true })
      jobs.forEach(j => { j.options = (opts || []).filter(o => o.job_id === j.id) })
    }
    setJobs(jobs || [])
  }, [setJobs])

  const saveJob = useCallback(async ({ desc, client, phone, address, options, scheduledDate, scheduledTime }) => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: job, error: jobErr } = await sb.from('jobs').insert({
      service_description: desc,
      client_name: client || null,
      client_phone: phone || null,
      client_address: address || null,
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime || null,
      status: 'sent',
      user_id: user.id,
    }).select().single()

    if (jobErr) throw new Error(jobErr.message)

    const { error: optsErr } = await sb.from('job_options').insert(
      options.map((o, i) => ({ ...o, job_id: job.id, sort_order: i + 1 }))
    )
    if (optsErr) throw new Error(optsErr.message)

    await loadJobs()
    return job
  }, [loadJobs])

  return { loadJobs, saveJob }
}
