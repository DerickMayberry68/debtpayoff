import type { Card, PlanResult } from './types'

/**
 * Hybrid payoff simulation from current balances.
 * Monthly budget = sum of each card's ORIGINAL minimum + extra, held constant.
 * Every open card gets its minimum; the leftover goes to cards in sort_order.
 * When a card is paid off its minimum rolls into the pool automatically.
 */
export function simulate(cards: Card[], extra: number): PlanResult {
  const live = cards.map(c => ({
    id: c.id,
    bal: Math.max(0, Number(c.balance)),
    min: Number(c.min_payment),
    apr: Number(c.apr),
    order: c.sort_order,
  }))
  const budget = live.reduce((s, c) => s + c.min, 0) + extra
  const ordered = [...live].sort((a, b) => a.order - b.order)
  const paidOffMonth: Record<string, number> = {}
  const series = [live.reduce((s, c) => s + c.bal, 0)]
  let thisMonth: Record<string, number> = {}
  let interest = 0
  let m = 0

  live.forEach(c => { if (c.bal <= 0.005) paidOffMonth[c.id] = 0 })
  const targetId = ordered.find(c => c.bal > 0.005)?.id ?? null

  while (live.some(c => c.bal > 0.005) && m < 240) {
    m++
    let pool = budget
    const pay: Record<string, number> = {}
    for (const c of live) {
      if (c.bal > 0.005) {
        const p = Math.min(c.min, c.bal)
        pay[c.id] = p
        pool -= p
      }
    }
    for (const c of ordered) {
      if (pool <= 0) break
      const room = c.bal - (pay[c.id] ?? 0)
      if (room > 0.005) {
        const p = Math.min(pool, room)
        pay[c.id] = (pay[c.id] ?? 0) + p
        pool -= p
      }
    }
    if (m === 1) thisMonth = pay
    for (const c of live) {
      if (c.bal <= 0.005) continue
      c.bal -= pay[c.id] ?? 0
      if (c.bal <= 0.005) {
        c.bal = 0
        paidOffMonth[c.id] = m
      } else {
        const i = (c.bal * c.apr) / 100 / 12
        c.bal += i
        interest += i
      }
    }
    series.push(live.reduce((s, c) => s + c.bal, 0))
  }

  return { months: m, interest, budget, targetId, thisMonth, paidOffMonth, series }
}
