import { useMemo, useRef, useState } from 'react'
import { supabase, configError } from './lib/supabase'
import { simulate } from './lib/plan'
import { money, monthLabel } from './lib/format'
import type { Card, Payment } from './lib/types'
import { useSession } from './hooks/useSession'
import { useDebtData } from './hooks/useDebtData'
import { Login } from './components/Login'
import { Summary } from './components/Summary'
import { ProjectionChart } from './components/ProjectionChart'
import { PlanTable } from './components/PlanTable'
import { PaymentForm } from './components/PaymentForm'
import { CardGrid } from './components/CardGrid'
import { History } from './components/History'

export default function App() {
  const { session, loading } = useSession()
  if (configError) return <div className="wrap"><p className="error">{configError}</p></div>
  if (loading) return <div className="wrap muted">Loading…</div>
  if (!session) return <Login />
  return <Tracker email={session.user.email ?? ''} />
}

function Tracker({ email }: { email: string }) {
  const { cards, payments, extra, setExtra, loading, error, reload } = useDebtData()
  const plan = useMemo(() => simulate(cards, extra), [cards, extra])
  const [toast, setToast] = useState<{ msg: string; bad?: boolean } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  function notify(msg: string, bad = false) {
    setToast({ msg, bad })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    const { error } = await action()
    if (error) notify(`Could not save: ${error.message}`, true)
    else { notify(ok); await reload() }
  }

  const logPayment = (cardId: string, amount: number, date: string) => {
    const c = cards.find(x => x.id === cardId)
    return run(() => supabase.from('payments').insert({ card_id: cardId, amount, paid_on: date }),
      `Logged ${money(amount)} to ${c?.name ?? 'card'}`)
  }

  const removePayment = (p: Payment) =>
    run(() => supabase.from('payments').delete().eq('id', p.id), 'Payment removed and balance restored')

  const updateCard = (c: Card, balance: number, apr: number) => {
    const patch: Partial<Card> & { updated_at: string } = { balance, updated_at: new Date().toISOString() }
    if (apr !== c.apr) { patch.apr = apr; patch.apr_known = true }
    return run(() => supabase.from('cards').update(patch).eq('id', c.id), `Updated ${c.name}`)
  }

  const saveExtra = (v: number) => {
    setExtra(v)
    return run(() => supabase.from('plan_settings').update({ extra_monthly: v, updated_at: new Date().toISOString() }).eq('id', 1), 'Budget saved')
  }

  const notMember = !loading && !error && cards.length === 0

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="label">Hybrid payoff plan · {cards.length} cards</div>
          <h1>Mayberry Debt Payoff</h1>
        </div>
        <div className="row small muted">
          <span>{email}</span>
          <button type="button" className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      {error && <p className="error">Could not load data: {error}</p>}
      {notMember && (
        <p className="panel">No cards found. If you just signed in, make sure <b>{email}</b> is in the
          household_members table in Supabase.</p>
      )}
      {loading && <p className="muted">Loading cards…</p>}

      {cards.length > 0 && (
        <>
          <Summary cards={cards} payments={payments} plan={plan} extra={extra} onExtraChange={saveExtra} />

          <section className="panel">
            <div className="row between">
              <h2>Projected balance</h2>
              <span className="muted tiny">From current balances, at the budget above</span>
            </div>
            <ProjectionChart series={plan.series} />
          </section>

          <section>
            <h2>{monthLabel(0)} payments</h2>
            <p className="note">Every card gets its minimum. Everything left over goes to the target. When a card is
              paid off, its payment moves to the next one.</p>
            <PlanTable cards={cards} plan={plan} />
          </section>

          <section className="panel">
            <h2>Log a payment</h2>
            <PaymentForm cards={cards} defaultCardId={plan.targetId} onSubmit={logPayment} />
            <div className="toast" role="status" style={{ color: toast?.bad ? 'var(--bad)' : 'var(--good)' }}>{toast?.msg}</div>
            <p className="note">Logging a payment lowers that card's balance. Interest gets added each month, so once a
              statement arrives, update the balance on the card below to match it.</p>
          </section>

          <section>
            <h2>Cards</h2>
            <CardGrid cards={cards} payments={payments} targetId={plan.targetId} onUpdate={updateCard} />
          </section>

          <section className="panel">
            <h2>Payment history</h2>
            <History payments={payments} cards={cards} onRemove={removePayment} />
          </section>
        </>
      )}
    </div>
  )
}
