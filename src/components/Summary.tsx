import type { Card, Payment, PlanResult } from '../lib/types'
import { money, money0, monthLabel } from '../lib/format'
import { useEffect, useState } from 'react'

interface Props {
  cards: Card[]
  payments: Payment[]
  plan: PlanResult
  extra: number
  onExtraChange: (v: number) => void
}

export function Summary({ cards, payments, plan, extra, onExtraChange }: Props) {
  const start = cards.reduce((s, c) => s + c.start_balance, 0)
  const now = cards.reduce((s, c) => s + Math.max(0, c.balance), 0)
  const paid = payments.reduce((s, p) => s + p.amount, 0)
  const pct = start ? Math.max(0, ((start - now) / start) * 100) : 0
  const cleared = cards.filter(c => c.balance <= 0.005).length
  const [draft, setDraft] = useState(String(extra))
  useEffect(() => setDraft(String(extra)), [extra])

  return (
    <div className="summary">
      <div className="panel">
        <div className="label">Total owed now</div>
        <div className="big">{money(now)}</div>
        <div className="muted small">Started at {money(start)}</div>
        <div className="bar" aria-hidden="true"><i style={{ width: `${pct.toFixed(1)}%` }} /></div>
        <div className="stats">
          <div><span className="label">Paid down</span><b>{pct.toFixed(1)}%</b></div>
          <div><span className="label">Payments logged</span><b>{money0(paid)}</b></div>
          <div><span className="label">Cards cleared</span><b>{cleared} of {cards.length}</b></div>
        </div>
      </div>
      <div className="panel freedom">
        <div className="label">Projected debt-free</div>
        <div className="big accent">{now <= 0.005 ? 'Debt-free' : monthLabel(plan.months - 1)}</div>
        {now > 0.005 && (
          <div className="muted small">{plan.months} more payments · about {money0(plan.interest)} more in interest</div>
        )}
        <div className="row">
          <label htmlFor="extra" className="small">Monthly budget beyond minimums</label>
          <input
            id="extra" type="number" min={0} step={25} className="num" style={{ width: 100 }}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { const v = parseFloat(draft); if (!isNaN(v) && v >= 0 && v !== extra) onExtraChange(v) }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
        </div>
        <div className="muted tiny">
          Total monthly payment: {money0(plan.budget)} (minimums {money0(plan.budget - extra)} + {money0(extra)} extra)
        </div>
      </div>
    </div>
  )
}
