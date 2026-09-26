import type { Card, PlanResult } from '../lib/types'
import { money, monthLabel } from '../lib/format'
import { StatusChip } from './StatusChip'

export function PlanTable({ cards, plan }: { cards: Card[]; plan: PlanResult }) {
  return (
    <div className="panel flush">
      <div className="scroll-x">
        <table>
          <thead>
            <tr><th>#</th><th>Card</th><th className="r">Balance</th><th className="r">APR</th>
              <th className="r">Pay this month</th><th className="r">Paid off</th><th>Status</th></tr>
          </thead>
          <tbody>
            {cards.map((c, i) => {
              const paid = c.balance <= 0.005
              const target = !paid && c.id === plan.targetId
              const done = plan.paidOffMonth[c.id]
              return (
                <tr key={c.id} className={target ? 'target' : undefined}>
                  <td className="num muted">{i + 1}</td>
                  <td><div>{c.name}</div><div className="who">{c.owner}</div></td>
                  <td className="r num">{money(Math.max(0, c.balance))}</td>
                  <td className="r num">
                    {c.apr.toFixed(1)}%{' '}
                    {!c.apr_known && <span className="chip est" title="Estimated. Update it from the card's app.">est</span>}
                  </td>
                  <td className="r num"><b>{paid ? '—' : money(plan.thisMonth[c.id] ?? 0)}</b></td>
                  <td className="r num muted">{paid ? 'Done' : done ? monthLabel(done - 1) : '—'}</td>
                  <td><StatusChip paid={paid} target={target} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
