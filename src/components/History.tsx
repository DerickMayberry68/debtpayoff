import { useState } from 'react'
import type { Card, Payment } from '../lib/types'
import { money } from '../lib/format'

interface Props {
  payments: Payment[]
  cards: Card[]
  onRemove: (p: Payment) => Promise<void>
}

export function History({ payments, cards, onRemove }: Props) {
  const [armed, setArmed] = useState<string | null>(null)
  if (!payments.length) return <div className="empty">No payments logged yet.</div>

  return (
    <div className="scroll-x">
      <table>
        <thead><tr><th>Date</th><th>Card</th><th className="r">Amount</th><th>Logged by</th><th /></tr></thead>
        <tbody>
          {payments.map(p => {
            const c = cards.find(x => x.id === p.card_id)
            return (
              <tr key={p.id}>
                <td className="num">{p.paid_on}</td>
                <td>{c ? <>{c.name} <span className="who">{c.owner}</span></> : 'Removed card'}</td>
                <td className="r num">{money(p.amount)}</td>
                <td className="who">{p.logged_by ?? ''}</td>
                <td className="r">
                  <button type="button" className="link" onClick={async () => {
                    if (armed !== p.id) { setArmed(p.id); setTimeout(() => setArmed(a => (a === p.id ? null : a)), 4000); return }
                    setArmed(null)
                    await onRemove(p)
                  }}>{armed === p.id ? 'Confirm remove' : 'Remove'}</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
