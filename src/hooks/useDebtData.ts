import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Card, Payment } from '../lib/types'

const num = (v: unknown) => Number(v ?? 0)

/** Loads cards, payments and settings, and re-loads whenever either of you changes something. */
export function useDebtData() {
  const [cards, setCards] = useState<Card[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [extra, setExtra] = useState(375)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [c, p, s] = await Promise.all([
      supabase.from('cards').select('*').order('sort_order'),
      supabase.from('payments').select('*').order('paid_on', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('plan_settings').select('extra_monthly').eq('id', 1).maybeSingle(),
    ])
    const err = c.error ?? p.error ?? s.error
    if (err) setError(err.message)
    else setError(null)
    if (c.data)
      setCards(c.data.map(r => ({
        ...r,
        min_payment: num(r.min_payment),
        start_balance: num(r.start_balance),
        balance: num(r.balance),
        apr: num(r.apr),
      })) as Card[])
    if (p.data) setPayments(p.data.map(r => ({ ...r, amount: num(r.amount) })) as Payment[])
    if (s.data) setExtra(num(s.data.extra_monthly))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('debt-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_settings' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { cards, payments, extra, setExtra, loading, error, reload: load }
}
