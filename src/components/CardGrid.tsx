import { useState, type FormEvent } from 'react'
import type { Card, Payment } from '../lib/types'
import { money, money0 } from '../lib/format'
import { StatusChip } from './StatusChip'

interface Props {
  cards: Card[]
  payments: Payment[]
  targetId: string | null
  onUpdate: (card: Card, balance: number, apr: number) => Promise<void>
}

export function CardGrid({ cards, payments, targetId, onUpdate }: Props) {
  return (
    <div className="cards">
      {cards.map((c, i) => (
        <CardTile key={c.id} card={c} index={i}
          target={c.id === targetId && c.balance > 0.005}
          logged={payments.filter(p => p.card_id === c.id).reduce((s, p) => s + p.amount, 0)}
          onUpdate={onUpdate} />
      ))}
    </div>
  )
}

function CardTile({ card: c, index, target, logged, onUpdate }:
  { card: Card; index: number; target: boolean; logged: number; onUpdate: Props['onUpdate'] }) {
  const paid = c.balance <= 0.005
  const bal = Math.max(0, c.balance)
  const pct = c.start_balance ? Math.min(100, Math.max(0, ((c.start_balance - bal) / c.start_balance) * 100)) : 0
  const [balDraft, setBalDraft] = useState(bal.toFixed(2))
  const [aprDraft, setAprDraft] = useState(String(c.apr))
  const [open, setOpen] = useState(false)

  function toggle(isOpen: boolean) {
    if (isOpen) { setBalDraft(bal.toFixed(2)); setAprDraft(String(c.apr)) }
    setOpen(isOpen)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    const nb = parseFloat(balDraft), na = parseFloat(aprDraft)
    if (isNaN(nb) || isNaN(na)) return
    await onUpdate(c, nb, na)
    setOpen(false)
  }

  return (
    <div className={`card${target ? ' is-target' : ''}${paid ? ' is-paid' : ''}`}>
      <div className="top">
        <div>
          <div className="name">{index + 1}. {c.name}</div>
          <div className="who">{c.owner} · min {money0(c.min_payment)}</div>
        </div>
        <StatusChip paid={paid} target={target} idle="Queued" />
      </div>
      <div className="bal">{money(bal)}</div>
      <div className="bar"><i style={{ width: `${pct.toFixed(1)}%` }} /></div>
      <div className="meta">
        <span>{pct.toFixed(0)}% of {money0(c.start_balance)}</span>
        <span>{c.apr.toFixed(1)}% APR{c.apr_known ? '' : ' (est.)'}</span>
        <span>{money0(logged)} logged</span>
      </div>
      <details open={open} onToggle={e => toggle((e.target as HTMLDetailsElement).open)}>
        <summary>Update from statement</summary>
        <form className="edit" onSubmit={save}>
          <label>Balance
            <input type="number" step="0.01" min="0" className="num" value={balDraft} onChange={e => setBalDraft(e.target.value)} />
          </label>
          <label>APR %
            <input type="number" step="0.01" min="0" className="num" value={aprDraft} onChange={e => setAprDraft(e.target.value)} />
          </label>
          <button type="submit" className="ghost">Save</button>
        </form>
      </details>
    </div>
  )
}
