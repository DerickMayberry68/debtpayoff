import { useEffect, useState, type FormEvent } from 'react'
import type { Card } from '../lib/types'
import { todayIso } from '../lib/format'

interface Props {
  cards: Card[]
  defaultCardId: string | null
  onSubmit: (cardId: string, amount: number, date: string) => Promise<void>
}

export function PaymentForm({ cards, defaultCardId, onSubmit }: Props) {
  const [cardId, setCardId] = useState(defaultCardId ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIso())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!cardId && defaultCardId) setCardId(defaultCardId)
  }, [defaultCardId, cardId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!cardId || !(amt > 0) || !date) return
    setBusy(true)
    await onSubmit(cardId, Math.round(amt * 100) / 100, date)
    setBusy(false)
    setAmount('')
  }

  return (
    <form className="logform" onSubmit={submit}>
      <label>Card
        <select value={cardId} onChange={e => setCardId(e.target.value)} required>
          {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.owner})</option>)}
        </select>
      </label>
      <label>Amount
        <input type="number" min="0.01" step="0.01" required className="num" placeholder="0.00"
          value={amount} onChange={e => setAmount(e.target.value)} />
      </label>
      <label>Date
        <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
      </label>
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Log payment'}</button>
    </form>
  )
}
